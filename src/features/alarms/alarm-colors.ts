import {
  bedsideHighContrastPalette,
  bedsideLightPalette,
  bedsidePalette,
  darkPalette,
  palette,
  withAlpha,
  type BedsidePalette,
  type ThemeName,
} from '@/constants/theme';
import { useColorScheme } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { pickBedsidePalette, type BedsidePaletteName } from './bedside-palette';
import { useBedsideSlots } from './bedside-slots';

// The Alarms tab's colors, built only from the app's base palette (no
// weather condition colors). Picked by the current theme name, so light,
// dark, and high contrast all work. Every text color passes WCAG AA
// (4.5:1) on its background, including dimmed (switched-off) alarms.
export type AlarmColors = {
  background: string;
  card: string;
  cardBorderWidth: number;
  separator: string;
  // Big times and labels.
  text: string;
  secondaryText: string;
  // Switched-off alarms: dimmer, but still 4.5:1 or better.
  dimmedText: string;
  // Text buttons (Edit, Done, +, Cancel, Save) and switched-on switches.
  accent: string;
  // Text and icons on an accent fill (the Stop button, play buttons).
  onAccent: string;
  // The drawn toggle (design/frames/14): a filled track with an amber
  // thumb when on, an outlined track with a gray thumb when off.
  switchTrackOn: string;
  switchThumbOn: string;
  switchTrackOff: string;
  switchBorderOff: string;
  switchThumbOff: string;
  // Unselected day circles' outline (selected ones are accent/onAccent).
  chipBorder: string;
  // The dot on the "Alarm set" toast (the toast is accent/onAccent).
  toastDot: string;
  // The dot rings around the clock-face sun: the inner (warm) and outer
  // (cool) rings. Decoration only.
  ringsWarm: string;
  ringsCool: string;
  // The delete confirmation: its sheet, the dimmed screen behind, the
  // strong "Delete alarm" button, and the quiet "Keep alarm" one.
  sheet: string;
  scrim: string;
  strongButton: string;
  onStrongButton: string;
  quietButton: string;
  // Delete actions: the fill, and text or icons on top of it.
  danger: string;
  onDanger: string;
  // A gentle notice (e.g. duplicate alarm).
  notice: string;
};

const COLORS: Record<ThemeName, AlarmColors> = {
  light: {
    background: palette.mist,
    card: palette.white,
    cardBorderWidth: 0,
    separator: palette.line,
    text: palette.ink,
    secondaryText: palette.slate,
    // 8.8:1 on white. gray would look more like Apple's but fails AA.
    dimmedText: palette.slate,
    accent: palette.deepBlue,
    // 12:1.
    onAccent: palette.white,
    switchTrackOn: palette.deepBlue,
    switchThumbOn: palette.sun,
    switchTrackOff: palette.white,
    // 3:1 on mist and white, enough for a control's outline.
    switchBorderOff: palette.gray,
    switchThumbOff: palette.gray,
    chipBorder: palette.gray,
    toastDot: palette.sun,
    ringsWarm: palette.sun,
    ringsCool: palette.periwinkle,
    sheet: palette.white,
    scrim: withAlpha(palette.ink, 0.45),
    // 19:1.
    strongButton: palette.ink,
    onStrongButton: palette.white,
    quietButton: palette.mist,
    danger: palette.red,
    onDanger: palette.white,
    notice: palette.slate,
  },
  dark: {
    background: darkPalette.navy,
    card: darkPalette.navyCard,
    cardBorderWidth: 0,
    separator: withAlpha(darkPalette.gray, 0.3),
    text: darkPalette.white,
    secondaryText: darkPalette.gray,
    // 7.8:1 on navyCard.
    dimmedText: darkPalette.gray,
    accent: darkPalette.yellow,
    // 13.5:1.
    onAccent: darkPalette.navy,
    // Navy on the yellow track.
    switchTrackOn: darkPalette.yellow,
    switchThumbOn: darkPalette.navy,
    switchTrackOff: darkPalette.navyCard,
    switchBorderOff: darkPalette.gray,
    switchThumbOff: darkPalette.gray,
    chipBorder: darkPalette.gray,
    // Amber would vanish on the yellow toast.
    toastDot: darkPalette.navy,
    ringsWarm: darkPalette.yellow,
    ringsCool: darkPalette.periwinkle,
    sheet: darkPalette.navyCard,
    scrim: withAlpha(darkPalette.black, 0.55),
    // 17:1.
    strongButton: darkPalette.white,
    onStrongButton: darkPalette.navy,
    quietButton: darkPalette.navy,
    danger: darkPalette.red,
    onDanger: darkPalette.navy,
    notice: darkPalette.gray,
  },
  // Solid colors and thick borders.
  highContrast: {
    background: palette.ink,
    card: palette.ink,
    cardBorderWidth: 2,
    separator: palette.white,
    text: palette.white,
    secondaryText: palette.white,
    // 6.3:1 on ink.
    dimmedText: palette.gray,
    accent: palette.sun,
    // 11.7:1.
    onAccent: palette.ink,
    switchTrackOn: palette.sun,
    switchThumbOn: palette.ink,
    switchTrackOff: palette.ink,
    switchBorderOff: palette.white,
    switchThumbOff: palette.white,
    chipBorder: palette.white,
    toastDot: palette.ink,
    ringsWarm: palette.sun,
    ringsCool: palette.white,
    sheet: palette.ink,
    scrim: withAlpha(palette.ink, 0.7),
    strongButton: palette.white,
    onStrongButton: palette.ink,
    quietButton: palette.ink,
    danger: darkPalette.red,
    onDanger: palette.ink,
    notice: palette.white,
  },
};

export function useAlarmColors(): AlarmColors {
  return COLORS[useTheme().name];
}

// Bedside mode's colors (and the ringing screen's over it): light, dark, or
// high contrast, picked by bedside-palette.ts from the Bedside mode setting
// (through the slots), the app-wide High contrast switch, whether it's
// daytime (Auto), and the phone's light or dark mode (System). Contrast
// notes are with the palettes in src/constants/theme.ts.
export type BedsideColors = BedsidePalette;

export const BEDSIDE_PALETTES: Record<BedsidePaletteName, BedsideColors> = {
  light: bedsideLightPalette,
  dark: bedsidePalette,
  highContrast: bedsideHighContrastPalette,
};

export function useBedsideColors(isDaytime: boolean): { name: BedsidePaletteName; colors: BedsideColors } {
  const appHighContrast = useTheme().name === 'highContrast';
  const { appearance } = useBedsideSlots();
  // Live: changes when the phone switches modes. While the app's own
  // Appearance is Light or Dark, use-theme.tsx overrides the color scheme
  // so native controls match, and this reports that choice instead.
  const systemDark = useColorScheme() === 'dark';
  const name = pickBedsidePalette({ setting: appearance, appHighContrast, isDaytime, systemDark });
  return { name, colors: BEDSIDE_PALETTES[name] };
}
