import type { ConditionId } from '../../constants/conditions';
import { cloud, ring, row, type Dot } from './shapes';

// The dots of each condition icon, on a 24x24 grid, in the style of
// design/frames/09_Sound_library.png. Pure data (no React), so
// scripts/render-icon-sheet.mjs draws exactly what the app draws;
// condition-icons.tsx turns each list into a component. Overcast, light
// rain, heavy rain, and sleet aren't in her frames: they're designed to
// match.
//
// Every icon needs its own silhouette, not just a different density: at
// list size, dots blur into a shape. Sun icons are a disc with rays, cloud
// icons share one cloud and differ in what falls from it, and the rest
// (fog, wind, extreme cold, severe alert) are each their own shape. Check
// with the contact sheet after any change.

// A disc with `rays` short rays of 2 dots each: the base sun.
function sun(cx: number, cy: number, disc: number, inner: number, outer: number, dotR: [number, number]): Dot[] {
  return [[cx, cy, disc], ...ring(cx, cy, inner, 8, dotR[0]), ...ring(cx, cy, outer, 8, dotR[1])];
}

// A tiny six-point snowflake: 6 dots around a center dot.
function flake(cx: number, cy: number): Dot[] {
  return [[cx, cy, 0.7], ...ring(cx, cy, 1.85, 6, 0.58)];
}

// A short vertical line of dots that sways side to side, like heat
// shimmer.
function shimmer(x: number, top: number, phase: number): Dot[] {
  return [0, 1, 2].map((i) => [x + 1 * Math.sin(phase + i * 1.9), top + i * 2.7, 0.85] as Dot);
}

// Rows of 1 to 5 dots.
function warningTriangle(): Dot[] {
  return [0, 1, 2, 3, 4].flatMap((i) => {
    const half = (i * 3.4) / 2;
    return row(12 - half, 12 + half, 5 + i * 3.6, i + 1, 1.05);
  });
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
  clear: sun(12, 12, 3.6, 6.6, 9.2, [1.1, 0.95]),

  // A small sun top left, a cloud in front of it bottom right.
  'partly-cloudy': [[8.5, 8.5, 2.4], ...ring(8.5, 8.5, 5, 8, 0.85), ...cloud(15, 20, 0.95)],

  // Invented: a faded cloud behind a solid one.
  overcast: [...cloud(15.5, 12.5, 0.75, 0.45), ...cloud(11, 20)],

  // Invented, from her Rain: two rows of small drops.
  'light-rain': [...cloud(12, 12.5), ...row(8.5, 15.5, 16.2, 3, 0.85), ...row(10.25, 13.75, 19.6, 2, 0.85)],

  // Invented, from her Rain: three rows of bigger drops.
  'heavy-rain': [
    ...cloud(12, 12.5),
    ...row(7, 17, 16, 4, 1.15),
    ...row(8.7, 15.3, 19.2, 3, 1.15),
    ...row(10.4, 13.6, 22.2, 2, 1.05),
  ],

  // A zigzag of shrinking dots for the lightning.
  thunderstorm: [...cloud(12, 12.5), [13.2, 15.4, 1.2], [11.4, 17.4, 1.1], [13, 19.4, 1], [11.6, 21.6, 0.9]],

  // Light rain's cloud with three tiny six-point flakes instead of drops.
  snow: [...cloud(12, 12.5), ...flake(7.6, 16.9), ...flake(16.4, 16.9), ...flake(12, 20.9)],

  // Invented: rain streaks (a big dot over a small one) on each side, a tiny
  // snowflake of dots in the middle.
  sleet: [
    ...cloud(12, 12.5),
    [7.5, 16.4, 1.15],
    [7.5, 19.4, 0.8],
    [12, 18.2, 0.7],
    ...ring(12, 18.2, 2, 4, 0.55, -45),
    [16.5, 16.4, 1.15],
    [16.5, 19.4, 0.8],
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

  // A smaller sun, raised, over three swaying lines of rising heat.
  'extreme-heat': [
    // A clear gap between the sun's lowest ray and the shimmer, so the
    // two never merge into one tall shape.
    ...sun(12, 7.2, 2.5, 4.4, 6.1, [0.8, 0.7]),
    ...shimmer(7, 16.8, 0),
    ...shimmer(12, 16.8, 2),
    ...shimmer(17, 16.8, 4),
  ],

  // A six-armed snowflake of dots.
  'extreme-cold': [[12, 12, 1.4], ...snowflakeArms()],

  // A warning triangle of dots.
  'severe-alert': warningTriangle(),
};
