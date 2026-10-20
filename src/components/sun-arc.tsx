import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import { ClockSun } from './brand';

type Props = {
  // 0 at sunrise, 1 at sunset; null at night (no sun marker).
  progress: number | null;
  // The time the marker's clock face shows: now.
  now: number;
};

const HEIGHT = 56;
const MARKER_SIZE = 26;
// Room for the marker at the ends and the top of the arc.
const INSET = MARKER_SIZE / 2;
const MARKER_EDGE = 2;
const DOT_SPACING = 11;
const DOT_R = 1.8;

// The dotted arc on the sun card, after design/frames/06_Weather_home.png,
// with a tiny clock-face sun at the current time of day, showing that time.
// Decorative: the card reads the same times and daylight left as text, so
// this is hidden from screen readers.
export function SunArc({ progress, now }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const span = Math.max(0, width - INSET * 2);
  const point = (t: number) => ({
    x: INSET + span * t,
    // A sine arch from the bottom corners up to the top.
    y: HEIGHT - INSET - (HEIGHT - INSET * 2) * Math.sin(Math.PI * t),
  });
  const count = Math.max(2, Math.round(span / DOT_SPACING) + 1);
  const marker = progress === null ? null : point(Math.min(1, Math.max(0, progress)));

  return (
    <View
      style={{ height: HEIGHT }}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {Array.from({ length: count }, (_, i) => {
            const { x, y } = point(i / (count - 1));
            return <Circle key={i} cx={x} cy={y} r={DOT_R} fill={theme.illustration.dots} />;
          })}
        </Svg>
      )}
      {/* Amber is too light to see on its own (1.6:1 on white), so the sun
          gets an accent edge (12:1). */}
      {width > 0 && marker && (
        <View style={{ position: 'absolute', left: marker.x - INSET, top: marker.y - INSET }}>
          <ClockSun
            size={MARKER_SIZE}
            hour={new Date(now).getHours()}
            minute={new Date(now).getMinutes()}
            outline={theme.colors.accent}
            outlineWidth={MARKER_EDGE}
          />
        </View>
      )}
    </View>
  );
}
