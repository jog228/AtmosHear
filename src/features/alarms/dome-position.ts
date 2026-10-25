// Where things sit on bedside mode's dome. Plain math (no React), tested in
// scripts/dome-position.test.mjs.
//
// The dome is the top half of a circle (center cx, cy; radius r). Its left
// end is the start of the span, its right end the end: sunrise to sunset in
// the daytime, sunset to the next sunrise at night.

const DAY_MS = 24 * 60 * 60 * 1000;

// The span's end, a day later if it's before the start (a night written as
// times of day crosses midnight).
function spanEnd(start: number, end: number): number {
  return end < start ? end + DAY_MS : end;
}

// How far through the span `time` is: f = (time - start) / (end - start),
// clamped to 0..1.
export function domeFraction(time: number, start: number, end: number): number {
  const length = spanEnd(start, end) - start;
  if (length <= 0) return 0;
  return Math.min(1, Math.max(0, (time - start) / length));
}

// Whether `time` falls inside the span (for the next-alarm ring).
export function inDomeSpan(time: number, start: number, end: number): boolean {
  return time >= start && time <= spanEnd(start, end);
}

// The point a fraction `f` along the dome: theta = PI * (1 - f), so 0 is
// the left end, 0.5 the top, 1 the right end.
export function domePoint(f: number, cx: number, cy: number, r: number): { x: number; y: number } {
  const theta = Math.PI * (1 - f);
  return { x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) };
}

// Where `time` sits on the dome, and its fraction.
export function domePosition(
  time: number,
  start: number,
  end: number,
  cx: number,
  cy: number,
  r: number,
): { f: number; x: number; y: number } {
  const f = domeFraction(time, start, end);
  return { f, ...domePoint(f, cx, cy, r) };
}

// Dot i of n sits at fraction i / (n - 1), and has passed (dim) when that's
// before now's fraction.
export function dotFraction(i: number, n: number): number {
  return n > 1 ? i / (n - 1) : 0;
}

export function dotPassed(i: number, n: number, f: number): boolean {
  return dotFraction(i, n) < f;
}
