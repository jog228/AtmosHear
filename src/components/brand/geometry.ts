// The brand illustrations as plain data: dots and clock hands in a
// fixed view box, scaled to any size by the components next to this file.
// Pure (no imports), so scripts/render-brand-sheet.mjs draws exactly the
// same shapes outside the app. Brand code never imports weather or alarm
// code, so any screen can use it.

// --- Clock sun -----------------------------------------------------------

// Drawn on an 80x80 grid: a 38-radius face with a 4-wide edge, so the
// edge's outside reaches the box.
export const SUN_VIEW = 80;
const SUN_C = SUN_VIEW / 2;
const SUN_EDGE = 4;

// Below this size (in points) the tick dots would be specks, so they're
// left out, and the hands get thicker so they still read.
export const SUN_TICKS_MIN_SIZE = 40;
const MIN_HAND_POINTS = 1.5;

export type ClockSunShape = {
  r: number;
  edgeWidth: number;
  ticks: { x: number; y: number; r: number }[];
  hour: { x2: number; y2: number };
  minute: { x2: number; y2: number };
  handWidth: number;
  pin: number;
};

// The clock-face sun from design/frames/06_Weather_home.png. `hour` is
// 0-23, `minute` 0-59.
export function clockSunShape(size: number, hour: number, minute: number): ClockSunShape {
  const perPoint = SUN_VIEW / size;
  const edgeWidth = SUN_EDGE;
  const r = SUN_C - edgeWidth / 2;
  const k = r / 38;
  const hand = (turns: number, length: number) => {
    const angle = turns * 2 * Math.PI - Math.PI / 2;
    return { x2: round(SUN_C + length * Math.cos(angle)), y2: round(SUN_C + length * Math.sin(angle)) };
  };
  // Tick dots, bigger at 12, 3, 6, and 9.
  const ticks =
    size < SUN_TICKS_MIN_SIZE
      ? []
      : Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 2 * Math.PI;
          return {
            x: round(SUN_C + 30 * k * Math.cos(angle)),
            y: round(SUN_C + 30 * k * Math.sin(angle)),
            r: round((i % 3 === 0 ? 2 : 1.2) * k),
          };
        });
  const hours = (hour % 12) + minute / 60;
  return {
    r,
    edgeWidth,
    ticks,
    hour: hand(hours / 12, 16 * k),
    minute: hand(minute / 60, 25 * k),
    handWidth: round(Math.max(4.5 * k, MIN_HAND_POINTS * perPoint)),
    pin: round(Math.max(3.5 * k, MIN_HAND_POINTS * perPoint)),
  };
}

export const SUN_CENTER = SUN_C;

// --- Ripple loader -------------------------------------------------------

// The loading animation ("Loading animation · 1 · Ripple"), on a 160x160
// grid: a center dot and three rings of same-size dots that brighten in
// turn, so light ripples outward.
export const RIPPLE_VIEW = 160;
const RIPPLE_C = RIPPLE_VIEW / 2;
export const RIPPLE_CENTER_R = 6;
export const RIPPLE_DOT_R = 3;
const RIPPLE_RINGS = [
  { count: 8, radius: 22 },
  { count: 14, radius: 42 },
  { count: 20, radius: 62 },
];

// Each ring's dots, first dot at the top.
export function rippleRings(): { x: number; y: number }[][] {
  return RIPPLE_RINGS.map(({ count, radius }) =>
    Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (i / count) * 2 * Math.PI;
      return { x: round(RIPPLE_C + radius * Math.cos(angle)), y: round(RIPPLE_C + radius * Math.sin(angle)) };
    }),
  );
}
export const RIPPLE_CENTER = RIPPLE_C;

// Each ring's opacity goes RIPPLE_MIN -> 1 -> RIPPLE_MIN over RIPPLE_LOOP_MS
// (ease-in-out), peaking RIPPLE_PEAK of the way through; ring 2 starts 0.4 s
// after ring 1 and ring 3 0.8 s after. With Reduce Motion every ring holds
// at RIPPLE_STILL.
export const RIPPLE_LOOP_MS = 2400;
export const RIPPLE_PEAK = 0.35;
export const RIPPLE_MIN = 0.18;
export const RIPPLE_DELAYS_MS = [0, 400, 800];
export const RIPPLE_STILL = 0.6;

// A ring's opacity `ms` after the animation starts (for previews; the app
// runs the same curve in Reanimated).
export function rippleOpacity(ring: number, ms: number): number {
  const t = ms - RIPPLE_DELAYS_MS[ring];
  if (t < 0) return RIPPLE_MIN;
  const phase = (t % RIPPLE_LOOP_MS) / RIPPLE_LOOP_MS;
  const rising = phase < RIPPLE_PEAK;
  const local = rising ? phase / RIPPLE_PEAK : (phase - RIPPLE_PEAK) / (1 - RIPPLE_PEAK);
  // Ease in-out (cubic), like Reanimated's Easing.inOut(Easing.cubic).
  const eased = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
  return rising ? RIPPLE_MIN + (1 - RIPPLE_MIN) * eased : 1 - (1 - RIPPLE_MIN) * eased;
}

// --- Dot rings -----------------------------------------------------------

// Drawn on a 240x240 grid. Frame 11: evenly spaced rings of
// same-size dots around a hollow middle. Each dot has the index of its
// ring, so rings can alternate colors.
export type RingDot = { x: number; y: number; r: number; ring: number };

export const RINGS_VIEW = 240;
const C = RINGS_VIEW / 2;
// The hollow middle's radius on the grid: anything placed in the middle
// should stay inside it (a little under half the size).
export const RINGS_HOLLOW = 50;

export function ringDots(count: number): RingDot[] {
  const step = count > 1 ? (110 - RINGS_HOLLOW - 4) / (count - 1) : 0;
  const dots: RingDot[] = [];
  for (let ring = 0; ring < count; ring++) {
    const radius = RINGS_HOLLOW + 4 + ring * step;
    const n = Math.round((2 * Math.PI * radius) / 10.5);
    // Every other ring is offset half a step, like the frame.
    const offset = ring % 2 === 0 ? 0 : Math.PI / n;
    for (let i = 0; i < n; i++) {
      const angle = offset + (i / n) * 2 * Math.PI;
      dots.push({ x: round(C + radius * Math.cos(angle)), y: round(C + radius * Math.sin(angle)), r: 3, ring });
    }
  }
  return dots;
}

// How a pulse looks: the rings grow by up to PULSE_SCALE (at strength 1),
// reach it in PULSE_RISE_MS, and settle back over PULSE_FALL_MS. Scale
// only, never brightness, so even a fast rumble can't flash.
export const PULSE_SCALE = 0.1;
export const PULSE_RISE_MS = 40;
export const PULSE_FALL_MS = 240;

// --- Helpers -------------------------------------------------------------

function round(n: number) {
  return Math.round(n * 100) / 100;
}
