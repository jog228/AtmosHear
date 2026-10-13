import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import { cardShadow, colors, radius, spacing } from '@/constants/theme';
import type { HourlyForecast as Hour } from '@/services/weather';

import { WeatherIcon } from './weather-icon';

export function HourlyForecast({ hours }: { hours: Hour[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        Next 12 hours
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.scroller}
      >
        {hours.map((hour) => {
          const profile = conditionProfiles[hour.condition];
          return (
            <View
              key={hour.time}
              style={styles.card}
              accessible
              accessibilityLabel={`${hour.hourLabel}, ${profile.label}, ${hour.temperature} degrees, ${hour.rainChance} percent chance of rain`}
            >
              <Text style={styles.hour}>{hour.hourLabel}</Text>
              <WeatherIcon condition={hour.condition} isDay={hour.isDay} size={28} color={profile.color} />
              <Text style={styles.temperature}>{hour.temperature}°</Text>
              <Text style={styles.rain}>{hour.rainChance}%</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
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
    minWidth: 68,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    ...cardShadow,
  },
  hour: {
    fontSize: 14,
    color: colors.textMuted,
  },
  temperature: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  rain: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
