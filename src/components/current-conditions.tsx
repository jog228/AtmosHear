import { Pressable, StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import { LARGE_TEXT_MAX_SCALE, spacing, typography, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTextTrim } from '@/hooks/use-text-trim';
import { useTheme } from '@/hooks/use-theme';
import type { CurrentWeather, DailyForecast } from '@/services/weather-data';

import { WeatherHero } from './weather-hero';

// Fits the hero, condition name, temperature, and detail cards on one
// iPhone screen at the default text size.
const HERO_SIZE = 232;

type Props = {
  current: CurrentWeather;
  // Today's high and low, shown beside the temperature. Missing when a saved
  // forecast has no days left.
  today?: DailyForecast;
  // During a severe alert, tapping the hero replays the alert beeps.
  alertActive: boolean;
  // Tapping the hero replays the condition's sound and vibration.
  onReplay: () => void;
  // False while another tab is showing: pauses the hero's clock and motion.
  visible: boolean;
};

export function CurrentConditions({ current, today, alertActive, onReplay, visible }: Props) {
  const styles = createStyles(useTheme());
  const temperature = useTemperature();
  const description = describeConditions(current.conditions);
  const label = conditionProfiles[mostSignificant(current.conditions)].label.toLowerCase();
  const highLow = today
    ? `, high ${temperature.value(today.high)}, low ${temperature.value(today.low)}`
    : '';
  // Trimmed to the tops of the digits and to the baseline, so the unit lines
  // up with the top of the number and High/Low with its bottom.
  const numberTrim = useTextTrim();
  const unitTrim = useTextTrim({ bottom: false });
  const highLowTrim = useTextTrim({ top: false });

  return (
    <View style={styles.container}>
      {/* No visible button: the illustration itself is the control. */}
      <Pressable
        onPress={onReplay}
        accessibilityRole="button"
        // "Replay clear weather", but "Replay severe weather alert".
        accessibilityLabel={`Replay ${label.includes('weather') ? label : `${label} weather`}`}
        accessibilityHint={alertActive ? 'Plays the alert sound and vibration again' : 'Plays the sound and vibration for this weather'}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <WeatherHero conditions={current.conditions} size={HERO_SIZE} visible={visible} />
      </Pressable>
      <View
        style={styles.summary}
        accessible
        accessibilityLabel={`${description}, ${temperature.value(current.temperature)} degrees ${temperature.name}${highLow}`}
      >
        <Text style={styles.condition}>{description}</Text>
        {/* "72°F" on the left, High and Low on the right with their last
            line on the number's baseline. Wraps under it at the largest
            text sizes. */}
        <View style={styles.temperatureRow}>
          <View style={styles.reading}>
            <Text
              style={[styles.temperature, numberTrim.style]}
              onTextLayout={numberTrim.onTextLayout}
              maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}
            >
              {temperature.value(current.temperature)}
            </Text>
            {/* The unit is smaller and raised. */}
            <Text
              style={[styles.unit, unitTrim.style]}
              onTextLayout={unitTrim.onTextLayout}
              maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}
            >
              °{temperature.letter}
            </Text>
          </View>
          {today && (
            <Text style={[styles.highLow, highLowTrim.style]} onTextLayout={highLowTrim.onTextLayout}>
              High {temperature.value(today.high)}°{'\n'}Low {temperature.value(today.low)}°
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    // The hero stays centered, like the frames; the text below is
    // left-aligned, close under it.
    container: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    // Subtle cue that the hero is tappable.
    pressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.85,
    },
    summary: {
      alignSelf: 'stretch',
      gap: spacing.sm,
    },
    condition: {
      ...typography.title,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    temperatureRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      columnGap: spacing.md,
      rowGap: spacing.sm,
    },
    reading: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    // The natural line height (no lineHeight), so useTextTrim's
    // measurements match the box.
    temperature: {
      ...typography.display,
      lineHeight: undefined,
      color: theme.colors.largeNumber,
      fontVariant: ['tabular-nums'],
    },
    unit: {
      ...typography.h2,
      fontSize: 40,
      lineHeight: undefined,
      color: theme.colors.largeNumber,
      marginLeft: 2,
    },
    highLow: {
      ...typography.title,
      lineHeight: undefined,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      fontVariant: ['tabular-nums'],
      textAlign: 'right',
      marginLeft: 'auto',
    },
  });
}
