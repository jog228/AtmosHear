import type { SymbolViewProps } from 'expo-symbols';

import type { ConditionId } from './conditions';
import { conditionAccents } from './theme';

type SymbolName = SymbolViewProps['name'];

export type ConditionProfile = {
  label: string;
  color: string;
  icon: SymbolName;
  nightIcon?: SymbolName;
  // Filled in later steps: sound file, haptic pattern, light animation.
};

// The single place that defines how each condition looks (and later sounds
// and feels). Colors live in theme.ts so the visual style can be swapped
// in one spot.
export const conditionProfiles: Record<ConditionId, ConditionProfile> = {
  'clear': {
    label: 'Clear',
    color: conditionAccents['clear'],
    icon: { ios: 'sun.max.fill', android: 'sunny', web: 'sunny' },
    nightIcon: { ios: 'moon.stars.fill', android: 'bedtime', web: 'bedtime' },
  },
  'partly-cloudy': {
    label: 'Partly cloudy',
    color: conditionAccents['partly-cloudy'],
    icon: { ios: 'cloud.sun.fill', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
    nightIcon: { ios: 'cloud.moon.fill', android: 'partly_cloudy_night', web: 'partly_cloudy_night' },
  },
  'overcast': {
    label: 'Overcast',
    color: conditionAccents['overcast'],
    icon: { ios: 'cloud.fill', android: 'cloud', web: 'cloud' },
  },
  'light-rain': {
    label: 'Light rain',
    color: conditionAccents['light-rain'],
    icon: { ios: 'cloud.drizzle.fill', android: 'rainy', web: 'rainy' },
  },
  'heavy-rain': {
    label: 'Heavy rain',
    color: conditionAccents['heavy-rain'],
    icon: { ios: 'cloud.heavyrain.fill', android: 'rainy_heavy', web: 'rainy_heavy' },
  },
  'thunderstorm': {
    label: 'Thunderstorm',
    color: conditionAccents['thunderstorm'],
    icon: { ios: 'cloud.bolt.rain.fill', android: 'thunderstorm', web: 'thunderstorm' },
  },
  'snow': {
    label: 'Snow',
    color: conditionAccents['snow'],
    icon: { ios: 'cloud.snow.fill', android: 'weather_snowy', web: 'weather_snowy' },
  },
  'sleet': {
    label: 'Sleet',
    color: conditionAccents['sleet'],
    icon: { ios: 'cloud.sleet.fill', android: 'weather_mix', web: 'weather_mix' },
  },
  'fog': {
    label: 'Fog',
    color: conditionAccents['fog'],
    icon: { ios: 'cloud.fog.fill', android: 'foggy', web: 'foggy' },
  },
  'wind': {
    label: 'Windy',
    color: conditionAccents['wind'],
    icon: { ios: 'wind', android: 'air', web: 'air' },
  },
  'extreme-heat': {
    label: 'Extreme heat',
    color: conditionAccents['extreme-heat'],
    icon: { ios: 'thermometer.sun.fill', android: 'thermostat', web: 'thermostat' },
  },
  'extreme-cold': {
    label: 'Extreme cold',
    color: conditionAccents['extreme-cold'],
    icon: { ios: 'thermometer.snowflake', android: 'ac_unit', web: 'ac_unit' },
  },
  'severe-alert': {
    label: 'Severe weather alert',
    color: conditionAccents['severe-alert'],
    icon: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  },
};
