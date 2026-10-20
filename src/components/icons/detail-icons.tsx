import { dotIcon } from './dot-icon';
import { ring, row, type Dot } from './shapes';

// Dotted icons for the detail cards and the sun card, matching
// design/frames/06_Weather_home.png. Wind, rain, UV, and snow reuse the
// condition icons (see condition-shapes.ts).

// A halftone drop (a grid of dots inside a drop shape), with a small dot
// above it.
export const HumidityIcon = dotIcon('HumidityIcon', [...halftoneDrop(), [12, 2.4, 0.85]]);

// A thermometer: a column of dots over a round bulb, with tick marks.
export const FeelsLikeIcon = dotIcon('FeelsLikeIcon', [
  ...[4.5, 7.2, 9.9, 12.6].map((y): Dot => [12, y, 1.2]),
  [12, 17.6, 3.4],
  ...[5.8, 8.6, 11.4].map((y): Dot => [15.2, y, 0.6]),
]);

// A leaf outline with a center vein and a stem.
export const AirQualityIcon = dotIcon('AirQualityIcon', leaf());

// A half sun on the horizon with a chevron pointing up (sunrise) or down.
export const SunriseIcon = dotIcon('SunriseIcon', [...horizonSun(), [9.8, 5.2, 0.75], [12, 3.2, 0.75], [14.2, 5.2, 0.75]]);
export const SunsetIcon = dotIcon('SunsetIcon', [...horizonSun(), [9.8, 3.2, 0.75], [12, 5.2, 0.75], [14.2, 3.2, 0.75]]);

function horizonSun(): Dot[] {
  // Seven rays fanned across the top half.
  const rays = [-180, -150, -120, -90, -60, -30, 0].map((deg) => ring(12, 16, 6.8, 1, 0.85, deg)[0]);
  return [...row(3, 21, 18.6, 8, 0.7), [12, 16, 2.7], ...rays];
}

// Dots along both edges of a leaf pointing up and to the right.
function leaf(): Dot[] {
  const [ax, ay, bx, by] = [5.5, 18.5, 18.5, 5.5];
  const steps = 6;
  const dots: Dot[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    // Widest in the middle, a point at each end.
    const w = 4.2 * Math.sin(Math.PI * t);
    // Perpendicular to the leaf's direction.
    const [px, py] = [Math.SQRT1_2, Math.SQRT1_2];
    if (w < 0.01) dots.push([x, y, 0.9]);
    else dots.push([x + px * w, y + py * w, 0.9], [x - px * w, y - py * w, 0.9]);
    if (i === 2 || i === 3 || i === 4) dots.push([x, y, 0.65]);
  }
  return [...dots, [3.6, 20.4, 0.9]].map(([x, y, r]): Dot => [Math.round(x * 100) / 100, Math.round(y * 100) / 100, r]);
}

// Rows of dots, centered, as wide as a drop at each height: a point at the
// top that widens into a round bottom.
function halftoneDrop(): Dot[] {
  const [cx, cy, radius, tipY] = [12, 15.2, 5.6, 5];
  const step = 2.25;
  const dots: Dot[] = [];
  for (let y = tipY; y <= cy + radius - 0.8; y += step) {
    const point = y <= cy ? (radius * (y - tipY)) / (cy - tipY) : 0;
    const circle = Math.abs(y - cy) <= radius ? Math.sqrt(radius ** 2 - (y - cy) ** 2) : 0;
    const half = Math.max(point * 0.85, circle) - 0.9;
    const count = Math.max(1, Math.floor((half * 2) / step) + 1);
    const start = cx - ((count - 1) * step) / 2;
    for (let i = 0; i < count; i++) {
      dots.push([Math.round((start + i * step) * 100) / 100, Math.round(y * 100) / 100, 0.95]);
    }
  }
  return dots;
}
