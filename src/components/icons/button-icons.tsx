import { dotIcon } from './dot-icon';
import { ring, type Dot } from './shapes';

// Dotted icons for buttons, in the halftone style of design/frames/.

// All sounds (the Sound library button), design option "5 · Play"
// (reference: design/icons/all-sounds-icon.png): a ring of 16 small dots
// around a play triangle of 10 bigger dots in 4 columns pointing right.
// The ring reaches the grid's edge, so it's drawn on a viewBox one unit
// larger on each side.
export const SoundsIcon = dotIcon(
  'SoundsIcon',
  [...ring(12, 12, 9.5, 16, 0.95), ...playTriangle()],
  '-1 -1 26 26',
);

// Columns of dots from left to right, each one dot shorter.
function playTriangle(): Dot[] {
  const columns: [number, number[]][] = [
    [9.4, [8.2, 10.7, 13.2, 15.7]],
    [11.8, [9.4, 11.9, 14.4]],
    [14.2, [10.7, 13.2]],
    [16.4, [11.9]],
  ];
  return columns.flatMap(([x, ys]) => ys.map((y): Dot => [x, y, 1.2]));
}
