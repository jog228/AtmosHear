import type { ConditionId } from '../../constants/conditions';
import { cloud, ring, row, type Dot } from './shapes';

// The dots of each condition icon, on a 24x24 grid, in the style of
// design/frames/09_Sound_library.png. Pure data (no React), so
// scripts/render-icon-sheet.mjs draws exactly what the app draws;
// condition-icons.tsx turns each list into a component. Overcast, light
// rain, heavy rain, sleet, and hail aren't in her frames: they're designed to
// match.
//
// Every icon needs its own silhouette, not just a different density: at
// list size, dots blur into a shape. Sun icons are a disc with rays, cloud
// icons share one cloud and differ in what falls from it, and the rest
// (fog, wind, extreme cold, severe alert) are each their own shape. Check
// with the contact sheet after any change.

// A disc with 8 short rays. Each ray has one dot per [distance, dot radius]
// in `rays`, from the disc outward.
function sun(cx: number, cy: number, disc: number, rays: [number, number][]): Dot[] {
  return [[cx, cy, disc], ...rays.flatMap(([distance, r]) => ring(cx, cy, distance, 8, r))];
}

// A raindrop: 3 overlapping dots, small to large, so they merge into a
// teardrop with its point at the top (tipY). `tilt` leans it in degrees
// (+ moves the point right) for slanting rain. At scale 1 it's about 3.4
// tall and 1.9 wide.
function drop(cx: number, tipY: number, scale = 1, tilt = 0): Dot[] {
  const angle = (tilt * Math.PI) / 180;
  return [
    [0.35, 0.35],
    [1.1, 0.6],
    [2.05, 0.95],
  ].map(([along, r]) => [cx - Math.sin(angle) * along * scale, tipY + Math.cos(angle) * along * scale, r * scale] as Dot);
}

// A tiny six-point snowflake: 6 dots around a center dot.
function flake(cx: number, cy: number): Dot[] {
  return [[cx, cy, 0.7], ...ring(cx, cy, 1.85, 6, 0.58)];
}

// A short vertical line of dots, `step` apart, that sways side to side,
// like heat shimmer.
function shimmer(x: number, top: number, phase: number, step = 2.7): Dot[] {
  return [0, 1, 2].map((i) => [x + 1 * Math.sin(phase + i * 1.9), top + i * step, 0.85] as Dot);
}

// An exclamation mark: a bar of 5 overlapping pairs of dots, side by side
// so it has weight at 24pt, that narrows toward the bottom (smaller dots,
// closer together), a clear gap, then one large round dot.
function exclamationMark(): Dot[] {
  const bar = [
    [1.1, 1.55],
    [0.95, 1.4],
    [0.8, 1.25],
    [0.6, 1.1],
    [0.4, 1],
  ].flatMap(([dx, r], i): Dot[] => [
    [12 - dx, 4 + i * 2.45, r],
    [12 + dx, 4 + i * 2.45, r],
  ]);
  return [...bar, [12, 19.7, 2.1]];
}

function snowflakeArms(): Dot[] {
  return [0, 60, 120, 180, 240, 300].flatMap((deg) => [
    ...ring(12, 12, 3.4, 1, 1.05, deg - 90),
    ...ring(12, 12, 6.1, 1, 1.05, deg - 90),
    ...ring(12, 12, 8.9, 1, 0.95, deg - 90),
  ]);
}

export const conditionIconDots: Record<ConditionId, Dot[]> = {
  // The base sun: a solid disc and 8 rays.
  clear: sun(12, 12, 3.6, [
    [6.6, 1.1],
    [9.2, 0.95],
  ]),

  // A small sun top left, a cloud in front of it bottom right.
  'partly-cloudy': [[8.5, 8.5, 2.4], ...ring(8.5, 8.5, 5, 8, 0.85), ...cloud(15, 20, 0.95)],

  // Invented: a faded cloud behind a solid one.
  overcast: [...cloud(15.5, 12.5, 0.75, 0.45), ...cloud(11, 20)],

  // Invented, from her Rain: three small teardrops in a row.
  'light-rain': [...cloud(12, 12.5), ...drop(8, 15, 1.2), ...drop(12, 15, 1.2), ...drop(16, 15, 1.2)],

  // Invented, from her Rain: six bigger teardrops in two staggered rows,
  // slanted 15 degrees like a downpour.
  'heavy-rain': [
    ...cloud(12, 12.5),
    ...[7.6, 12, 16.4].flatMap((x) => drop(x, 14.4, 1.3, 15)),
    ...[6.3, 10.7, 15.1].flatMap((x) => drop(x, 18.9, 1.3, 15)),
  ],

  // A zigzag of shrinking dots for the lightning.
  thunderstorm: [...cloud(12, 12.5), [13.2, 15.4, 1.2], [11.4, 17.4, 1.1], [13, 19.4, 1], [11.6, 21.6, 0.9]],

  // Light rain's cloud with three tiny six-point flakes instead of drops.
  snow: [...cloud(12, 12.5), ...flake(7.6, 16.9), ...flake(16.4, 16.9), ...flake(12, 20.9)],

  // Invented: half rain, half ice. Two small teardrops on the outside, three
  // small round ice dots between and below them.
  sleet: [
    ...cloud(12, 12.5),
    ...drop(7.6, 15, 1.15),
    ...drop(16.4, 15, 1.15),
    [12, 16.7, 0.95],
    [9.8, 20.4, 0.95],
    [14.2, 20.4, 0.95],
  ],

  // Light rain's cloud with five big round hailstones, 3 over 2 (the
  // middle one biggest), like the hero image. Much bigger than any drop.
  hail: [
    ...cloud(12, 12.5),
    [7.4, 15.8, 1.55],
    [12, 15.8, 1.8],
    [16.6, 15.8, 1.55],
    [9.7, 20.2, 1.55],
    [14.3, 20.2, 1.55],
  ],

  // Rows of dots, fading toward the top.
  fog: [
    ...row(4, 20, 6.5, 5, 1.15, 0.35),
    ...row(4, 20, 10.2, 5, 1.15, 0.55),
    ...row(4, 20, 13.9, 5, 1.15, 0.8),
    ...row(4, 20, 17.6, 5, 1.15),
  ],

  // Three rows of dots that grow left to right, like speed lines.
  wind: [
    ...row(3, 19, 8, 6, (i) => 0.55 + i * 0.18),
    ...row(5, 21, 12, 6, (i) => 0.65 + i * 0.2),
    ...row(3, 19, 16, 6, (i) => 0.55 + i * 0.18),
  ],

  // A big, bold sun, raised, over three swaying lines of rising heat. The
  // rays have 3 bigger, overlapping dots each (Clear's have 2 small ones),
  // but stay short next to the disc so it reads as a sun, not a starburst.
  'extreme-heat': [
    ...sun(12, 8, 3.3, [
      [4.8, 0.9],
      [5.9, 0.8],
      [6.9, 0.7],
    ]),
    // A clear gap between the sun's lowest ray and the shimmer, so the
    // two never merge into one tall shape.
    ...shimmer(7, 17.6, 0, 2.4),
    ...shimmer(12, 17.6, 2, 2.4),
    ...shimmer(17, 17.6, 4, 2.4),
  ],

  // A six-armed snowflake of dots.
  'extreme-cold': [[12, 12, 1.4], ...snowflakeArms()],

  // An exclamation mark of dots.
  'severe-alert': exclamationMark(),
};
