import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useSyncExternalStore } from 'react';
import { AccessibilityInfo, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockSun } from '@/components/brand';
import { radius, spacing } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { formatTime, timeText } from './alarm-format';
import { alarmRinger, SNOOZE_MS } from './alarm-ringer';

const BUTTON_HEIGHT = 72;

// Full screen while an alarm rings (route /alarm-ringing, opened by
// AlarmHost): the time, the label, and big Snooze and Stop buttons. Keeps
// the screen awake. Closes itself when the ring ends (Stop, Snooze, or the
// 10-minute auto-stop). Can't be swiped away.
export function RingingScreen() {
  useKeepAwake();
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const ring = useSyncExternalStore(
    (listener) => alarmRinger.subscribe(listener),
    () => alarmRinger.current(),
  );

  const now = useMinuteClock(true);
  const at = new Date(ring?.at ?? now);
  const hour = at.getHours();
  const minute = at.getMinutes();
  const spokenTime = timeText(hour, minute, uses24Hour);
  const { time, period } = formatTime(hour, minute, uses24Hour);

  // Announced once when it opens.
  const label = ring?.label;
  useEffect(() => {
    if (label) AccessibilityInfo.announceForAccessibility(`Alarm, ${label}, ${spokenTime}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  // The ring ended: leave.
  useEffect(() => {
    if (ring) return;
    if (router.canGoBack()) router.back();
    else router.replace('/alarms');
  }, [ring]);

  // Android's back button doesn't dismiss a ringing alarm.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const snoozeUntil = timeText(...hourMinute(now + SNOOZE_MS), uses24Hour);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.top} accessible accessibilityLabel={`Alarm, ${ring?.label ?? ''}, ${spokenTime}`}>
        <ClockSun size={120} hour={hour} minute={minute} />
        <View style={styles.timeLine}>
          <Text style={styles.time} maxFontSizeMultiplier={1.3}>
            {time}
          </Text>
          {period !== '' && (
            <Text style={styles.period} maxFontSizeMultiplier={1.3}>
              {period}
            </Text>
          )}
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {ring?.label}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.button, styles.snooze, pressed && styles.pressed]}
          onPress={() => {
            alarmRinger.snooze();
            AccessibilityInfo.announceForAccessibility(`Snoozed until ${snoozeUntil}`);
          }}
          accessibilityRole="button"
          accessibilityLabel="Snooze 9 minutes"
          accessibilityHint={`Rings again at ${snoozeUntil}`}
        >
          <Text style={[styles.buttonText, styles.snoozeText]}>Snooze 9 min</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, styles.stop, pressed && styles.pressed]}
          onPress={() => alarmRinger.stop()}
          accessibilityRole="button"
          accessibilityLabel="Stop alarm"
        >
          <Text style={[styles.buttonText, styles.stopText]}>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

function hourMinute(ms: number): [number, number] {
  const date = new Date(ms);
  return [date.getHours(), date.getMinutes()];
}

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
      justifyContent: 'space-between',
    },
    top: {
      alignItems: 'center',
      gap: spacing.md,
    },
    timeLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    time: {
      fontSize: 88,
      fontWeight: '300',
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    period: {
      fontSize: 36,
      color: colors.text,
    },
    label: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    buttons: {
      gap: spacing.md,
    },
    button: {
      minHeight: BUTTON_HEIGHT,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    snooze: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    stop: {
      backgroundColor: colors.accent,
    },
    buttonText: {
      fontSize: 24,
      fontWeight: '700',
    },
    snoozeText: {
      color: colors.text,
    },
    stopText: {
      color: colors.onAccent,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
