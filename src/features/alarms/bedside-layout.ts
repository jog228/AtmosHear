// Bedside mode's layout, worked out from the window and the safe area, so
// nothing is ever under the Dynamic Island or the home indicator, whichever
// way up the phone is. Plain math (no React), so it can be checked for any
// phone.

// The reference layout (design/frames/9 · Centered dome@2x.png), in points.
// Everything scales from these by one factor.
const REF = {
  width: 844,
  height: 390,
  side: 144, // each side column
  gap: 12, // between a side column and the dome
  dome: 532, // the dome's box, ends included
  labels: 34, // room under the dome for "Sunset 6:10 PM"
  domeMargin: 30, // around the dots, for the now marker's glow
};

// Kept clear of the safe area's edges.
export const BEDSIDE_MARGIN = 16;
// Smaller than this and the time stops being easy to read across a room.
const MIN_SCALE = 0.75;
// No text smaller than this, whatever the scale.
const MIN_TEXT = 12;
// Safety net: a landscape window wider than 2:1 is a notch or Dynamic
// Island phone, so if both side insets come back 0 (insets measured before
// a rotation), assume the island's inset on both sides.
export const ISLAND_FALLBACK_INSET = 59;
const NOTCH_ASPECT = 2;

type Insets = { top: number; right: number; bottom: number; left: number };

// The inset to keep clear on each side: the larger reported one, or the
// fallback when a wide landscape window reports none.
export function sideInset(width: number, height: number, insets: Pick<Insets, 'left' | 'right'>): number {
  const reported = Math.max(insets.left, insets.right);
  if (reported === 0 && width > height && width / height > NOTCH_ASPECT) return ISLAND_FALLBACK_INSET;
  return reported;
}

// A reference text size at a scale, never under 12pt.
export function bedsideTextSize(size: number, scale: number): number {
  return Math.max(MIN_TEXT, Math.round(size * scale));
}

export type BedsideLayout = {
  scale: number;
  // Where content may go: the safe area plus the margin.
  padding: Insets;
  sideWidth: number;
  // The dome's box: its width, the SVG's height, and the dots' radius and
  // center (from the box's top left).
  dome: { width: number; height: number; radius: number; cx: number; cy: number };
  labelSpace: number;
  // Text sizes, already scaled.
  text: {
    clock: number;
    period: number;
    until: number;
    endLabel: number;
    temperature: number;
    condition: number;
    detail: number;
    alarmsTitle: number;
    alarmTime: number;
    small: number;
  };
  icon: number;
};

// The safe area in landscape has the island's inset on both sides (iOS
// reports them equal), and the larger one is used for both anyway, so it
// stays clear on either side and right after a flip. The scale fits the
// 844x390 reference into what's left: never above 1 (a roomier phone just
// gets more space around the dome), never below 0.75.
export function bedsideLayout(width: number, height: number, insets: Insets): BedsideLayout {
  const side = sideInset(width, height, insets) + BEDSIDE_MARGIN;
  const padding = {
    left: side,
    right: side,
    top: insets.top + BEDSIDE_MARGIN,
    bottom: insets.bottom + BEDSIDE_MARGIN,
  };
  const availableWidth = Math.max(0, width - padding.left - padding.right);
  const availableHeight = Math.max(0, height - padding.top - padding.bottom);
  const scale = Math.min(1, Math.max(MIN_SCALE, Math.min(availableWidth / REF.width, availableHeight / REF.height)));

  const sideWidth = REF.side * scale;
  const labelSpace = REF.labels * scale;
  const margin = REF.domeMargin * scale;
  const domeWidth = Math.max(0, Math.min(availableWidth - 2 * sideWidth - 2 * REF.gap * scale, REF.dome * scale));
  const radius = Math.max(0, Math.min(domeWidth / 2 - margin, availableHeight - labelSpace - 2 * margin));
  const text = (size: number) => bedsideTextSize(size, scale);

  return {
    scale,
    padding,
    sideWidth,
    dome: { width: domeWidth, height: radius + 2 * margin, radius, cx: domeWidth / 2, cy: radius + margin },
    labelSpace,
    text: {
      clock: Math.round(108 * scale),
      period: Math.round(23 * scale),
      until: text(17),
      endLabel: text(17),
      temperature: text(46),
      condition: text(17),
      detail: text(15),
      alarmsTitle: text(15),
      alarmTime: text(22),
      small: text(14),
    },
    icon: Math.round(40 * scale),
  };
}
