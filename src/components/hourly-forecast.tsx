import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import { spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HourlyForecast as Hour } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { WeatherIcon } from './weather-icon';

// One glass panel with the heading inside, so no text sits directly on the
// colored blobs behind the cards.
export function HourlyForecast({ hours }: { hours: Hour[] }) {
  const styles = createStyles(useTheme());
  // A saved forecast may have fewer hours left.
  if (hours.length === 0) return null;

  return (
    <GlassCard style={styles.panel}>
      <Text style={styles.heading} accessibilityRole="header">
        Next {hours.length} hours
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {hours.map((hour) => (
          <View
            key={hour.time}
            style={styles.hourColumn}
            accessible
            accessibilityLabel={`${hour.hourLabel}, ${describeConditions(hour.conditions)}, ${hour.temperature} degrees, ${hour.rainChance} percent chance of rain`}
          >
            <Text style={styles.hour}>{hour.hourLabel}</Text>
            <WeatherIcon conditions={hour.conditions} size={44} />
            <Text style={styles.condition}>{conditionProfiles[mostSignificant(hour.conditions)].label}</Text>
            <Text style={styles.temperature}>{hour.temperature}°</Text>
            <Text style={styles.rain}>{hour.rainChance}%</Text>
          </View>
        ))}
      </ScrollView>
    </GlassCard>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    panel: {
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    heading: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.heading,
      paddingHorizontal: spacing.md,
    },
    list: {
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    hourColumn: {
      alignItems: 'center',
      gap: spacing.sm,
      width: 88,
      paddingVertical: spacing.sm,
    },
    hour: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    condition: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    temperature: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    rain: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
  });
}
