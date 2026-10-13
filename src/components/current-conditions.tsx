import { StyleSheet, Text, View } from 'react-native';

import { describeConditions } from '@/constants/condition-profiles';
import { type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CurrentWeather } from '@/services/weather-data';

import { WeatherIcon } from './weather-icon';

export function CurrentConditions({ current }: { current: CurrentWeather }) {
  const styles = createStyles(useTheme());
  const description = describeConditions(current.conditions);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${description}, ${current.temperature} degrees Fahrenheit`}
    >
      <WeatherIcon conditions={current.conditions} size={220} />
      <Text style={styles.condition}>{description}</Text>
      <Text style={styles.temperature} maxFontSizeMultiplier={1.3}>
        {current.temperature}°
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    condition: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    temperature: {
      fontSize: 88,
      fontWeight: '200',
      color: theme.colors.largeNumber,
      fontVariant: ['tabular-nums'],
    },
  });
}
