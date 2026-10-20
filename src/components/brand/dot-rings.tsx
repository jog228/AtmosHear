import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import { PULSE_FALL_MS, PULSE_RISE_MS, PULSE_SCALE, RINGS_VIEW, ringDots } from './geometry';

// Calls `onPulse` with a 0-1 strength each time the rings should pulse, and
// returns a function that stops. The caller decides what a pulse means
// (the cue screens pass each haptic tap as it plays).
export type PulseSource = (onPulse: (strength: number) => void) => () => void;

type Props = {
  size: number;
  rings?: number;
  // Ring colors from the inside out, repeating: one color, or alternating
  // like frame 11. Defaults to the theme's dot color.
  colors?: string[];
  // Pulses from this source; still without one, and with Reduce Motion.
  pulses?: PulseSource;
  // Drawn in the hollow middle (keep it under about 40% of `size`). Doesn't
  // pulse.
  children?: ReactNode;
};

// Concentric rings of dots around a hollow middle
// (design/frames/11_Weather_warning.png). Decorative: hidden from screen
// readers. A pulse only grows the rings a little and lets them settle,
// never changes their brightness, so fast taps can't flash.
export function DotRings({ size, rings = 6, colors, pulses, children }: Props) {
  const { illustration } = useTheme();
  const palette = colors ?? [illustration.dots];
  const dots = useMemo(() => ringDots(rings), [rings]);

  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!pulses || reduceMotion) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    // Restarts from wherever it is, so a fast rumble stays up and shakes.
    return pulses((strength) => {
      scale.value = withSequence(
        withTiming(1 + PULSE_SCALE * strength, { duration: PULSE_RISE_MS, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: PULSE_FALL_MS, easing: Easing.out(Easing.cubic) }),
      );
    });
  }, [pulses, reduceMotion, scale]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, pulse]}>
        <Svg width={size} height={size} viewBox={`0 0 ${RINGS_VIEW} ${RINGS_VIEW}`}>
          {dots.map((dot, i) => (
            <Circle key={i} cx={dot.x} cy={dot.y} r={dot.r} fill={palette[dot.ring % palette.length]} />
          ))}
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
