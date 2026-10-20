import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const BREATHE_MS = 3200;
const BREATHE_SCALE = 1.04;

// A slow grow-and-shrink for a whole illustration (never single dots),
// while `active`. Holds still with Reduce Motion.
export function useBreathing(active: boolean) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion || !active) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(BREATHE_SCALE, { duration: BREATHE_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(scale);
  }, [scale, reduceMotion, active]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}
