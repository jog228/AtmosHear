// Renders all 13 condition icons at 24pt and 48pt, in the accent color and
// in grayscale, to one contact sheet, design/previews/condition-icons.png,
// from the same dot data the app draws
// (src/components/icons/condition-shapes.ts). Use it to check that no two
// icons share a silhouette.
//
// Run: node scripts/render-icon-sheet.mjs
// Needs Node 23.6+ (to load the .ts files) and Google Chrome.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The app imports its own .ts files without the extension (Metro adds it);
// Node needs it spelled out.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL?.endsWith('.ts')) {
      return next(`${specifier}.ts`, context);
    }
    return next(specifier, context);
  },
});

const { conditionIconDots } = await import('../src/components/icons/condition-shapes.ts');
const { CONDITION_IDS } = await import('../src/constants/conditions.ts');
const { lightTheme } = await import('../src/constants/theme.ts');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'design/previews/condition-icons.png');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const { colors } = lightTheme;
const CELL = 96;
const LABEL_W = 170;
const PAD = 32;
const ROWS = [
  { label: '24pt', size: 24, gray: false },
  { label: '48pt', size: 48, gray: false },
  { label: '24pt grayscale', size: 24, gray: true },
  { label: '48pt grayscale', size: 48, gray: true },
];

// Same drawing as src/components/icons/dot-icon.tsx: one color, opacity
// per run of dots.
function icon(dots, size) {
  const circles = dots
    .map(([cx, cy, r, opacity]) => `<circle cx="${cx}" cy="${cy}" r="${r}"${opacity === undefined ? '' : ` opacity="${opacity}"`}/>`)
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${colors.accent}">${circles}</svg>`;
}

const names = CONDITION_IDS.map((id) => `<div class="cell name">${id.replace(/-/g, ' ')}</div>`).join('');
const rows = ROWS.map(
  ({ label, size, gray }) => `<div class="row${gray ? ' gray' : ''}">
    <div class="label">${label}</div>
    ${CONDITION_IDS.map((id) => `<div class="cell">${icon(conditionIconDots[id], size)}</div>`).join('')}
  </div>`,
).join('');

const width = PAD * 2 + LABEL_W + CONDITION_IDS.length * CELL;
const height = 96 + 36 + ROWS.length * 80 + PAD;
const html = `<!doctype html><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${width}px; padding: 28px ${PAD}px; font-family: -apple-system, system-ui, sans-serif;
    background: ${colors.card}; color: ${colors.textPrimary}; }
  h1 { font-size: 26px; font-weight: 700; }
  p { font-size: 15px; color: ${colors.textSecondary}; margin: 4px 0 20px; }
  .row { display: flex; align-items: center; height: 80px; }
  .row.gray svg { filter: grayscale(1) contrast(0.6); }
  .label { width: ${LABEL_W}px; flex: none; font-size: 15px; font-weight: 600; }
  .cell { width: ${CELL}px; flex: none; display: flex; justify-content: center; }
  .name { font-size: 12px; font-weight: 600; text-align: center; text-transform: capitalize; }
</style>
<h1>AtmosHear · Condition icons</h1>
<p>From src/components/icons/condition-shapes.ts, in the light theme's accent color.</p>
<div class="row" style="height:36px"><div class="label"></div>${names}</div>
${rows}`;

const work = mkdtempSync(join(tmpdir(), 'icon-sheet-'));
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
