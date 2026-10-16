import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  // 0 at sunrise, 1 at sunset; null at night (no sun marker).
  progress: number | null;
};

const HEIGHT = 44;
const MARKER_R = 9;
const MARKER_EDGE = 3;
// Room for the marker at the ends and the top of the arc.
const INSET = MARKER_R + MARKER_EDGE;
const DOT_SPACING = 11;
const DOT_R = 1.8;

// The dotted arc on the sun card, after design/frames/06_Weather_home.png,
// with an amber sun marker at the current time of day. Decorative: the card
// reads the same times and daylight left as text, so this is hidden from
// screen readers.
export function SunArc({ progress }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const span = Math.max(0, width - INSET * 2);
  const point = (t: number) => ({
    x: INSET + span * t,
    // A sine arch from the bottom corners up to the top.
    y: HEIGHT - MARKER_EDGE - (HEIGHT - INSET - MARKER_EDGE) * Math.sin(Math.PI * t),
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
          {/* Amber is too light to see on its own (1.6:1 on white), so it
              gets an accent edge (12:1). */}
          {marker && (
            <Circle
              cx={marker.x}
              cy={marker.y}
              r={MARKER_R}
              fill={theme.illustration.sun}
              stroke={theme.colors.accent}
              strokeWidth={MARKER_EDGE}
            />
          )}
        </Svg>
      )}
    </View>
  );
}
