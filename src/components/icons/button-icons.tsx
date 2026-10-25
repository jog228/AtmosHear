import { dotIcon } from './dot-icon';
import type { Dot } from './shapes';

// Dotted icons for buttons, in the halftone style of design/frames/.

// All sounds (the Sound library button): a dot with two arcs of dots on
// each side, like sound and vibration spreading out from it.
export const SoundsIcon = dotIcon('SoundsIcon', [
  [12, 12, 2.6],
  ...arcs(5.6, [-35, 0, 35], 1.15),
  ...arcs(9.6, [-44, -22, 0, 22, 44], 0.95),
]);

// Dots at the given angles (0 = straight right) on a circle around the
// center, mirrored to the left side.
function arcs(radius: number, angles: number[], r: number): Dot[] {
  return angles.flatMap((deg): Dot[] => {
    const angle = (deg * Math.PI) / 180;
    const dx = Math.round(radius * Math.cos(angle) * 100) / 100;
    const dy = Math.round(radius * Math.sin(angle) * 100) / 100;
    return [
      [12 + dx, 12 + dy, r],
      [12 - dx, 12 + dy, r],
    ];
  });
}
