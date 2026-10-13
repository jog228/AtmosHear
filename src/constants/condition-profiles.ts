import type { SymbolViewProps } from 'expo-symbols';

import type { ConditionId } from './conditions';
import { palette } from './theme';

type SymbolName = SymbolViewProps['name'];

export type ConditionProfile = {
  label: string;
  // Main illustration and accent color.
  color: string;
  // Optional second illustration color (iOS only; Android icons are one color).
  secondaryColor?: string;
  icon: SymbolName;
  nightIcon?: SymbolName;
  // Filled in later steps: sound file, haptic pattern, light animation.
};

// The single place that defines how each condition looks (and later sounds
// and feels). To change a condition's color, swap the palette name below.
export const conditionProfiles: Record<ConditionId, ConditionProfile> = {
  'clear': {
    label: 'Clear',
    color: palette.sun,
    icon: { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' },
    nightIcon: { ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' },
  },
  'partly-cloudy': {
    label: 'Partly cloudy',
    color: palette.sun,
    secondaryColor: palette.periwinkle,
    icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
    nightIcon: { ios: 'cloud.moon.fill', android: 'partly_cloudy_night', web: 'partly_cloudy_night' },
  },
  'overcast': {
    label: 'Overcast',
    color: palette.gray,
    icon: { ios: 'cloud.fill', android: 'cloud', web: 'cloud' },
  },
  'light-rain': {
    label: 'Light rain',
    color: palette.periwinkle,
    icon: { ios: 'cloud.drizzle.fill', android: 'rainy', web: 'rainy' },
  },
  'heavy-rain': {
    label: 'Heavy rain',
    color: palette.deepBlue,
    icon: { ios: 'cloud.heavyrain.fill', android: 'rainy_heavy', web: 'rainy_heavy' },
  },
  'thunderstorm': {
    label: 'Thunderstorm',
    color: palette.ink,
    icon: { ios: 'cloud.bolt.rain.fill', android: 'thunderstorm', web: 'thunderstorm' },
  },
  'snow': {
    label: 'Snow',
    color: palette.deepBlue,
    icon: { ios: 'cloud.snow.fill', android: 'weather_snowy', web: 'weather_snowy' },
  },
  'sleet': {
    label: 'Sleet',
    color: palette.deepBlue,
    icon: { ios: 'cloud.sleet.fill', android: 'weather_mix', web: 'weather_mix' },
  },
  'fog': {
    label: 'Fog',
    color: palette.gray,
    icon: { ios: 'cloud.fog.fill', android: 'foggy', web: 'foggy' },
  },
  'wind': {
    label: 'Windy',
    color: palette.periwinkle,
    icon: { ios: 'wind', android: 'air', web: 'air' },
  },
  'extreme-heat': {
    label: 'Extreme heat',
    // TODO: awaiting final color from design team.
    color: palette.sun,
    icon: { ios: 'thermometer.sun.fill', android: 'thermostat', web: 'thermostat' },
  },
  'extreme-cold': {
    label: 'Extreme cold',
    // TODO: awaiting final color from design team.
    color: palette.periwinkle,
    icon: { ios: 'thermometer.snowflake', android: 'ac_unit', web: 'ac_unit' },
  },
  'severe-alert': {
    label: 'Severe weather alert',
    // TODO: awaiting final color from design team.
    color: palette.deepBlue,
    icon: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  },
};

// ['light-rain', 'wind'] -> "Light rain and windy"
export function describeConditions(ids: ConditionId[]): string {
  const labels = ids.map((id, i) => (i === 0 ? conditionProfiles[id].label : conditionProfiles[id].label.toLowerCase()));
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
