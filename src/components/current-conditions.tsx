import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import { spacing, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTheme } from '@/hooks/use-theme';
import type { CurrentWeather } from '@/services/weather-data';

import { WeatherIcon } from './weather-icon';

type Props = {
  current: CurrentWeather;
  // During a severe alert, tapping the icon replays the alert beeps.
  alertActive: boolean;
  // Tapping the icon replays the condition's sound and vibration.
  onReplay: () => void;
};

export function CurrentConditions({ current, alertActive, onReplay }: Props) {
  const styles = createStyles(useTheme());
  const temperature = useTemperature();
  const description = describeConditions(current.conditions);
  const label = conditionProfiles[mostSignificant(current.conditions)].label.toLowerCase();

  return (
    <View style={styles.container}>
      {/* No visible button: the icon itself is the control. */}
      <Pressable
        onPress={onReplay}
        accessibilityRole="button"
        // "Replay clear weather", but "Replay severe weather alert".
        accessibilityLabel={`Replay ${label.includes('weather') ? label : `${label} weather`}`}
        accessibilityHint={alertActive ? 'Plays the alert sound and vibration again' : 'Plays the sound and vibration for this weather'}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <WeatherIcon conditions={current.conditions} size={220} />
      </Pressable>
      <View accessible accessibilityLabel={`${description}, ${temperature.value(current.temperature)} degrees ${temperature.name}`}>
        <Text style={styles.condition}>{description}</Text>
        {/* "72°F": the unit is smaller and raised, and the whole thing is
            centered together. */}
        <View style={styles.temperatureRow}>
          <Text style={styles.temperature} maxFontSizeMultiplier={1.3}>
            {temperature.value(current.temperature)}
          </Text>
          <Text style={styles.unit} maxFontSizeMultiplier={1.3}>
            °{temperature.letter}
          </Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    // Subtle cue that the icon is tappable.
    pressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.85,
    },
    condition: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    temperatureRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    unit: {
      fontSize: 40,
      fontWeight: '300',
      color: theme.colors.largeNumber,
      // Lines the unit up with the top of the numbers.
      marginTop: 14,
    },
    temperature: {
      fontSize: 88,
      fontWeight: '200',
      color: theme.colors.largeNumber,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
  });
}
