import type { ImageProps } from 'expo-image';

import { sortByPriority } from './condition-priority';
import type { ConditionId } from './conditions';
import { darkPalette, palette } from './theme';

export type ConditionProfile = {
  label: string;
  // Accent color for this condition (e.g. the detail card icons), for the
  // light and dark themes. Dark colors must reach 3:1 on the navy background.
  color: { light: string; dark: string };
  // 1024x1024 PNG from assets/icons/weather-icons. Must be a static
  // require() so Expo bundles the file.
  icon: ImageProps['source'];
  // Filled in later steps: sound file, haptic pattern, light animation.
};

// The single place that defines how each condition looks (and later sounds
// and feels). To change a condition's color, swap the palette names below.
// To change its icon, replace the PNG (same file name) or the require().
export const conditionProfiles: Record<ConditionId, ConditionProfile> = {
  'clear': {
    label: 'Clear',
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/01-clear.png'),
  },
  'partly-cloudy': {
    label: 'Partly cloudy',
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/02-partly-cloudy.png'),
  },
  'overcast': {
    label: 'Overcast',
    color: { light: palette.gray, dark: darkPalette.gray },
    icon: require('../../assets/icons/weather-icons/03-overcast.png'),
  },
  'light-rain': {
    label: 'Light rain',
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/04-light-rain.png'),
  },
  'heavy-rain': {
    label: 'Heavy rain',
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/05-heavy-rain.png'),
  },
  'thunderstorm': {
    label: 'Thunderstorm',
    color: { light: palette.ink, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/06-thunderstorm.png'),
  },
  'snow': {
    label: 'Snow',
    color: { light: palette.deepBlue, dark: darkPalette.iceBlue },
    icon: require('../../assets/icons/weather-icons/07-snow.png'),
  },
  'sleet': {
    label: 'Sleet',
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/08-sleet.png'),
  },
  'fog': {
    label: 'Fog',
    color: { light: palette.gray, dark: darkPalette.gray },
    icon: require('../../assets/icons/weather-icons/09-fog.png'),
  },
  'wind': {
    label: 'Windy',
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/10-wind.png'),
  },
  'extreme-heat': {
    label: 'Extreme heat',
    // TODO: awaiting final color from design team.
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/11-extreme-heat.png'),
  },
  'extreme-cold': {
    label: 'Extreme cold',
    // TODO: awaiting final color from design team.
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/12-extreme-cold.png'),
  },
  'severe-alert': {
    label: 'Severe weather alert',
    // TODO: awaiting final color from design team.
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/13-severe-alert.png'),
  },
};

// ['wind', 'light-rain'] -> "Light rain and windy". Most significant first,
// so the text always starts with the condition whose icon is shown.
export function describeConditions(ids: ConditionId[]): string {
  const labels = sortByPriority(ids).map((id, i) =>
    i === 0 ? conditionProfiles[id].label : conditionProfiles[id].label.toLowerCase(),
  );
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
