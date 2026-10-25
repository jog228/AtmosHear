import { ring, row, type Dot } from './shapes';

// The sun card's sunrise and sunset icons, as plain data (like
// condition-shapes.ts) so scripts/render-icon-sheet.mjs can draw them too.

// A half sun on the horizon with an arrow above it, pointing up (sunrise)
// or down (sunset). The arrow has a shaft and a wide head so the two still
// tell apart at the sun card's 22pt.
export const sunriseDots: Dot[] = [...horizonSun(), ...arrow('up')];
export const sunsetDots: Dot[] = [...horizonSun(), ...arrow('down')];

function horizonSun(): Dot[] {
  // Four rays, none straight up, so the arrow above stands on its own
  // instead of running into a ray.
  const rays = [-180, -135, -45, 0].map((deg) => ring(12, 18.2, 6.2, 1, 1, deg)[0]);
  return [...row(3, 21, 21.6, 8, 0.75), [12, 18.2, 3.2], ...rays];
}

// A vertical arrow from y 1.8 to y 10.4: a shaft of four dots with a wide
// chevron head at the top (up) or the bottom (down).
function arrow(direction: 'up' | 'down'): Dot[] {
  const [tip, step] = direction === 'up' ? [1.8, 1] : [10.4, -1];
  const head: Dot[] = [1, 2].flatMap((i): Dot[] => [
    [12 - 2.1 * i, tip + 2.1 * i * step, 1.05],
    [12 + 2.1 * i, tip + 2.1 * i * step, 1.05],
  ]);
  const shaft = [0, 2.9, 5.8, 8.6].map((d): Dot => [12, tip + d * step, 1.05]);
  return [...shaft, ...head];
}
