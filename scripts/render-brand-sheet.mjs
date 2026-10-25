// Renders the brand elements where the app uses them (the loading ripple,
// the alarm rows, and the pulsing cue rings) in light,
// dark, and high contrast to one preview sheet,
// design/previews/brand-elements.png. Drawn from the same shape data as
// the app (src/components/brand/geometry.ts) and the same theme tokens.
//
// Run: node scripts/render-brand-sheet.mjs
// Needs Node 23.6+ (to load the .ts files) and Google Chrome.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  clockSunShape,
  PULSE_FALL_MS,
  PULSE_RISE_MS,
  PULSE_SCALE,
  ringDots,
  RINGS_VIEW,
  RIPPLE_CENTER,
  RIPPLE_CENTER_R,
  RIPPLE_DOT_R,
  RIPPLE_STILL,
  RIPPLE_VIEW,
  rippleOpacity,
  rippleRings,
  SUN_CENTER,
  SUN_VIEW,
} from '../src/components/brand/geometry.ts';
import { darkPalette, darkTheme, highContrastTheme, lightTheme, palette } from '../src/constants/theme.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design/previews/brand-elements.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const IMAGE = `file://${join(ROOT, 'assets/icons/weather-icons/02-partly-cloudy.png')}`;

// The Alarms tab's own colors (src/features/alarms/alarm-colors.ts).
const THEMES = [
  {
    label: 'Light',
    theme: lightTheme,
    alarm: { accent: palette.deepBlue, switchOff: palette.gray, thumbOn: palette.white, thumbOff: palette.white, border: 0 },
  },
  {
    label: 'Dark',
    theme: darkTheme,
    alarm: { accent: darkPalette.yellow, switchOff: darkPalette.gray, thumbOn: darkPalette.navy, thumbOff: darkPalette.white, border: 0 },
  },
  {
    label: 'High contrast',
    theme: highContrastTheme,
    alarm: { accent: palette.sun, switchOff: palette.white, thumbOn: palette.ink, thumbOff: palette.ink, border: 2 },
  },
];

const COLUMN_W = 400;
const PAD = 28;

const columns = THEMES.map(({ label, theme, alarm }) => {
  const { colors, illustration } = theme;
  const cardBorder = alarm.border ? `border:${alarm.border}px solid ${colors.textPrimary};` : '';
  const card = `background:${colors.card};${cardBorder}`;
  return `<section style="background:${colors.background};color:${colors.textPrimary}">
    <h2>${label}</h2>

    <h3 style="color:${colors.textSecondary}">Loading ripple (each ring's peak, Reduce Motion)</h3>
    <div class="pulses">
      ${[840, 1240, 1640].map((ms) => ripple(84, (ring) => rippleOpacity(ring, ms), colors, illustration, `${ms} ms`)).join('')}
      ${ripple(84, () => RIPPLE_STILL, colors, illustration, 'still')}
    </div>

    <h3 style="color:${colors.textSecondary}">Alarm rows (on, off)</h3>
    <div class="list" style="${card}">
      ${alarmRow({ time: '7:30', period: 'AM', subtitle: 'Alarm, Weekdays', hour: 7, minute: 30, on: true }, theme, alarm)}
      ${alarmRow({ time: '9:45', period: 'PM', subtitle: 'Wind down, Every day', hour: 21, minute: 45, on: false }, theme, alarm, true)}
    </div>

    <h3 style="color:${colors.textSecondary}">Cue rings on a strong tap</h3>
    <div class="pulses">
      ${pulseFrame(0, 'tap at 0 ms', illustration)}
      ${pulseFrame(1, `peak at ${PULSE_RISE_MS} ms`, illustration)}
      ${pulseFrame(0.25, `settling, ${PULSE_RISE_MS + PULSE_FALL_MS / 2} ms`, illustration)}
    </div>
  </section>`;
}).join('');

const width = THEMES.length * COLUMN_W;
const height = 720;
const html = `<!doctype html><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${width}px; font-family: -apple-system, system-ui, sans-serif; background: #fff; }
  main { display: flex; }
  section { width: ${COLUMN_W}px; height: ${height}px; padding: ${PAD}px; display: flex; flex-direction: column; gap: 10px; }
  h2 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  h3 { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 12px; }
  .header { display: flex; align-items: center; justify-content: space-between; }
  .list { border-radius: 16px; overflow: hidden; }
  .row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; min-height: 88px; }
  .time { font-size: 52px; font-weight: 300; font-variant-numeric: tabular-nums; }
  .period { font-size: 26px; margin-left: 2px; }
  .grow { flex: 1; }
  .small { font-size: 15px; }
  .pulses { display: flex; justify-content: space-between; }
  figure { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; }
  .stack { position: relative; }
  .stack > * { position: absolute; }
</style><main>${columns}</main>`;

const work = mkdtempSync(join(tmpdir(), 'brand-sheet-'));
const page = join(work, 'sheet.html');
writeFileSync(page, html);
mkdirSync(dirname(OUT), { recursive: true });
execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--force-device-scale-factor=2',
  `--window-size=${width},${height}`,
  `--screenshot=${OUT}`,
  `file://${page}`,
], { stdio: 'ignore' });
console.log(`Wrote ${OUT} (${width * 2}x${height * 2})`);

// Same drawing as src/components/brand/clock-sun.tsx.
function sun(size, hour, minute, ill, { dimmed = false } = {}) {
  const s = clockSunShape(size, hour, minute);
  const c = SUN_CENTER;
  const face = dimmed ? 'none' : ill.sunFace;
  const edge = dimmed ? ill.dots : ill.sun;
  const hands = dimmed ? ill.dots : ill.hands;
  const line = (end) =>
    `<line x1="${c}" y1="${c}" x2="${end.x2}" y2="${end.y2}" stroke="${hands}" stroke-width="${s.handWidth}" stroke-linecap="round"/>`;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${SUN_VIEW} ${SUN_VIEW}">
    <circle cx="${c}" cy="${c}" r="${s.r}" fill="${face}" stroke="${edge}" stroke-width="${s.edgeWidth}"/>
    ${s.ticks.map((t) => `<circle cx="${t.x}" cy="${t.y}" r="${t.r}" fill="${hands}"/>`).join('')}
    ${line(s.hour)}${line(s.minute)}<circle cx="${c}" cy="${c}" r="${s.pin}" fill="${hands}"/></svg>`;
}

// Same drawing as src/components/brand/ripple-loader.tsx, with each ring at
// the opacity `opacityOf(ring)` gives.
function ripple(size, opacityOf, colors, ill, caption) {
  const rings = rippleRings()
    .map((dots, ring) => `<g fill="${ill.dots}" opacity="${opacityOf(ring).toFixed(2)}">${dots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${RIPPLE_DOT_R}"/>`).join('')}</g>`)
    .join('');
  const center = `<circle cx="${RIPPLE_CENTER}" cy="${RIPPLE_CENTER}" r="${RIPPLE_CENTER_R}" fill="${colors.accent}"/>`;
  return `<figure><svg width="${size}" height="${size}" viewBox="0 0 ${RIPPLE_VIEW} ${RIPPLE_VIEW}">${rings}${center}</svg><figcaption>${caption}</figcaption></figure>`;
}

// Same drawing as src/components/brand/dot-rings.tsx at a pulse of
// `strength` (0 = at rest), with the cue screens' PNG in the middle.
function pulseFrame(strength, caption, ill) {
  const size = 104;
  const dots = ringDots(6)
    .map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r}" fill="${ill.dots}"/>`)
    .join('');
  const scale = 1 + PULSE_SCALE * strength;
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${RINGS_VIEW} ${RINGS_VIEW}" style="transform:scale(${scale})">${dots}</svg>`;
  const image = `<img src="${IMAGE}" width="${size / 2}" height="${size / 2}">`;
  return `<figure>${centered(size, svg, image)}<figcaption>${caption}</figcaption></figure>`;
}

function centered(size, back, front) {
  const half = (inner) => `style="left:50%;top:50%;transform:translate(-50%,-50%)${inner}"`;
  return `<div class="stack" style="width:${size}px;height:${size}px">
    <div ${half('')}>${back}</div>${front ? `<div ${half('')} style="line-height:0">${front}</div>` : ''}</div>`;
}

// Like src/features/alarms/alarm-row.tsx, with a drawn switch.
function alarmRow(a, theme, alarm, divider = false) {
  const { colors, illustration } = theme;
  const text = a.on ? colors.textPrimary : colors.textSecondary;
  const track = a.on ? alarm.accent : alarm.switchOff;
  const thumb = a.on ? alarm.thumbOn : alarm.thumbOff;
  const line = divider ? `border-top:1px solid ${colors.border};` : '';
  return `<div class="row" style="${line}">
    ${sun(44, a.hour, a.minute, illustration, { dimmed: !a.on })}
    <div class="grow" style="color:${text}">
      <div><span class="time">${a.time}</span><span class="period">${a.period}</span></div>
      <div class="small" style="color:${colors.textSecondary}">${a.subtitle}</div>
    </div>
    <svg width="51" height="31"><rect width="51" height="31" rx="15.5" fill="${track}"/>
      <circle cx="${a.on ? 35.5 : 15.5}" cy="15.5" r="13.5" fill="${thumb}"/></svg>
  </div>`;
}
