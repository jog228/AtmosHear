import { StyleSheet, Text, View } from 'react-native';

import { describeConditions } from '@/constants/condition-profiles';
import { spacing, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/services/time';
import type { DailyForecast as Day } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { WeatherIcon } from './weather-icon';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Today and the next two days: icon, high, and low. Same glass panel as the
// hourly forecast, heading inside.
export function DailyForecast({ days }: { days: Day[] }) {
  const styles = createStyles(useTheme());
  const temperature = useTemperature();
  if (days.length === 0) return null;
  const today = localDateString();

  return (
    <GlassCard style={styles.panel}>
      <Text style={styles.heading} accessibilityRole="header">
        {days.length}-day forecast
      </Text>
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
    panel: {
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    heading: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.heading,
      paddingHorizontal: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      paddingHorizontal: spacing.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    day: {
      width: 64,
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    temperatures: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.md,
    },
    high: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    low: {
      fontSize: 17,
      color: theme.colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
}
