import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { contrastRatio } from '@/constants/contrast';
import { darkTheme, highContrastTheme, lightTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  // 0 at sunrise, 1 at sunset.
  passed: number;
  // The amber "now" dot at the boundary: only between sunrise and sunset.
  showNow: boolean;
};

const DOT_R = 2.5;
const SPACING = 10;
const NOW_R = 5;
const NOW_EDGE = 1.5;
// Room for the "now" dot at either end.
const INSET = NOW_R + NOW_EDGE;
const HEIGHT = INSET * 2;
const FILL_MS = 600;

// A row of dots on the sun card: accent for the daylight already passed,
// the track color for what's left, and a small amber dot at now. Fills
// from empty when it first appears (still with Reduce Motion). Decorative:
// the card's label says the same, so this is hidden from screen readers.
export function DaylightBar({ passed, showNow }: Props) {
  const { colors, illustration } = useTheme();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const count = Math.max(2, Math.floor((width - INSET * 2) / SPACING) + 1);
  const step = (width - INSET * 2) / (count - 1);
  const x = (i: number) => INSET + step * i;
  // Before sunrise none are filled and after sunset all are; in between,
  // every dot up to the one nearest now.
  const filled = showNow ? Math.round(passed * (count - 1)) + 1 : passed >= 1 ? count : 0;
  // The filled row shows through a clip that ends halfway to the next dot,
  // so a dot is never cut in half once the fill settles.
  const target = filled === 0 ? 0 : x(filled - 1) + step / 2;

  const clip = useSharedValue(0);
  const revealed = useRef(false);
  useEffect(() => {
    if (width === 0) return;
    if (!revealed.current && !reduceMotion) {
      clip.value = withTiming(target, { duration: FILL_MS, easing: Easing.out(Easing.cubic) });
    } else {
      // Once a minute after that, or with Reduce Motion: no animation.
      cancelAnimation(clip);
      clip.value = target;
    }
    revealed.current = true;
  }, [clip, width, target, reduceMotion]);

  const clipStyle = useAnimatedStyle(() => ({ width: clip.value }));
  // Rides the edge of the fill, sitting on the last filled dot.
  const nowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.max(INSET, clip.value - step / 2) - INSET }],
  }));

  const row = (color: string) => (
    <Svg width={width} height={HEIGHT}>
      {Array.from({ length: count }, (_, i) => (
        <Circle key={i} cx={x(i)} cy={HEIGHT / 2} r={DOT_R} fill={color} />
      ))}
    </Svg>
  );

  return (
    <View
      style={styles.bar}
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {width > 0 && (
        <>
          {row(colors.progressTrack)}
          <Animated.View style={[styles.fill, clipStyle]}>{row(colors.accent)}</Animated.View>
          {showNow && (
            <Animated.View style={[styles.now, nowStyle]}>
              {/* Amber alone is 1.6:1 on white, so it gets an edge in the
                  text color. */}
              <Svg width={HEIGHT} height={HEIGHT}>
                <Circle
                  cx={INSET}
                  cy={INSET}
                  r={NOW_R}
                  fill={illustration.sun}
                  stroke={colors.textPrimary}
                  strokeWidth={NOW_EDGE}
                />
              </Svg>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: HEIGHT,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: HEIGHT,
    overflow: 'hidden',
  },
  now: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

// Development check: the passed dots stand out from the track (WCAG 1.4.11,
// 3:1 for non-text) in every theme.
if (__DEV__) {
  for (const theme of [lightTheme, darkTheme, highContrastTheme]) {
    if (contrastRatio(theme.colors.accent, theme.colors.progressTrack) < 3) {
      console.error(`${theme.name}: daylight bar accent and progressTrack are under 3:1`);
    }
  }
}
