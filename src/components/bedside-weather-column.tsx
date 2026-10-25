import { StyleSheet, Text, View } from 'react-native';

import { bedsidePalette as COLORS, FONT_FAMILY, spacing } from '@/constants/theme';
import type { ConditionId } from '@/constants/conditions';
import { bedsideTextSize } from '@/features/alarms/bedside-layout';

import { WeatherIcon } from './weather-icon';

// Bedside text grows with Dynamic Type only a little: landscape has no room.
const MAX_SCALE = 1.2;
// Larger than the list icons (CONDITION_ICON_SIZE), like the bedside frame.
// Same shape as everywhere else; the bedside dome's periwinkle.
const ICON_SIZE = 40;

type Props = {
  // The bedside screen's scale (src/features/alarms/bedside-layout.ts).
  scale: number;
  // The current conditions; the most significant one's icon shows.
  conditions: ConditionId[];
  temperature: string;
  condition: string;
  feelsLike: string | null;
  highLow: string | null;
};

// Bedside mode's left column (design/frames/9 · Centered dome@2x.png): the
// condition's dotted icon, the temperature, the condition, a thin line,
// then feels like and today's high and low. Dark and dim in every theme.
// Read as part of the screen's one VoiceOver summary, so hidden here.
export function BedsideWeatherColumn({ scale, conditions, temperature, condition, feelsLike, highLow }: Props) {
  const size = (ref: number) => {
    const fontSize = bedsideTextSize(ref, scale);
    return { fontSize, lineHeight: Math.round(fontSize * 1.25) };
  };
  return (
    <View style={styles.column} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <WeatherIcon conditions={conditions} size={Math.round(ICON_SIZE * scale)} color={COLORS.domeAhead} />
      <Text
        style={[styles.temperature, { fontSize: bedsideTextSize(46, scale), lineHeight: bedsideTextSize(54, scale) }]}
        maxFontSizeMultiplier={MAX_SCALE}
      >
        {temperature}
      </Text>
      <Text style={[styles.condition, size(17)]} numberOfLines={2} maxFontSizeMultiplier={MAX_SCALE}>
        {condition}
      </Text>
      {(feelsLike || highLow) && <View style={[styles.divider, { marginVertical: Math.round(10 * scale) }]} />}
      {feelsLike && (
        <Text style={[styles.detail, size(15)]} maxFontSizeMultiplier={MAX_SCALE}>
          {feelsLike}
        </Text>
      )}
      {highLow && (
        <Text style={[styles.detail, size(15)]} maxFontSizeMultiplier={MAX_SCALE}>
          {highLow}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'flex-start',
  },
  // Sizes are set per scale above.
  temperature: {
    fontFamily: FONT_FAMILY,
    fontWeight: '300',
    color: COLORS.brightText,
    marginTop: spacing.sm,
  },
  condition: {
    fontFamily: FONT_FAMILY,
    color: COLORS.mainText,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: COLORS.divider,
  },
  detail: {
    fontFamily: FONT_FAMILY,
    color: COLORS.mainText,
  },
});
