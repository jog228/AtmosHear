import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';

export type Toast = {
  // A new id each time, so saving twice in a row restarts the timer.
  id: number;
  title: string;
  subtitle: string;
  // What VoiceOver announces.
  spoken: string;
};

const SHOW_MS = 4000;

// "Alarm set for 6:30 AM · Rings in 16 hr 29 min" across the top after a
// save (design/frames/15 Alarm saved.png). Hides itself after 4 seconds.
// It never takes taps, and VoiceOver hears it as an announcement instead
// of having to find it. Reanimated skips the slide with Reduce Motion.
export function SavedToast({ toast, onHide }: { toast: Toast | null; onHide: () => void }) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    AccessibilityInfo.announceForAccessibility(toast.spoken);
    const timer = setTimeout(onHide, SHOW_MS);
    return () => clearTimeout(timer);
  }, [toast, onHide]);

  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={FadeInUp.duration(250)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.toast, { top: insets.top + spacing.sm }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.dot} />
      <View style={styles.text}>
        <Text style={styles.title}>{toast.title}</Text>
        <Text style={styles.subtitle}>{toast.subtitle}</Text>
      </View>
    </Animated.View>
  );
}

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    toast: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.toastDot,
    },
    text: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.onAccent,
    },
    subtitle: {
      fontSize: 16,
      color: colors.onAccent,
    },
  });
}
