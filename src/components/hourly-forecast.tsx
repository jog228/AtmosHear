import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import { radius, spacing, typography, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTheme } from '@/hooks/use-theme';
import type { HourlyForecast as Hour } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { WeatherIcon } from './weather-icon';

// A headline above a flat card of hours, like design/frames/07_Weather_scrolled.png.
export function HourlyForecast({ hours }: { hours: Hour[] }) {
  const styles = createStyles(useTheme());
  const temperature = useTemperature();
  // A saved forecast may have fewer hours left.
  if (hours.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        Next {hours.length} hours
      </Text>
      <GlassCard style={styles.panel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
          {hours.map((hour, i) => (
            <View
              key={hour.time}
              // The current hour is highlighted, like the frames.
              style={[styles.hourColumn, i === 0 && styles.firstHour]}
              accessible
              accessibilityLabel={`${hour.hourLabel}, ${describeConditions(hour.conditions)}, ${temperature.value(hour.temperature)} degrees, ${hour.rainChance} percent chance of rain`}
            >
              <Text style={styles.hour}>{hour.hourLabel}</Text>
              <WeatherIcon conditions={hour.conditions} size={44} />
              <Text style={styles.condition}>{conditionProfiles[mostSignificant(hour.conditions)].label}</Text>
              <Text style={styles.temperature}>{temperature.value(hour.temperature)}°</Text>
              <Text style={styles.rain}>{hour.rainChance}%</Text>
            </View>
          ))}
        </ScrollView>
      </GlassCard>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      gap: spacing.md,
    },
    panel: {
      paddingVertical: spacing.sm,
    },
    heading: {
      ...typography.h2,
      color: theme.colors.textPrimary,
    },
    list: {
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    hourColumn: {
      alignItems: 'center',
      gap: spacing.sm,
      width: 88,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    // The page color inside the card: a soft tile, like her "Now" card.
    firstHour: {
      backgroundColor: theme.colors.background,
    },
    hour: {
      ...typography.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    condition: {
      ...typography.caption,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    temperature: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    rain: {
      ...typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}
