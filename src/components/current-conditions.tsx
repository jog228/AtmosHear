import { StyleSheet, Text, View } from 'react-native';

import { describeConditions } from '@/constants/condition-profiles';
import { spacing, withAlpha, type Theme } from '@/constants/theme';
import { useConditionColors, useTheme } from '@/hooks/use-theme';
import type { CurrentWeather } from '@/services/weather-data';

import { WeatherIcon } from './weather-icon';

export function CurrentConditions({ current }: { current: CurrentWeather }) {
  const styles = createStyles(useTheme());
  const [mainCondition] = current.conditions;
  const description = describeConditions(current.conditions);
  const { primary } = useConditionColors(mainCondition);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`${description}, ${current.temperature} degrees Fahrenheit`}
    >
      <View style={[styles.halo, { backgroundColor: withAlpha(primary, 0.15) }]}>
        <WeatherIcon condition={mainCondition} isDay={current.isDay} size={112} />
      </View>
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
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    temperature: {
      fontSize: 88,
      fontWeight: '200',
      color: theme.colors.textPrimary,
      fontVariant: ['tabular-nums'],
    },
  });
}
