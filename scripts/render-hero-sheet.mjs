// Renders every Weather hero variant in light, dark, and high contrast to
// one contact sheet, design/previews/hero-variants.png, from the same scene
// data the app draws (src/components/hero/scene.ts). Also fails if a scene
// covers the clock hands or puts touching dots of different colors
// together.
//
// Run: node scripts/render-hero-sheet.mjs
// Needs Node 23.6+ (to load the .ts files) and Google Chrome.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildHeroScene, HAND_STROKE, HERO_VIEW, HOUR_HAND, MINUTE_HAND, sceneProblems } from '../src/components/hero/scene.ts';
import { CONDITION_IDS } from '../src/constants/conditions.ts';
import { darkTheme, highContrastTheme, lightTheme } from '../src/constants/theme.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design/previews/hero-variants.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const THEMES = [
  { label: 'Light', theme: lightTheme },
  { label: 'Dark', theme: darkTheme },
  { label: 'High contrast', theme: highContrastTheme },
];
// 10:10, so both hands show clearly in every preview.
const TIME = { hours: 10 + 10 / 60, minutes: 10 };

const HERO = 200;
const CELL_W = 224;
const CELL_H = 256;
const LABEL_W = 150;
const PAD = 32;
const HEADER = 96;

const problems = [];
const rows = THEMES.map(({ label, theme }) => {
  const cells = CONDITION_IDS.map((id) => {
    const scene = buildHeroScene(id, theme.illustration, theme.colors.background);
    for (const problem of sceneProblems(scene)) problems.push(`${label} ${id}: ${problem}`);
    return `<figure><svg width="${HERO}" height="${HERO}" viewBox="0 0 ${HERO_VIEW} ${HERO_VIEW}">${drawScene(scene)}</svg>
      <figcaption style="color:${theme.colors.textPrimary}">${name(id)}</figcaption></figure>`;
  }).join('');
  return `<section style="background:${theme.colors.background}">
    <h2 style="color:${theme.colors.textPrimary}">${label}</h2>${cells}</section>`;
}).join('');

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const width = PAD * 2 + LABEL_W + CONDITION_IDS.length * CELL_W;
const height = HEADER + THEMES.length * CELL_H + PAD;
const html = `<!doctype html><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${width}px; font-family: -apple-system, system-ui, sans-serif; background: #fff; color: #090D27; }
  header { height: ${HEADER}px; padding: 28px ${PAD}px 0; }
  header h1 { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; }
  header p { font-size: 15px; color: #484A57; margin-top: 4px; }
  section { display: flex; align-items: center; height: ${CELL_H}px; padding: 0 ${PAD}px; }
  h2 { width: ${LABEL_W}px; flex: none; font-size: 20px; font-weight: 700; }
  figure { width: ${CELL_W}px; flex: none; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  figcaption { font-size: 15px; font-weight: 600; }
</style>
<header><h1>AtmosHear · Weather hero variants</h1>
<p>All 13 conditions in light, dark, and high contrast, drawn from src/components/hero/scene.ts. Clock shows 10:10.</p></header>
${rows}`;

const work = mkdtempSync(join(tmpdir(), 'hero-sheet-'));
const page = join(work, 'sheet.html');
writeFileSync(page, html);
mkdirSync(dirname(OUT), { recursive: true });
execFileSync(CHROME, [
  '--headless',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=2',
  `--window-size=${width},${height}`,
  `--screenshot=${OUT}`,
  `file://${page}`,
], { stdio: 'ignore' });
console.log(`Wrote ${OUT} (${width * 2}x${height * 2})`);

// Same drawing as src/components/weather-hero.tsx, as an SVG string.
function drawScene(scene) {
  return [...scene.back.map(mark), drawSun(scene.sun), ...scene.front.map(mark)].join('');
}

function mark(m) {
  const opacity = m.opacity === undefined ? '' : ` opacity="${m.opacity}"`;
  if (m.kind === 'dot') {
    const stroke = m.stroke ? ` stroke="${m.stroke}" stroke-width="1.2"` : '';
    return `<circle cx="${m.x}" cy="${m.y}" r="${m.r}" fill="${m.color}"${stroke}${opacity}/>`;
  }
  const rx = Math.min(m.w, m.h) / 2;
  return `<rect x="${m.x - m.w / 2}" y="${m.y - m.h / 2}" width="${m.w}" height="${m.h}" rx="${rx}" fill="${m.color}"${opacity}/>`;
}

function drawSun(sun) {
  const { x, y, r } = sun;
  const hand = (turns, length) => {
    const angle = turns * 2 * Math.PI - Math.PI / 2;
    return `<line x1="${x}" y1="${y}" x2="${x + length * Math.cos(angle)}" y2="${y + length * Math.sin(angle)}" stroke="${sun.hands}" stroke-width="${r * HAND_STROKE}" stroke-linecap="round"/>`;
  };
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI;
    const tr = ((i % 3 === 0 ? 2 : 1.2) * r) / 38;
    return `<circle cx="${x + ((30 * r) / 38) * Math.cos(angle)}" cy="${y + ((30 * r) / 38) * Math.sin(angle)}" r="${tr}" fill="${sun.ticks}" opacity="${sun.tickOpacity}"/>`;
  }).join('');
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${sun.face}"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${sun.edge}" stroke-width="${(4 * r) / 38}" opacity="${sun.edgeOpacity}"/>
    ${ticks}${hand(TIME.hours / 12, r * HOUR_HAND)}${hand(TIME.minutes / 60, r * MINUTE_HAND)}
    <circle cx="${x}" cy="${y}" r="${(3.5 * r) / 38}" fill="${sun.hands}"/>`;
}

function name(id) {
  const text = id.replace(/-/g, ' ');
  return text[0].toUpperCase() + text.slice(1);
}
