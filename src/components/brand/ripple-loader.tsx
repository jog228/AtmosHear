import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import {
  RIPPLE_CENTER,
  RIPPLE_CENTER_R,
  RIPPLE_DELAYS_MS,
  RIPPLE_DOT_R,
  RIPPLE_LOOP_MS,
  RIPPLE_MIN,
  RIPPLE_PEAK,
  RIPPLE_STILL,
  RIPPLE_VIEW,
  rippleRings,
} from './geometry';

const EASE = Easing.inOut(Easing.cubic);

// The loading animation ("Loading animation · 1 · Ripple"): a center dot in
// the accent color and three rings of periwinkle dots (white in high
// contrast) that brighten in turn, so light ripples outward. Each ring
// fades as one layer, never dot by dot. Holds still at a soft middle
// brightness with Reduce Motion. Decorative: hidden from screen readers
// (the loading state has its own label).
export function RippleLoader({ size = RIPPLE_VIEW }: { size?: number }) {
  const { colors, illustration } = useTheme();
  const rings = useMemo(() => rippleRings(), []);
  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {rings.map((dots, i) => (
        <RippleRing key={i} index={i} dots={dots} size={size} color={illustration.dots} />
      ))}
      <Svg width={size} height={size} viewBox={`0 0 ${RIPPLE_VIEW} ${RIPPLE_VIEW}`} style={StyleSheet.absoluteFill}>
        <Circle cx={RIPPLE_CENTER} cy={RIPPLE_CENTER} r={RIPPLE_CENTER_R} fill={colors.accent} />
      </Svg>
    </View>
  );
}

function RippleRing({
  index,
  dots,
  size,
  color,
}: {
  index: number;
  dots: { x: number; y: number }[];
  size: number;
  color: string;
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? RIPPLE_STILL : RIPPLE_MIN);

  useEffect(() => {
    cancelAnimation(opacity);
    if (reduceMotion) {
      opacity.value = RIPPLE_STILL;
      return;
    }
    opacity.value = RIPPLE_MIN;
    opacity.value = withDelay(
      RIPPLE_DELAYS_MS[index],
      withRepeat(
        withSequence(
          withTiming(1, { duration: RIPPLE_LOOP_MS * RIPPLE_PEAK, easing: EASE }),
          withTiming(RIPPLE_MIN, { duration: RIPPLE_LOOP_MS * (1 - RIPPLE_PEAK), easing: EASE }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [index, opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${RIPPLE_VIEW} ${RIPPLE_VIEW}`}>
        {dots.map((dot, i) => (
          <Circle key={i} cx={dot.x} cy={dot.y} r={RIPPLE_DOT_R} fill={color} />
        ))}
      </Svg>
    </Animated.View>
  );
}
