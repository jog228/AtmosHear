import { StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import { spacing, typography, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/services/time';
import type { DailyForecast as Day } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { WeatherIcon } from './weather-icon';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Today and the next four days: day, icon, condition, high, and low. A
// headline above a flat card with divided rows, like
// design/frames/07_Weather_scrolled.png. The headline counts the days
// actually shown, since NWS or an older save can have fewer.
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
          const high = temperature.value(day.high);
          const low = temperature.value(day.low);
          return (
            <View
              key={day.date}
              style={[styles.row, i > 0 && styles.divider]}
              accessible
              // "Saturday, light rain, high 68, low 57."
              accessibilityLabel={`${full}, ${describeConditions(day.conditions).toLowerCase()}, high ${high}, low ${low}`}
            >
              <Text style={styles.day}>{short}</Text>
              <WeatherIcon conditions={day.conditions} />
              <Text style={styles.condition} numberOfLines={2}>
                {conditionProfiles[mostSignificant(day.conditions)].label}
              </Text>
              <View style={styles.temperatures}>
                <Text style={styles.high}>{high}°</Text>
                <Text style={styles.low}>{low}°</Text>
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
    condition: {
      ...typography.body,
      flex: 1,
      color: theme.colors.textSecondary,
    },
    temperatures: {
      flexDirection: 'row',
      gap: spacing.sm + spacing.xs,
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
