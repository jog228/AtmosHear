// The brand illustrations as plain data: dots, pills, and clock hands in a
// fixed view box, scaled to any size by the components next to this file.
// Pure (no imports), so scripts/render-brand-sheet.mjs draws exactly the
// same shapes outside the app. Brand code never imports weather or alarm
// code, so any screen can use it.

// A round dot, or a pill: a rounded rect centered on x, y (wide for wind
// dashes).
export type Mark =
  | { kind: 'dot'; x: number; y: number; r: number; opacity?: number }
  | { kind: 'pill'; x: number; y: number; w: number; h: number; opacity?: number };

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

// --- Halftone field ------------------------------------------------------

// Drawn on a 240x240 grid, in a round field.
export const FIELD_VIEW = 240;
const C = FIELD_VIEW / 2;
const FIELD_R = 114;
// With `hole`, the field leaves room for a ClockSun a third of its size
// (radius 40 on this grid) plus a gap.
const HOLE_R = 48;
const NO_HOLE_R = 12;

export type FieldPattern = 'radial' | 'rings' | 'dashes';

export function halftoneMarks(pattern: FieldPattern, hole: boolean): Mark[] {
  const inner = hole ? HOLE_R : NO_HOLE_R;
  switch (pattern) {
    case 'rings':
      return rings(inner);
    case 'radial':
      return radial(inner);
    case 'dashes':
      return dashes(inner);
  }
}

// Frame 06: rings of dots from the middle to the edge. Dots shrink outward
// and are a little bigger on the right, like halftone shading.
function rings(inner: number): Mark[] {
  const marks: Mark[] = [];
  const first = inner + 2;
  const count = Math.floor((FIELD_R - first) / 8) + 1;
  for (let k = 0; k < count; k++) {
    const radius = first + k * 8;
    const t = (radius - 50) / 64;
    const base = Math.max(1.5, 4.4 - Math.max(0, t) * 2.9);
    const dots = Math.max(6, Math.round((2 * Math.PI * radius) / 10.5));
    // Every other ring is offset half a step, so dots don't line up.
    const offset = k % 2 === 0 ? 0 : Math.PI / dots;
    for (let i = 0; i < dots; i++) {
      const angle = offset + (i / dots) * 2 * Math.PI;
      marks.push(dot(C + radius * Math.cos(angle), C + radius * Math.sin(angle), base * (1 + 0.22 * Math.cos(angle))));
    }
  }
  return marks;
}

// Frame 04: a burst of dots along rays, big near the middle and shrinking
// outward.
function radial(inner: number): Mark[] {
  const marks: Mark[] = [];
  const rays = 36;
  for (let ray = 0; ray < rays; ray++) {
    const angle = (ray / rays) * 2 * Math.PI;
    for (let step = 0, radius = inner; radius <= 112; step++) {
      const r = 3.6 - (Math.max(0, radius - 48) / 64) * 2.3;
      // Near the middle the rays crowd together, so every other one starts
      // further out.
      if (ray % 2 === 0 || radius > 40) marks.push(dot(C + radius * Math.cos(angle), C + radius * Math.sin(angle), r));
      radius += 6.5 + step * 0.6;
    }
  }
  return marks;
}

// Frame 02: rows of horizontal oval dashes of different lengths, like
// moving air, faint and strong.
function dashes(inner: number): Mark[] {
  const marks: Mark[] = [];
  let n = 0;
  for (let row = 0; 12 + row * 11 < FIELD_VIEW; row++) {
    const y = 12 + row * 11;
    const opacity = round(0.55 + noise(row + 300) * 0.45);
    let x = 6 + noise(row + 200) * 10;
    while (x < FIELD_VIEW) {
      const w = 6 + Math.round(noise(n++) * 14);
      const cx = x + w / 2;
      const dy = Math.abs(y - C);
      const clearOfHole = dy > inner || Math.abs(cx - C) > w / 2 + Math.sqrt(inner ** 2 - dy ** 2);
      if (inField(x, y, 2) && inField(x + w, y, 2) && clearOfHole) {
        marks.push({ kind: 'pill', x: round(cx), y, w, h: 3.6, opacity });
      }
      x += w + 5 + noise(n++) * 6;
    }
  }
  return marks;
}

// --- Dot rings -----------------------------------------------------------

// Drawn on the same 240x240 grid. Frame 11: evenly spaced rings of
// same-size dots around a hollow middle. Each dot has the index of its
// ring, so rings can alternate colors.
export type RingDot = { x: number; y: number; r: number; ring: number };

export const RINGS_VIEW = FIELD_VIEW;
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

function dot(x: number, y: number, r: number): Mark {
  return { kind: 'dot', x: round(x), y: round(y), r: round(r) };
}

// True if a point (with a margin) is inside the round field.
function inField(x: number, y: number, margin = 0): boolean {
  return Math.hypot(x - C, y - C) <= FIELD_R - margin;
}

// A fixed, repeatable 0-1 "random" number, so fields never change between
// renders.
function noise(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
