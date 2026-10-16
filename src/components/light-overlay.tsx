import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { safeLightCue, type LightCue } from '@/constants/light-cues';
import { cueColors, type CueColor } from '@/constants/theme';
import { lightCue } from '@/services/light-cue';

// The light cue: a full-screen color wash over the whole app (not the
// flashlight). It never takes touches or VoiceOver focus, during or after a
// cue: it's hidden from screen readers and lets every tap through.
// Reduce Motion plays a gentle fade instead (see safeLightCue).
export function LightOverlay() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const [color, setColor] = useState<CueColor>('white');

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const clear = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };

    const play = (cue: LightCue | null) => {
      clear();
      cancelAnimation(opacity);
      if (!cue) {
        opacity.value = withTiming(0, { duration: 250 });
        return;
      }
      // Each step starts on a timer; the opacity moves on the UI thread.
      // Color changes only happen at a step's start (in practice when the
      // light is off), so they never show as a jump.
      let at = 0;
      for (const step of safeLightCue(cue, reduceMotion)) {
        timers.push(
          setTimeout(() => {
            setColor(step.color);
            opacity.value = withTiming(step.opacity, { duration: step.ms, easing: Easing.inOut(Easing.sin) });
          }, at),
        );
        at += step.ms;
      }
      // Always end fully off.
      timers.push(
        setTimeout(() => {
          opacity.value = withTiming(0, { duration: 150 });
        }, at),
      );
    };

    const unsubscribe = lightCue.subscribe(play);
    return () => {
      unsubscribe();
      clear();
    };
  }, [opacity, reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { backgroundColor: cueColors[color] }, style]}
    />
  );
}
