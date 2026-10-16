// Building blocks for the dotted icons, on a 24x24 grid. Every shape is a
// list of circles, in the halftone style of design/frames/.

// x, y, radius, and an optional opacity (0-1, default 1).
export type Dot = [cx: number, cy: number, r: number, opacity?: number];

const round = (n: number) => Math.round(n * 100) / 100;

function dot(cx: number, cy: number, r: number, opacity?: number): Dot {
  return opacity === undefined ? [round(cx), round(cy), r] : [round(cx), round(cy), r, opacity];
}

// `count` dots evenly around a circle, the first one at `startDeg`
// (-90 = straight up).
export function ring(cx: number, cy: number, radius: number, count: number, r: number, startDeg = -90): Dot[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = ((startDeg + (360 / count) * i) * Math.PI) / 180;
    return dot(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), r);
  });
}

// `count` dots evenly from x1 to x2. `r` can grow along the row, e.g.
// (i) => 0.6 + i * 0.2 for wind.
export function row(
  x1: number,
  x2: number,
  y: number,
  count: number,
  r: number | ((i: number) => number),
  opacity?: number,
): Dot[] {
  return Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? x1 : x1 + ((x2 - x1) / (count - 1)) * i;
    return dot(x, y, typeof r === 'number' ? r : r(i), opacity);
  });
}

// A solid puffy cloud from overlapping circles: a small bump on the left, a
// big one in the middle, a medium one on the right. `cx` is its center and
// `bottom` its flat-ish base; at scale 1 it's about 14 wide and 8 tall.
export function cloud(cx: number, bottom: number, scale = 1, opacity?: number): Dot[] {
  const s = scale;
  return [
    dot(cx - 4.5 * s, bottom - 2.7 * s, 2.7 * s, opacity),
    dot(cx - 0.8 * s, bottom - 4.4 * s, 3.9 * s, opacity),
    dot(cx + 3.6 * s, bottom - 3.2 * s, 3.2 * s, opacity),
    dot(cx - 2 * s, bottom - 2.4 * s, 2.4 * s, opacity),
    dot(cx + 1.5 * s, bottom - 2.4 * s, 2.4 * s, opacity),
  ];
}
