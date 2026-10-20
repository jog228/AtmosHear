import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, G, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import { FIELD_VIEW, halftoneMarks, type FieldPattern } from './geometry';
import { useBreathing } from './use-breathing';

type Props = {
  size: number;
  // 'rings' (frame 06), 'radial' (frame 04), or 'dashes' (frame 02).
  pattern: FieldPattern;
  // Leaves a round gap in the middle for a ClockSun a third of the size
  // (pass it as children to center it there).
  hole?: boolean;
  // Grows and shrinks slowly, as a whole. Holds still with Reduce Motion.
  breathing?: boolean;
  // Drawn in the middle, on top of the field. Doesn't breathe.
  children?: ReactNode;
};

// The periwinkle halftone dot field from design/frames/. Decorative: hidden
// from screen readers.
export function HalftoneField({ size, pattern, hole = false, breathing = false, children }: Props) {
  const { illustration } = useTheme();
  const marks = useMemo(() => halftoneMarks(pattern, hole), [pattern, hole]);
  const breathe = useBreathing(breathing);

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, breathe]}>
        <Svg width={size} height={size} viewBox={`0 0 ${FIELD_VIEW} ${FIELD_VIEW}`}>
          <G fill={illustration.dots}>
            {marks.map((mark, i) =>
              mark.kind === 'dot' ? (
                <Circle key={i} cx={mark.x} cy={mark.y} r={mark.r} opacity={mark.opacity} />
              ) : (
                <Rect
                  key={i}
                  x={mark.x - mark.w / 2}
                  y={mark.y - mark.h / 2}
                  width={mark.w}
                  height={mark.h}
                  rx={Math.min(mark.w, mark.h) / 2}
                  opacity={mark.opacity}
                />
              ),
            )}
          </G>
        </Svg>
      </Animated.View>
      {children && <View style={styles.middle}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  middle: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
