import { dotIcon } from './dot-icon';
import { cloud, ring, row, type Dot } from './shapes';

// One dotted icon per condition (src/constants/conditions.ts), in the style
// of design/frames/09_Sound_library.png. Overcast, light rain, heavy rain,
// and sleet aren't in her frames: they're designed to match.

export const ClearIcon = dotIcon('ClearIcon', [[12, 12, 3.6], ...ring(12, 12, 8, 8, 1.3)]);

// A small sun top left, a cloud in front of it bottom right.
export const PartlyCloudyIcon = dotIcon('PartlyCloudyIcon', [
  [8.5, 8.5, 2.4],
  ...ring(8.5, 8.5, 5, 8, 0.85),
  ...cloud(15, 20, 0.95),
]);

// Invented: a faded cloud behind a solid one.
export const OvercastIcon = dotIcon('OvercastIcon', [...cloud(15.5, 12.5, 0.75, 0.45), ...cloud(11, 20)]);

// Invented, from her Rain: two rows of small drops.
export const LightRainIcon = dotIcon('LightRainIcon', [
  ...cloud(12, 12.5),
  ...row(8.5, 15.5, 16.2, 3, 0.85),
  ...row(10.25, 13.75, 19.6, 2, 0.85),
]);

// Invented, from her Rain: three rows of bigger drops.
export const HeavyRainIcon = dotIcon('HeavyRainIcon', [
  ...cloud(12, 12.5),
  ...row(7, 17, 16, 4, 1.15),
  ...row(8.7, 15.3, 19.2, 3, 1.15),
  ...row(10.4, 13.6, 22.2, 2, 1.05),
]);

// A zigzag of shrinking dots for the lightning.
export const ThunderstormIcon = dotIcon('ThunderstormIcon', [
  ...cloud(12, 12.5),
  [13.2, 15.4, 1.2],
  [11.4, 17.4, 1.1],
  [13, 19.4, 1],
  [11.6, 21.6, 0.9],
]);

export const SnowIcon = dotIcon('SnowIcon', [
  [12, 12, 1.9],
  [6.5, 6.5, 1.4],
  [17.5, 6.5, 1.1],
  [6.5, 17.5, 1.1],
  [17.5, 17.5, 1.4],
  [12, 4.5, 0.9],
  [12, 19.5, 0.9],
  [4.5, 12, 0.9],
  [19.5, 12, 0.9],
]);

// Invented: rain streaks (a big dot over a small one) on each side, a tiny
// snowflake of dots in the middle.
export const SleetIcon = dotIcon('SleetIcon', [
  ...cloud(12, 12.5),
  [7.5, 16.4, 1.15],
  [7.5, 19.4, 0.8],
  [12, 18.2, 0.7],
  ...ring(12, 18.2, 2, 4, 0.55, -45),
  [16.5, 16.4, 1.15],
  [16.5, 19.4, 0.8],
]);

// Rows of dots, fading toward the top.
export const FogIcon = dotIcon('FogIcon', [
  ...row(4, 20, 6.5, 5, 1.15, 0.35),
  ...row(4, 20, 10.2, 5, 1.15, 0.55),
  ...row(4, 20, 13.9, 5, 1.15, 0.8),
  ...row(4, 20, 17.6, 5, 1.15),
]);

// Three rows of dots that grow left to right, like speed lines.
export const WindIcon = dotIcon('WindIcon', [
  ...row(3, 19, 8, 6, (i) => 0.55 + i * 0.18),
  ...row(5, 21, 12, 6, (i) => 0.65 + i * 0.2),
  ...row(3, 19, 16, 6, (i) => 0.55 + i * 0.18),
]);

// A sun with two rings of rays.
export const ExtremeHeatIcon = dotIcon('ExtremeHeatIcon', [
  [12, 12, 3],
  ...ring(12, 12, 5.6, 8, 0.95),
  ...ring(12, 12, 9.2, 12, 0.8, -75),
]);

// A six-armed snowflake of dots.
export const ExtremeColdIcon = dotIcon('ExtremeColdIcon', [[12, 12, 1.4], ...snowflakeArms()]);

// A warning triangle of dots.
export const SevereAlertIcon = dotIcon('SevereAlertIcon', warningTriangle());

function snowflakeArms(): Dot[] {
  return [0, 60, 120, 180, 240, 300].flatMap((deg) => [
    ...ring(12, 12, 3.4, 1, 1.05, deg - 90),
    ...ring(12, 12, 6.1, 1, 1.05, deg - 90),
    ...ring(12, 12, 8.9, 1, 0.95, deg - 90),
  ]);
}

// Rows of 1 to 5 dots.
function warningTriangle(): Dot[] {
  return [0, 1, 2, 3, 4].flatMap((i) => {
    const half = (i * 3.4) / 2;
    return row(12 - half, 12 + half, 5 + i * 3.6, i + 1, 1.05);
  });
}
