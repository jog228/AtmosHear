import type { ConditionId } from '../../constants/conditions';
import type { IllustrationColors } from '../../constants/theme';

// The Weather hero as plain data: the dot field behind the clock-face sun,
// the sun, and the marks in front of it. Pure (type imports only), so
// scripts/render-hero-sheet.mjs can draw the same scenes outside the app.
//
// Follows the teammate's frames in design/frames/: the weather is the dot
// field's pattern and color, not glyphs stacked on top (06 for the base
// composition, 10 for the storm rings, 11 for the alert rings).

// A round dot, or a pill: a rounded rect centered on x, y (tall for rain
// streaks, wide for wind dashes).
export type Mark =
  | { kind: 'dot'; x: number; y: number; r: number; color: string; opacity?: number; stroke?: string }
  | { kind: 'pill'; x: number; y: number; w: number; h: number; color: string; opacity?: number };

export type SunStyle = {
  x: number;
  y: number;
  r: number;
  face: string;
  edge: string;
  // Faint for overcast: the sun as an outline behind the clouds.
  edgeOpacity: number;
  ticks: string;
  tickOpacity: number;
  hands: string;
};

export type HeroScene = { back: Mark[]; sun: SunStyle; front: Mark[] };

// Drawn on a 240x240 grid.
export const HERO_VIEW = 240;
const C = HERO_VIEW / 2;
const FIELD_R = 114;
const SUN_R = 38;

// Hands, as a share of the sun's radius (with half their stroke), and how
// far from the sun's center anything in front of it must stay so both
// hands always show, whatever the time.
export const HOUR_HAND = 16 / 38;
export const MINUTE_HAND = 25 / 38;
export const HAND_STROKE = 4.5 / 38;
const HAND_CLEARANCE = 28 / 38;

// One cloud for every cloudy scene, about 55% of the field's width, lower
// left, past the field's edge, over the sun's lower-left rim but clear of
// the hands. No outline: it sits straight on the dots, like frame 06.
const CLOUD_X = 0;
const CLOUD_Y = 124;
const CLOUD_BOTTOM = CLOUD_Y + 60;

export function buildHeroScene(condition: ConditionId, colors: IllustrationColors, background: string): HeroScene {
  const sun = defaultSun(colors);
  switch (condition) {
    case 'clear':
      return { back: burst(colors, { rays: 36, amberTo: 64, middleTo: 94, scale: 1 }), sun, front: [] };
    case 'extreme-heat':
      return { back: burst(colors, { rays: 48, amberTo: 92, middleTo: 106, scale: 1.15 }), sun, front: [] };
    case 'partly-cloudy':
      return { back: halftone(colors.dots), sun, front: cloud(colors.cloud) };
    case 'overcast':
      return {
        back: halftone(colors.dots, { opacity: 0.4 }),
        // Filled with the page color, so the dimmed dots don't run across
        // the clock face. The hands take the cloud color, which always
        // stands out from the page.
        sun: { ...sun, face: background, edgeOpacity: 0.45, ticks: colors.cloud, tickOpacity: 0.45, hands: colors.cloud },
        front: [...cloud(colors.cloud, 138, 150, 0.75), ...cloud(colors.cloud)],
      };
    case 'light-rain':
      return { back: [...halftone(colors.dots, { skip: falling(150) }), ...rain(colors.dots, 'light')], sun, front: cloud(colors.cloud) };
    case 'heavy-rain':
      return { back: [...halftone(colors.dots, { skip: falling(172) }), ...rain(colors.streak, 'heavy')], sun, front: cloud(colors.cloud) };
    case 'snow':
      return {
        back: [...halftone(colors.dots, { skip: falling(160), sparse: true, opacity: 0.7 }), ...snow(colors)],
        sun,
        front: cloud(colors.cloud),
      };
    case 'sleet':
      return { back: [...halftone(colors.dots, { skip: falling(160) }), ...sleet(colors)], sun, front: cloud(colors.cloud) };
    case 'thunderstorm':
      return storm(colors);
    case 'fog':
      return fog(colors);
    case 'wind':
      return { back: wind(colors.dots, sun), sun, front: [] };
    case 'extreme-cold':
      return { back: crystal(colors), sun, front: [] };
    case 'severe-alert':
      return alert(colors);
  }
}

function defaultSun(colors: IllustrationColors): SunStyle {
  return {
    x: C,
    y: C,
    r: SUN_R,
    face: colors.sunFace,
    edge: colors.sun,
    edgeOpacity: 1,
    ticks: colors.hands,
    tickOpacity: 1,
    hands: colors.hands,
  };
}

// --- The base field (frame 06) -------------------------------------------

// Rings of dots from just outside the sun to the edge. Dots shrink outward
// and are a little bigger on the right, like halftone shading.
function halftone(
  color: string,
  { skip, sparse, opacity }: { skip?: (x: number, y: number) => boolean; sparse?: boolean; opacity?: number } = {},
): Mark[] {
  const marks: Mark[] = [];
  const rings = 9;
  for (let k = 0; k < rings; k++) {
    const radius = 50 + k * 8;
    const t = k / (rings - 1);
    const base = 4.4 - t * 2.9;
    const count = Math.round((2 * Math.PI * radius) / 10.5);
    // Every other ring is offset half a step, so dots don't line up.
    const offset = k % 2 === 0 ? 0 : Math.PI / count;
    for (let i = 0; i < count; i++) {
      if (sparse && (i + k) % 2 === 1) continue;
      const angle = offset + (i / count) * 2 * Math.PI;
      const x = C + radius * Math.cos(angle);
      const y = C + radius * Math.sin(angle);
      if (skip?.(x, y)) continue;
      marks.push(dot(x, y, base * (1 + 0.22 * Math.cos(angle)), color, opacity));
    }
  }
  return marks;
}

// The cloud, as overlapping circles on a rounded base. `x`, `y` is its top
// left; at scale 1 it's 125 wide and 60 tall.
function cloud(color: string, x = CLOUD_X, y = CLOUD_Y, scale = 1): Mark[] {
  const at = (cx: number, cy: number, r: number) => dot(x + cx * scale, y + cy * scale, r * scale, color);
  return [
    at(22, 40, 18),
    at(60, 28, 28),
    at(96, 40, 20),
    { kind: 'pill', x: round(x + 62.5 * scale), y: round(y + 47 * scale), w: round(125 * scale), h: round(26 * scale), color },
  ];
}

// --- Precipitation: the field below the cloud changes ---------------------

// The area under the cloud where rain or snow replaces the field's dots.
function falling(right: number) {
  return (x: number, y: number) => y >= CLOUD_BOTTOM - 6 && x <= right;
}

// Short vertical streaks in staggered columns. Light rain: sparse and
// short, in the field's color. Heavy: dense, long, and darker.
function rain(color: string, kind: 'light' | 'heavy'): Mark[] {
  const s =
    kind === 'light'
      ? { top: 194, rowGap: 15, colGap: 14, stagger: 7, right: 150, w: 3.2, h: 9 }
      : { top: 194, rowGap: 12, colGap: 9, stagger: 4.5, right: 172, w: 3.4, h: 13 };
  const marks: Mark[] = [];
  for (let row = 0; s.top + row * s.rowGap < HERO_VIEW; row++) {
    const y = s.top + row * s.rowGap;
    for (let x = 6 + (row % 2) * s.stagger; x <= s.right; x += s.colGap) {
      if (inField(x, y, s.h / 2 + 1)) marks.push({ kind: 'pill', x: round(x), y, w: s.w, h: s.h, color });
    }
  }
  return marks;
}

// Sparse, soft, round flakes drifting under the cloud, a few of them big.
function snow(colors: IllustrationColors): Mark[] {
  const marks: Mark[] = [];
  let n = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 9; col++, n++) {
      const x = 10 + col * 18 + (row % 2) * 9 + (noise(n) - 0.5) * 10;
      const y = 194 + row * 13 + (noise(n + 50) - 0.5) * 8;
      const r = n % 5 === 2 ? 5.4 : 2.4 + noise(n + 100) * 1.2;
      if (x <= 152 && inField(x, y, r + 2)) marks.push(flake(colors, x, y, r));
    }
  }
  return marks;
}

// Rain streaks and round pellets, alternating.
function sleet(colors: IllustrationColors): Mark[] {
  const marks: Mark[] = [];
  for (let row = 0; 194 + row * 14 < HERO_VIEW; row++) {
    const y = 194 + row * 14;
    for (let col = 0, x = 8 + (row % 2) * 6; x <= 160; col++, x += 12) {
      if (!inField(x, y, 6)) continue;
      marks.push((row + col) % 2 === 0 ? { kind: 'pill', x, y, w: 3.2, h: 10, color: colors.dots } : flake(colors, x, y, 2.8));
    }
  }
  return marks;
}

function flake(colors: IllustrationColors, x: number, y: number, r: number): Mark {
  return { ...dot(x, y, r, colors.flake), stroke: colors.flakeEdge };
}

// --- Thunderstorm (frames 03 and 10) ------------------------------------

// Tight concentric rings, darkest at the center, with a dotted amber bolt
// through the middle. The center belongs to the bolt, so the sun moves to
// the top right, smaller, over the outer rings.
function storm(colors: IllustrationColors): HeroScene {
  const sun: SunStyle = { ...defaultSun(colors), x: 190, y: 50, r: 27 };
  const bolt = dottedPath(
    [
      [132, 56],
      [106, 120],
      [134, 116],
      [110, 186],
    ],
    7,
  );
  const back: Mark[] = [];
  for (let radius = 12; radius <= FIELD_R; radius += 6.6) {
    const count = Math.round((2 * Math.PI * radius) / 7);
    const color = radius > 86 ? colors.stormOuter : radius > 50 ? colors.stormMiddle : colors.stormCenter;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (radius % 2) * 0.2;
      const x = C + radius * Math.cos(angle);
      const y = C + radius * Math.sin(angle);
      // A clear gap around the bolt and the sun.
      if (bolt.some(([bx, by]) => Math.hypot(x - bx, y - by) < 7.5)) continue;
      if (Math.hypot(x - sun.x, y - sun.y) < sun.r + 6) continue;
      back.push(dot(x, y, radius < 30 ? 2.6 : 2.4, color));
    }
  }
  return { back, sun, front: bolt.map(([x, y]) => dot(x, y, 2.7, colors.bolt)) };
}

// --- Fog -----------------------------------------------------------------

// Horizontal bands of faint dots: three rows on, one off. The bands below
// the sun's hands pass in front of it, so it sits partly in the fog.
function fog(colors: IllustrationColors): HeroScene {
  const sun = defaultSun(colors);
  const back: Mark[] = [];
  const front: Mark[] = [];
  for (let row = 0; 12 + row * 7 < HERO_VIEW; row++) {
    if (row % 4 === 3) continue;
    const y = 12 + row * 7;
    const opacity = [0.35, 0.5, 0.65][Math.floor(row / 4) % 3];
    const inFront = y - sun.y >= SUN_R * HAND_CLEARANCE + 2.5;
    for (let x = 6 + (row % 2) * 4.5; x < HERO_VIEW; x += 9) {
      if (!inField(x, y, 2)) continue;
      if (!inFront && Math.hypot(x - sun.x, y - sun.y) < SUN_R + 2) continue;
      (inFront ? front : back).push(dot(x, y, 2.3, colors.dots, opacity));
    }
  }
  return { back, sun, front };
}

// --- Wind (frame 02) -----------------------------------------------------

// Rows of horizontal oval dashes of different lengths, like moving air.
function wind(color: string, sun: SunStyle): Mark[] {
  const marks: Mark[] = [];
  let n = 0;
  for (let row = 0; 12 + row * 11 < HERO_VIEW; row++) {
    const y = 12 + row * 11;
    const opacity = 0.55 + noise(row + 300) * 0.45;
    let x = 6 + noise(row + 200) * 10;
    while (x < HERO_VIEW) {
      const w = 6 + Math.round(noise(n++) * 14);
      const cx = x + w / 2;
      const clearOfSun = Math.abs(y - sun.y) > sun.r + 5 || Math.abs(cx - sun.x) > w / 2 + Math.sqrt((sun.r + 5) ** 2 - (y - sun.y) ** 2);
      if (inField(x, y, 2) && inField(x + w, y, 2) && clearOfSun) {
        marks.push({ kind: 'pill', x: round(cx), y, w, h: 3.6, color, opacity: round(opacity) });
      }
      x += w + 5 + noise(n++) * 6;
    }
  }
  return marks;
}

// --- Clear and extreme heat (frame 04) ----------------------------------

// A radial burst: dots along rays, amber near the sun, then the middle and
// outer colors. Heat has more rays, more amber, and bigger dots.
function burst(
  colors: IllustrationColors,
  { rays, amberTo, middleTo, scale }: { rays: number; amberTo: number; middleTo: number; scale: number },
): Mark[] {
  const colorAt = (radius: number) => (radius < amberTo ? colors.sun : radius < middleTo ? colors.burstMiddle : colors.burstOuter);
  const marks: Mark[] = [];
  for (let ray = 0; ray < rays; ray++) {
    const angle = (ray / rays) * 2 * Math.PI;
    for (let step = 0, radius = 48; radius <= 112; step++) {
      const r = (3.6 - ((radius - 48) / 64) * 2.3) * scale;
      marks.push(dot(C + radius * Math.cos(angle), C + radius * Math.sin(angle), r, colorAt(radius)));
      const next = radius + 6.5 + step * 0.6;
      // A little more room where the color changes, so colors never touch.
      radius = colorAt(next) === colorAt(radius) ? next : next + 3;
    }
  }
  return marks;
}

// --- Extreme cold --------------------------------------------------------

// A six-point ice crystal of small, sharp dots: six arms with side
// branches, tipped with a bigger dot, and six short arms between them.
function crystal(colors: IllustrationColors): Mark[] {
  const marks: Mark[] = [];
  for (let arm = 0; arm < 6; arm++) {
    const angle = ((arm * 60 - 90) * Math.PI) / 180;
    const along = (radius: number): [number, number] => [C + radius * Math.cos(angle), C + radius * Math.sin(angle)];
    for (let radius = 46; radius <= 106; radius += 6) marks.push(dot(...along(radius), 1.6, colors.crystal));
    marks.push(dot(...along(112), 2.6, colors.crystalTip));
    // Two branches at 60 degrees on each side.
    for (const [start, length] of [
      [66, 18],
      [88, 13],
    ]) {
      for (const side of [-1, 1]) {
        const branch = angle + (side * Math.PI) / 3;
        const [sx, sy] = along(start);
        for (let d = 6; d < length - 3; d += 6) marks.push(dot(sx + d * Math.cos(branch), sy + d * Math.sin(branch), 1.3, colors.crystal));
        marks.push(dot(sx + length * Math.cos(branch), sy + length * Math.sin(branch), 2, colors.crystalTip));
      }
    }
    // A short arm halfway to the next one.
    const between = angle + Math.PI / 6;
    for (let radius = 54; radius <= 78; radius += 6) {
      marks.push(dot(C + radius * Math.cos(between), C + radius * Math.sin(between), 1.2, colors.crystal));
    }
  }
  return marks;
}

// --- Severe alert (frame 11) ---------------------------------------------

// Alternating dark and light rings on an amber disc, with the sun in the
// hollow center. The sun gets a dark edge so it shows on the amber.
function alert(colors: IllustrationColors): HeroScene {
  const back: Mark[] = [dot(C, C, FIELD_R + 4, colors.alertDisc)];
  [52, 63, 74, 85, 96, 107].forEach((radius, k) => {
    const count = Math.round((2 * Math.PI * radius) / 10.5);
    const color = k % 2 === 0 ? colors.alertLight : colors.alertDark;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (k % 2) * (Math.PI / count);
      back.push(dot(C + radius * Math.cos(angle), C + radius * Math.sin(angle), 3, color));
    }
  });
  const sun: SunStyle = { ...defaultSun(colors), edge: colors.alertDark, ticks: colors.alertDark, hands: colors.alertDark };
  return { back, sun, front: [] };
}

// --- Checks --------------------------------------------------------------

// Problems a scene must never have: something in front of the sun covering
// its hands, or two touching field marks of different colors (like navy
// dots on periwinkle). Used by the contact sheet script.
export function sceneProblems(scene: HeroScene): string[] {
  const problems: string[] = [];
  const { sun } = scene;
  const clearance = sun.r * HAND_CLEARANCE;
  for (const mark of scene.front) {
    if (distanceToMark(mark, sun.x, sun.y) < clearance) {
      problems.push(`front mark at ${mark.x},${mark.y} covers the hands`);
      break;
    }
  }
  // The alert's amber disc sits under everything on purpose.
  const field = scene.back.filter((mark) => mark.kind === 'pill' || mark.r < 20);
  for (let i = 0; i < field.length; i++) {
    for (let j = i + 1; j < field.length; j++) {
      const a = field[i];
      const b = field[j];
      if (a.color !== b.color && overlaps(a, b)) {
        problems.push(`${a.color} mark at ${a.x},${a.y} touches ${b.color} mark at ${b.x},${b.y}`);
        return problems;
      }
    }
  }
  return problems;
}

function distanceToMark(mark: Mark, x: number, y: number): number {
  if (mark.kind === 'dot') return Math.hypot(x - mark.x, y - mark.y) - mark.r;
  const dx = Math.max(Math.abs(x - mark.x) - mark.w / 2, 0);
  const dy = Math.max(Math.abs(y - mark.y) - mark.h / 2, 0);
  return Math.hypot(dx, dy);
}

function overlaps(a: Mark, b: Mark): boolean {
  const extent = (m: Mark) => (m.kind === 'dot' ? { w: m.r * 2, h: m.r * 2 } : m);
  const ea = extent(a);
  const eb = extent(b);
  return Math.abs(a.x - b.x) < (ea.w + eb.w) / 2 && Math.abs(a.y - b.y) < (ea.h + eb.h) / 2;
}

// --- Helpers -------------------------------------------------------------

function dot(x: number, y: number, r: number, color: string, opacity?: number): Extract<Mark, { kind: 'dot' }> {
  return { kind: 'dot', x: round(x), y: round(y), r: round(r), color, ...(opacity === undefined ? {} : { opacity }) };
}

// True if a point (with a margin) is inside the round field.
function inField(x: number, y: number, margin = 0): boolean {
  return Math.hypot(x - C, y - C) <= FIELD_R - margin;
}

// Points every `spacing` along a polyline.
function dottedPath(points: [number, number][], spacing: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / spacing));
    for (let s = i === 0 ? 0 : 1; s <= steps; s++) out.push([round(ax + ((bx - ax) * s) / steps), round(ay + ((by - ay) * s) / steps)]);
  }
  return out;
}

// A fixed, repeatable 0-1 "random" number, so scenes never change between
// renders.
function noise(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
