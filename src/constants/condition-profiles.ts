import type { AudioSource } from 'expo-audio';
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
  // Looping ambient sound from assets/sounds, or null for silence. Must be a
  // static require() so Expo bundles the file.
  sound: AudioSource | null;
  // Optional loudness correction for a file that's louder than the others
  // (0-1, default 1). Multiplies the ambient volume.
  soundVolume?: number;
  // For background sounds like wind: when another condition's sound plays
  // too, this one drops to this share of its solo level (0-1) so the main
  // condition stays in front. Alone, it plays at full level.
  supportingVolume?: number;
  // Per-condition overrides of supportingVolume, e.g. quieter under snow.
  // With several other sounds, the lowest applies.
  supportingVolumeWith?: Partial<Record<ConditionId, number>>;
  // Filled in later steps: haptic pattern, light animation.
};

// The single place that defines how each condition looks (and later sounds
// and feels). To change a condition's color, swap the palette names below.
// To change its icon, replace the PNG (same file name) or the require().
export const conditionProfiles: Record<ConditionId, ConditionProfile> = {
  'clear': {
    label: 'Clear',
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/01-clear.png'),
    sound: require('../../assets/sounds/clear.m4a'),
  },
  'partly-cloudy': {
    label: 'Partly cloudy',
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/02-partly-cloudy.png'),
    // TODO: awaiting sound from teammate.
    sound: null,
  },
  'overcast': {
    label: 'Overcast',
    color: { light: palette.gray, dark: darkPalette.gray },
    icon: require('../../assets/icons/weather-icons/03-overcast.png'),
    // A low, muted hum, intentionally softer (-29.1 LUFS vs clear's -27.3).
    // Don't normalize it up.
    sound: require('../../assets/sounds/overcast.m4a'),
    // Overcast is a supporting layer: its low end would muddy light rain at
    // full level, so it drops to 60% under other sounds.
    supportingVolume: 0.6,
  },
  'light-rain': {
    label: 'Light rain',
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/04-light-rain.png'),
    // Intentionally a step softer than heavy rain (-33.5 LUFS vs heavy
    // rain's -24.2 after its correction). Don't normalize it.
    sound: require('../../assets/sounds/light-rain.m4a'),
  },
  'heavy-rain': {
    label: 'Heavy rain',
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/05-heavy-rain.png'),
    sound: require('../../assets/sounds/heavy-rain.m4a'),
    // Meant to sit between clear and thunderstorm, but the file measures
    // -21.1 LUFS (same as thunderstorm), so this brings it to about -24.2.
    soundVolume: 0.7,
  },
  'thunderstorm': {
    label: 'Thunderstorm',
    color: { light: palette.ink, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/06-thunderstorm.png'),
    // Intentionally louder to feel intense (-21.2 LUFS vs clear's -27.3).
    // Don't normalize it down.
    sound: require('../../assets/sounds/thunderstorm.m4a'),
  },
  'snow': {
    label: 'Snow',
    color: { light: palette.deepBlue, dark: darkPalette.iceBlue },
    icon: require('../../assets/icons/weather-icons/07-snow.png'),
    // Intentionally a bit softer to feel hushed (-28.3 LUFS vs clear's
    // -27.3). Don't normalize it up.
    sound: require('../../assets/sounds/snow.m4a'),
  },
  'sleet': {
    label: 'Sleet',
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/08-sleet.png'),
    sound: require('../../assets/sounds/sleet.m4a'),
    // sleet.m4a measures -21.0 LUFS vs clear.m4a at -27.3 (6.3 LU louder).
    // 0.48 = -6.3 dB. Remove once the file is re-exported to match.
    soundVolume: 0.48,
  },
  'fog': {
    label: 'Fog',
    color: { light: palette.gray, dark: darkPalette.gray },
    icon: require('../../assets/icons/weather-icons/09-fog.png'),
    // A low, airy drone, meant to sit soft. Measures -27.3 LUFS (same as
    // clear), so no correction. Don't normalize it up.
    sound: require('../../assets/sounds/fog.m4a'),
  },
  'wind': {
    label: 'Windy',
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/10-wind.png'),
    sound: require('../../assets/sounds/wind.m4a'),
    // Gusty recording at -30.4 LUFS (3.1 LU under clear), so no correction.
    // Wind is a supporting layer: half its solo level under other sounds.
    supportingVolume: 0.5,
    // Wind's low rumble covers quiet sounds, so it goes further down under
    // them. Under snow, snow stays louder in every frequency band; under
    // light rain (the quietest sound), the rain stays about 9 LU in front.
    supportingVolumeWith: { 'snow': 0.3, 'light-rain': 0.25 },
  },
  'extreme-heat': {
    label: 'Extreme heat',
    // TODO: awaiting final color from design team.
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: require('../../assets/icons/weather-icons/11-extreme-heat.png'),
    // TODO: awaiting sound from teammate.
    sound: null,
  },
  'extreme-cold': {
    label: 'Extreme cold',
    // TODO: awaiting final color from design team.
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/12-extreme-cold.png'),
    // A sharp ice crack once per second, so the 4-second loop must stay
    // exactly 4.000 s. Measures -28.0 LUFS; don't normalize it.
    sound: require('../../assets/sounds/extreme-cold.m4a'),
  },
  'severe-alert': {
    label: 'Severe weather alert',
    // TODO: awaiting final color from design team.
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: require('../../assets/icons/weather-icons/13-severe-alert.png'),
    // No ambient loop: the alert beeps instead (src/constants/alert-sound.ts),
    // then the conditions underneath it keep playing.
    sound: null,
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
