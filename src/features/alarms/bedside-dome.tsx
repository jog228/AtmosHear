import Svg, { Circle } from 'react-native-svg';

import type { BedsideColors } from './alarm-colors';
import { domePoint, domePosition, dotFraction, dotPassed, inDomeSpan } from './dome-position';

// How many dots make the half circle, and how many at the right end glow
// amber (the sunrise, or the sunset in the daytime).
const DOTS = 40;
const WARM_DOTS = 3;

// The now marker at the reference scale (bedside-layout.ts): a disc with
// two halo rings, on a background-colored circle that keeps the dots from
// touching it. The layout's dome margin leaves room for it.
const MARKER = { disc: 13, haloInner: 20, haloOuter: 28, clear: 30 };
const ALARM_RING = 9;

// The dome's box and its dots' center and radius (bedside-layout.ts).
export type DomeGeometry = { width: number; height: number; cx: number; cy: number; radius: number };

type Props = {
  geometry: DomeGeometry;
  colors: BedsideColors;
  // The bedside layout's scale, for the markers.
  scale: number;
  // The span the dome shows (sunrise to sunset, or sunset to sunrise), or
  // null for a plain arc with no markers.
  span: { kind: 'day' | 'night'; start: number; end: number } | null;
  now: number;
  // The next alarm's ring time; its ring shows only inside the span.
  alarmAt: number | null;
};

// Bedside mode's dotted dome (design/frames/9 · Centered dome@2x.png): a
// half circle of dots, growing slightly larger toward the right. Dots
// already passed are dim, the rest periwinkle, the last few amber. Now is
// an amber sun in the daytime, a crescent moon at night, styled by the
// palette (bedside-palette.ts); an
// open ring marks the next alarm. Positions come from dome-position.ts.
// Decorative and still (it moves once a minute with the clock): the
// screen's summary says the same in words.
export function BedsideDome({ geometry, colors, scale, span, now, alarmAt }: Props) {
  const { width, height, cx, cy, radius } = geometry;
  if (radius <= 0) return null;
  const position = span ? domePosition(now, span.start, span.end, cx, cy, radius) : null;
  const f = position?.f ?? 0;

  const s = (size: number) => size * scale;

  const dots = Array.from({ length: DOTS }, (_, i) => {
    const t = dotFraction(i, DOTS);
    const { x, y } = domePoint(t, cx, cy, radius);
    const full = radius * (0.008 + 0.008 * t);
    const passed = !span || dotPassed(i, DOTS, f);
    // High contrast draws passed dots smaller as well as dimmer.
    const r = passed ? full * colors.pastDotScale : full;
    // Dots the marker's clear circle would overlap are left out, so none
    // shows up sliced at its edge.
    if (position && Math.hypot(x - position.x, y - position.y) < s(MARKER.clear) + r) return null;
    const fill = passed ? colors.domePast : i >= DOTS - WARM_DOTS ? colors.amber : colors.domeAhead;
    return <Circle key={i} cx={x} cy={y} r={r} fill={fill} />;
  });

  const alarm =
    span && alarmAt !== null && inDomeSpan(alarmAt, span.start, span.end)
      ? domePosition(alarmAt, span.start, span.end, cx, cy, radius)
      : null;
  const alarmColor = alarm && alarm.f >= dotFraction(DOTS - WARM_DOTS, DOTS) ? colors.amber : colors.domeAhead;

  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {dots}
      {alarm && <Circle cx={alarm.x} cy={alarm.y} r={s(ALARM_RING)} fill="none" stroke={alarmColor} strokeWidth={1.5} />}
      {span && position && (
        <>
          <Circle cx={position.x} cy={position.y} r={s(MARKER.clear)} fill={colors.background} />
          {span.kind === 'day' ? (
            // The sun: halos in the dark and light palettes, and an outline
            // in light (amber alone is faint on mist) and high contrast.
            <>
              {colors.sunHalo && (
                <>
                  <Circle cx={position.x} cy={position.y} r={s(MARKER.haloOuter)} fill={colors.amber} opacity={colors.sunHalo[1]} />
                  <Circle cx={position.x} cy={position.y} r={s(MARKER.haloInner)} fill={colors.amber} opacity={colors.sunHalo[0]} />
                </>
              )}
              <Circle
                cx={position.x}
                cy={position.y}
                r={s(MARKER.disc)}
                fill={colors.amber}
                stroke={colors.sunOutline?.color}
                strokeWidth={colors.sunOutline?.width ?? 0}
              />
            </>
          ) : (
            // A crescent: a disc with a background-colored disc over its
            // upper right.
            <>
              <Circle cx={position.x} cy={position.y} r={s(MARKER.disc)} fill={colors.moon} />
              <Circle cx={position.x + s(5.5)} cy={position.y - s(3.5)} r={s(11)} fill={colors.background} />
            </>
          )}
        </>
      )}
    </Svg>
  );
}
