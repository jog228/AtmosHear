import { StyleSheet, Text, View } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import { colors, spacing } from '@/constants/theme';
import type { CurrentWeather } from '@/services/weather';

import { WeatherIcon } from './weather-icon';

export function CurrentConditions({ current }: { current: CurrentWeather }) {
  const profile = conditionProfiles[current.condition];

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${profile.label}, ${current.temperature} degrees Fahrenheit`}
    >
      <View style={[styles.halo, { backgroundColor: `${profile.color}1A` }]}>
        <WeatherIcon
          condition={current.condition}
          isDay={current.isDay}
          size={112}
          color={profile.color}
        />
      </View>
      <Text style={styles.condition}>{profile.label}</Text>
      <Text style={styles.temperature} maxFontSizeMultiplier={1.3}>
        {current.temperature}°
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  halo: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  condition: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  temperature: {
    fontSize: 88,
    fontWeight: '200',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
