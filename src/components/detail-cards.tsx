import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { cardShadow, colors, radius, spacing } from '@/constants/theme';
import type { CurrentWeather } from '@/services/weather';

type Detail = {
  label: string;
  value: string;
  spoken: string;
  icon: SymbolViewProps['name'];
};

type Props = {
  current: CurrentWeather;
  accent: string;
};

export function DetailCards({ current, accent }: Props) {
  const details: Detail[] = [
    {
      label: 'Wind',
      value: `${current.windSpeed} mph`,
      spoken: `${current.windSpeed} miles per hour`,
      icon: { ios: 'wind', android: 'air', web: 'air' },
    },
    {
      label: 'Humidity',
      value: `${current.humidity}%`,
      spoken: `${current.humidity} percent`,
      icon: { ios: 'humidity.fill', android: 'humidity_percentage', web: 'humidity_percentage' },
    },
    {
      label: 'Rain',
      value: `${current.rainChance}%`,
      spoken: `${current.rainChance} percent chance`,
      icon: { ios: 'umbrella.fill', android: 'umbrella', web: 'umbrella' },
    },
    {
      label: 'Feels like',
      value: `${current.feelsLike}°`,
      spoken: `${current.feelsLike} degrees`,
      icon: { ios: 'thermometer.medium', android: 'thermometer', web: 'thermometer' },
    },
  ];

  return (
    <View style={styles.row}>
      {details.map((detail) => (
        <View
          key={detail.label}
          style={styles.card}
          accessible
          accessibilityLabel={`${detail.label}, ${detail.spoken}`}
        >
          <SymbolView name={detail.icon} size={22} tintColor={accent} accessible={false} />
          <Text style={styles.value}>{detail.value}</Text>
          <Text style={styles.label}>{detail.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    flexGrow: 1,
    flexBasis: 72,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    ...cardShadow,
  },
  value: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
