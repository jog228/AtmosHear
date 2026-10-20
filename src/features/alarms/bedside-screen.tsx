import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ClockSun } from '@/components/brand';
import { darkPalette, palette, spacing } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';

import { formatTime, timeText } from './alarm-format';

// Whether bedside mode is showing, for the Alarms tab's switch.
let open = false;
const listeners = new Set<() => void>();
function setOpen(value: boolean) {
  open = value;
  listeners.forEach((listener) => listener());
}
export function useBedsideOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
  );
}

// The same in every theme: a dim, near-black night screen. Gray on ink is
// 9.9:1, so it stays readable while staying dim.
const COLORS = { background: palette.ink, text: darkPalette.gray };

// Bedside mode (route /bedside, from the Alarms tab): keeps the screen
// awake so alarms can ring with sound, and shows the time large on a
// near-black screen. Tap anywhere to leave. An alarm opens on top of it
// and comes back here after.
export function BedsideScreen() {
  useKeepAwake();
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const now = new Date(useMinuteClock(true));
  const { time, period } = formatTime(now.getHours(), now.getMinutes(), uses24Hour);

  useEffect(() => {
    setOpen(true);
    return () => setOpen(false);
  }, []);

  return (
    <Pressable
      style={styles.screen}
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={`Bedside mode, ${timeText(now.getHours(), now.getMinutes(), uses24Hour)}`}
      accessibilityHint="Exits bedside mode"
    >
      <StatusBar hidden />
      <View style={styles.middle}>
        <ClockSun size={44} hour={now.getHours()} minute={now.getMinutes()} dimmed />
        <View style={styles.timeLine}>
          <Text style={styles.time} maxFontSizeMultiplier={1.2}>
            {time}
          </Text>
          {period !== '' && <Text style={styles.period}>{period}</Text>}
        </View>
      </View>
      <Text style={styles.note}>
        Alarms ring with sound only while AtmosHear stays open. Tap anywhere to exit.
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  timeLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  time: {
    fontSize: 96,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    color: COLORS.text,
  },
  period: {
    fontSize: 32,
    color: COLORS.text,
  },
  note: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
