import type { AudioSource } from 'expo-audio';

import {
  ClearIcon,
  ExtremeColdIcon,
  ExtremeHeatIcon,
  FogIcon,
  HeavyRainIcon,
  LightRainIcon,
  OvercastIcon,
  PartlyCloudyIcon,
  SevereAlertIcon,
  SleetIcon,
  SnowIcon,
  ThunderstormIcon,
  WindIcon,
  type DotIconComponent,
} from '../components/icons';
import { sortByPriority } from './condition-priority';
import { contrastRatio, type ContrastPair } from './contrast';
import type { ConditionId } from './conditions';
import { taps, tapsEvery, type HapticPattern } from './haptics';
import { breathe, hold, maxFlashesPerSecond, MAX_FLASHES_PER_SECOND, type LightCue } from './light-cues';
import { cueColors, darkPalette, palette } from './theme';

export type ConditionProfile = {
  label: string;
  // Accent color for this condition (e.g. the detail card icons), for the
  // light and dark themes. Dark colors must reach 3:1 on the navy background.
  color: { light: string; dark: string };
  // Dotted SVG icon from src/components/icons, drawn in one color. (The
  // old PNGs in assets/icons/weather-icons are unused, kept until the team
  // confirms the switch.)
  icon: DotIconComponent;
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
  // Vibration: timed taps (src/constants/haptics.ts). Patterns differ
  // mainly by rhythm. Played once, never looped.
  haptic: HapticPattern;
  // Cue screen copy (Sound library, Feel & hear, condition detail). These
  // must describe what actually plays: update them with the sound file or
  // the haptic pattern.
  soundDescription: string;
  // e.g. "Rumble, then two sharp cracks" and "13 quick heavy taps, 2 sharp".
  vibrationDescription: string;
  vibrationDetail: string;
  // Full-screen light cue (src/constants/light-cues.ts), never more than 3
  // flashes per second.
  light: LightCue;
  lightDescription: string;
  // Text and background colors shown on the cue screens. The ratio is
  // computed from the colors (src/constants/contrast.ts), never typed in.
  contrastPair: ContrastPair;
};

// The single place that defines how each condition looks, sounds, and
// feels. To change a condition's color, swap the palette names below.
// To change its icon, edit it in src/components/icons/condition-icons.tsx.
export const conditionProfiles: Record<ConditionId, ConditionProfile> = {
  'clear': {
    label: 'Clear',
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: ClearIcon,
    soundDescription: 'Soft, low, warm hum',
    vibrationDescription: 'Slow, steady taps',
    vibrationDetail: '4 soft taps',
    light: breathe('amber', { peak: 0.5 }),
    lightDescription: 'Bright amber, slow breathe',
    contrastPair: { fg: 'amber', bg: 'navy' },
    // Slow, steady.
    haptic: taps('soft', [0, 600, 1200, 1800]),
    sound: require('../../assets/sounds/clear.m4a'),
  },
  'partly-cloudy': {
    label: 'Partly cloudy',
    color: { light: palette.sun, dark: darkPalette.yellow },
    icon: PartlyCloudyIcon,
    soundDescription: 'Sound coming soon',
    vibrationDescription: 'Tap-tap pairs',
    vibrationDetail: '3 pairs: medium, then light',
    light: breathe('amber', { peak: 0.35 }),
    lightDescription: 'Amber, slow breathe',
    contrastPair: { fg: 'amber', bg: 'navy' },
    // Medium + light pairs.
    haptic: [
      ...taps('medium', [0, 700, 1400]),
      ...taps('light', [150, 850, 1550]),
    ],
    // TODO: awaiting sound from teammate.
    sound: null,
  },
  'overcast': {
    label: 'Overcast',
    color: { light: palette.gray, dark: darkPalette.gray },
    icon: OvercastIcon,
    soundDescription: 'Low, muted hum',
    vibrationDescription: 'Very slow, faint taps',
    vibrationDetail: '3 soft taps, 1 s apart',
    light: breathe('slate', { periodMs: 6000, peak: 0.35, times: 1 }),
    lightDescription: 'Gray, very slow fade',
    contrastPair: { fg: 'white', bg: 'slate' },
    // Very slow and faint.
    haptic: taps('soft', [0, 1000, 2000]),
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
    icon: LightRainIcon,
    soundDescription: 'Quiet, soft rain',
    vibrationDescription: 'Quick, uneven patter',
    vibrationDetail: '10 light taps',
    light: breathe('periwinkle', { periodMs: 1000, peak: 0.25, times: 6 }),
    lightDescription: 'Periwinkle, gentle pulses',
    contrastPair: { fg: 'navy', bg: 'iceBlue' },
    // Quick and slightly uneven, like drops.
    haptic: taps('light', [0, 110, 260, 350, 500, 620, 760, 850, 1000, 1130]),
    // Intentionally a step softer than heavy rain (-33.5 LUFS vs heavy
    // rain's -24.2 after its correction). Don't normalize it.
    sound: require('../../assets/sounds/light-rain.m4a'),
  },
  'heavy-rain': {
    label: 'Heavy rain',
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: HeavyRainIcon,
    soundDescription: 'Steady, dense rain',
    vibrationDescription: 'Rapid, strong drumming',
    vibrationDetail: '20 heavy taps in 1.4 s',
    light: breathe('navy', { periodMs: 500, peak: 0.35, times: 8 }),
    lightDescription: 'Navy, quick pulses',
    contrastPair: { fg: 'white', bg: 'navy' },
    // Rapid and strong.
    haptic: tapsEvery('heavy', 70, 0, 1400),
    sound: require('../../assets/sounds/heavy-rain.m4a'),
    // Meant to sit between clear and thunderstorm, but the file measures
    // -21.1 LUFS (same as thunderstorm), so this brings it to about -24.2.
    soundVolume: 0.7,
  },
  'thunderstorm': {
    label: 'Thunderstorm',
    color: { light: palette.ink, dark: darkPalette.yellow },
    icon: ThunderstormIcon,
    soundDescription: 'Deep, rolling thunder',
    vibrationDescription: 'Rumble, then two sharp cracks',
    vibrationDetail: '13 quick heavy taps, 2 sharp',
    // A white flash, then the screen goes dark.
    light: [
      { color: 'white', opacity: 0.85, ms: 60 },
      { color: 'white', opacity: 0, ms: 240 },
      { color: 'ink', opacity: 0.7, ms: 200 },
      hold('ink', 0.7, 1200),
      { color: 'ink', opacity: 0, ms: 900 },
    ],
    lightDescription: 'White flash, then dark',
    contrastPair: { fg: 'white', bg: 'ink' },
    // A rumble, then two sharp cracks.
    haptic: [...tapsEvery('heavy', 40, 0, 500), ...taps('rigid', [1200, 2000])],
    // Intentionally louder to feel intense (-21.2 LUFS vs clear's -27.3).
    // Don't normalize it down.
    sound: require('../../assets/sounds/thunderstorm.m4a'),
  },
  'snow': {
    label: 'Snow',
    color: { light: palette.deepBlue, dark: darkPalette.iceBlue },
    icon: SnowIcon,
    soundDescription: 'Hushed, soft texture',
    vibrationDescription: 'Slow ripples in threes',
    vibrationDetail: '2 groups of 3 soft taps',
    light: breathe('iceBlue', { periodMs: 3000, peak: 0.4 }),
    lightDescription: 'Ice blue, soft glow',
    contrastPair: { fg: 'navy', bg: 'white' },
    // A slow ripple in groups of three.
    haptic: taps('soft', [0, 250, 500, 1100, 1350, 1600]),
    // Intentionally a bit softer to feel hushed (-28.3 LUFS vs clear's
    // -27.3). Don't normalize it up.
    sound: require('../../assets/sounds/snow.m4a'),
  },
  'sleet': {
    label: 'Sleet',
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: SleetIcon,
    soundDescription: 'Hissing, icy rain',
    vibrationDescription: 'Irregular, sharp taps',
    vibrationDetail: '7 sharp taps',
    // Uneven pulses, the fastest 2.5 per second.
    light: [
      ...breathe('periwinkle', { periodMs: 400, peak: 0.3, times: 1 }),
      ...breathe('periwinkle', { periodMs: 700, peak: 0.3, times: 1 }),
      ...breathe('periwinkle', { periodMs: 500, peak: 0.3, times: 1 }),
      ...breathe('periwinkle', { periodMs: 900, peak: 0.3, times: 1 }),
    ],
    lightDescription: 'Periwinkle, uneven flicker',
    contrastPair: { fg: 'ink', bg: 'iceBlue' },
    // Irregular and sharp.
    haptic: taps('rigid', [0, 90, 340, 400, 720, 1010, 1080]),
    sound: require('../../assets/sounds/sleet.m4a'),
    // sleet.m4a measures -21.0 LUFS vs clear.m4a at -27.3 (6.3 LU louder).
    // 0.48 = -6.3 dB. Remove once the file is re-exported to match.
    soundVolume: 0.48,
  },
  'fog': {
    label: 'Fog',
    color: { light: palette.gray, dark: darkPalette.gray },
    icon: FogIcon,
    soundDescription: 'Low, airy drone',
    vibrationDescription: 'Slowing, soft taps',
    vibrationDetail: '4 soft taps, further apart',
    light: breathe('white', { periodMs: 6000, peak: 0.5, times: 1 }),
    lightDescription: 'White haze, slow fade',
    contrastPair: { fg: 'ink', bg: 'mist' },
    // A slowing wave.
    haptic: taps('soft', [0, 800, 1700, 2700]),
    // A low, airy drone, meant to sit soft. Measures -27.3 LUFS (same as
    // clear), so no correction. Don't normalize it up.
    sound: require('../../assets/sounds/fog.m4a'),
  },
  'wind': {
    label: 'Windy',
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: WindIcon,
    soundDescription: 'Low, gusty wind',
    vibrationDescription: 'Swells and fades',
    vibrationDetail: '8 taps, light to heavy and back',
    light: [
      { color: 'periwinkle', opacity: 0.2, ms: 600 },
      { color: 'periwinkle', opacity: 0.45, ms: 600 },
      { color: 'periwinkle', opacity: 0.1, ms: 500 },
      { color: 'periwinkle', opacity: 0.4, ms: 700 },
      { color: 'periwinkle', opacity: 0, ms: 900 },
    ],
    lightDescription: 'Periwinkle, swells and fades',
    contrastPair: { fg: 'navy', bg: 'mist' },
    // Swells and fades.
    haptic: [
      ...taps('light', [0, 100, 600, 700]),
      ...taps('medium', [200, 300, 500]),
      ...taps('heavy', [400]),
    ],
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
    icon: ExtremeHeatIcon,
    soundDescription: 'Sound coming soon',
    vibrationDescription: 'Steady, warm buzz',
    vibrationDetail: '1.5 s of soft taps',
    light: breathe('amber', { periodMs: 3000, peak: 0.6 }),
    lightDescription: 'Deep amber, warm glow',
    contrastPair: { fg: 'ink', bg: 'amber' },
    // Steady and warm.
    haptic: tapsEvery('soft', 50, 0, 1500),
    // TODO: awaiting sound from teammate.
    sound: null,
  },
  'extreme-cold': {
    label: 'Extreme cold',
    // TODO: awaiting final color from design team.
    color: { light: palette.periwinkle, dark: darkPalette.periwinkle },
    icon: ExtremeColdIcon,
    soundDescription: 'Sharp ice cracks, once a second',
    vibrationDescription: 'Shivering triplets',
    vibrationDetail: '3 quick triplets, 1 s apart',
    // In time with the ice cracks.
    light: breathe('iceBlue', { periodMs: 1000, peak: 0.35, times: 4 }),
    lightDescription: 'Ice blue, pulse each second',
    contrastPair: { fg: 'iceBlue', bg: 'navy' },
    // Shivering triplets, in time with the ice-crack sound.
    haptic: taps('light', [0, 60, 120, 1000, 1060, 1120, 2000, 2060, 2120]),
    // A sharp ice crack once per second, so the 4-second loop must stay
    // exactly 4.000 s. Measures -28.0 LUFS; don't normalize it.
    sound: require('../../assets/sounds/extreme-cold.m4a'),
  },
  'severe-alert': {
    label: 'Severe weather alert',
    // TODO: awaiting final color from design team.
    color: { light: palette.deepBlue, dark: darkPalette.periwinkle },
    icon: SevereAlertIcon,
    soundDescription: 'Repeating alert tone',
    vibrationDescription: 'Heavy triple pulses',
    vibrationDetail: '3 heavy triplets',
    // One amber flash per beep (each beep is about 2 s).
    light: [0, 1, 2].flatMap((): LightCue => [
      { color: 'amber', opacity: 0.8, ms: 150 },
      { color: 'amber', opacity: 0, ms: 600 },
      hold('amber', 0, 1290),
    ]),
    lightDescription: 'Amber flash with each beep',
    contrastPair: { fg: 'ink', bg: 'amber' },
    // Heavy triplets, played with each alert beep (src/services/alert-sound.ts)
    // even when Vibration is off.
    haptic: taps('heavy', [0, 100, 200, 500, 600, 700, 1000, 1100, 1200]),
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

// Development checks: every light cue is flash-safe, and every contrast
// pair passes WCAG AA for text.
if (__DEV__) {
  for (const [id, profile] of Object.entries(conditionProfiles)) {
    if (maxFlashesPerSecond(profile.light) > MAX_FLASHES_PER_SECOND) {
      console.error(`${id}: light cue flashes more than ${MAX_FLASHES_PER_SECOND} times per second`);
    }
    const { fg, bg } = profile.contrastPair;
    if (contrastRatio(cueColors[fg], cueColors[bg]) < 4.5) console.error(`${id}: contrast pair is under 4.5:1`);
  }
}
