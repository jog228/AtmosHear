import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import { cardShadow, radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HourlyForecast as Hour } from '@/services/weather-data';

import { WeatherIcon } from './weather-icon';

export function HourlyForecast({ hours }: { hours: Hour[] }) {
  const styles = createStyles(useTheme());
  // A saved forecast may have fewer hours left.
  if (hours.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        Next {hours.length} hours
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.scroller}
      >
        {hours.map((hour) => (
          <View
            key={hour.time}
            style={styles.card}
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
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    heading: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.heading,
    },
    // Let cards run to the screen edges while the heading stays padded.
    scroller: {
      marginHorizontal: -spacing.md,
    },
    list: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    card: {
      alignItems: 'center',
      gap: spacing.sm,
      width: 96,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      ...cardShadow(theme),
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
