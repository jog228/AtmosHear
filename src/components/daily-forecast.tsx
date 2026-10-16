import { StyleSheet, Text, View } from 'react-native';

import { describeConditions } from '@/constants/condition-profiles';
import { spacing, typography, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/services/time';
import type { DailyForecast as Day } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { WeatherIcon } from './weather-icon';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Today and the next two days: icon, high, and low. A headline above a flat
// card with divided rows, like design/frames/07_Weather_scrolled.png.
export function DailyForecast({ days }: { days: Day[] }) {
  const styles = createStyles(useTheme());
  const temperature = useTemperature();
  if (days.length === 0) return null;
  const today = localDateString();

  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        {days.length}-day forecast
      </Text>
      <GlassCard style={styles.panel}>
        {days.map((day, i) => {
          const { short, full } = dayNames(day.date, today);
          return (
            <View
              key={day.date}
              style={[styles.row, i > 0 && styles.divider]}
              accessible
              accessibilityLabel={`${full}, ${describeConditions(day.conditions)}, high ${temperature.value(day.high)} degrees, low ${temperature.value(day.low)} degrees`}
            >
              <Text style={styles.day}>{short}</Text>
              <WeatherIcon conditions={day.conditions} size={40} />
              <View style={styles.temperatures}>
                <Text style={styles.high}>H {temperature.value(day.high)}°</Text>
                <Text style={styles.low}>L {temperature.value(day.low)}°</Text>
              </View>
            </View>
          );
        })}
      </GlassCard>
    </View>
  );
}

// "Today", otherwise the weekday: "Sat" on screen, "Saturday" for VoiceOver.
function dayNames(date: string, today: string): { short: string; full: string } {
  if (date === today) return { short: 'Today', full: 'Today' };
  const [year, month, day] = date.split('-').map(Number);
  const weekday = new Date(year, month - 1, day).getDay();
  return { short: SHORT_DAYS[weekday], full: FULL_DAYS[weekday] };
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      gap: spacing.md,
    },
    panel: {
      paddingVertical: spacing.xs,
    },
    heading: {
      ...typography.h2,
      color: theme.colors.textPrimary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 64,
      paddingHorizontal: spacing.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    day: {
      ...typography.title,
      width: 72,
      color: theme.colors.textPrimary,
    },
    temperatures: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
    },
    high: {
      ...typography.title,
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    low: {
      ...typography.title,
      fontWeight: '400',
      color: theme.colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
}
