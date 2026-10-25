import type { TextStyle } from 'react-native';

import type { ConditionId } from './conditions';

// The only file in the app that contains hex codes. Components read colors
// through `useTheme()` by token name (e.g. `colors.textPrimary`).

// Light palette. Contrast rules (WCAG AA) for light backgrounds, checked on
// both mist and white:
// - Small text may only use ink (17.4:1 on mist, 19.1:1 on white), deepBlue
//   (10.9:1, 12.0:1), or slate (8.0:1, 8.8:1).
// - periwinkle (3.7:1, 4.1:1) is for text 24px+ (or 19px+ bold), icons, and
//   fills only.
// - gray (2.8:1, 3.1:1) and sun (1.5:1, 1.6:1) are never text.
// - Text on deepBlue (12.0:1) or ink (19.1:1) buttons is white. On sun,
//   deepBlue (7.3:1) or ink (11.7:1).
export const palette = {
  ink: '#090D27',
  deepBlue: '#1F2D80',
  periwinkle: '#6277D6',
  slate: '#484A57',
  gray: '#92939B',
  sun: '#FFBF4A',
  // The clock-face sun in the illustrations, from design/frames/.
  // Decorative only, never text.
  sunPale: '#F9D898',
  white: '#FFFFFF',
  mist: '#EDF5FD', // pale blue page background, from design/frames/
  // TODO: awaiting final red from design team. Delete actions only: 6.5:1
  // with white text on it, 5.9:1 as text on mist.
  red: '#B3261E',
};

// Dark palette. Contrast rules (WCAG AA) on the navy background:
// - royalBlue (2.6:1) is never text or thin icons: fill only, white text on top.
// - black is only for shadows.
// - Every other color passes as text on navy and on navyCard.
export const darkPalette = {
  navy: '#091141', // page background
  // TODO: derived card color, confirm with design team.
  // navy mixed with 22% royalBlue: a slightly lighter navy.
  navyCard: '#121E61',
  yellow: '#FCDE62',
  iceBlue: '#E3EEFA',
  periwinkle: '#A1B2FC',
  royalBlue: '#334BD3',
  black: '#000000',
  gray: '#B8BAC2',
  white: '#FFFFFF',
  // TODO: awaiting final red from design team. Delete actions only, also
  // in high contrast: 7.1:1 as text on navy, 7.6:1 with ink text on it.
  red: '#FF7B72',
};

// Bedside mode (design/frames/9 · Centered dome@2x.png and the "Bedside in
// each app theme" mockups). Which palette shows is decided in
// src/features/alarms/bedside-palette.ts: high contrast, else dark, else
// light in the daytime and dark at night. All three have the same keys.
export type BedsidePalette = {
  background: string;
  mainText: string;
  brightText: string;
  mutedText: string;
  // Switched-off alarms.
  offText: string;
  // Off alarms' times are also struck through (high contrast).
  strikeOff: boolean;
  // Text that's amber in the dark ("Next · Weekdays", the sunrise label).
  warmText: string;
  warmWeight: '400' | '700';
  domePast: string;
  // Passed dots' size, relative to the others.
  pastDotScale: number;
  domeAhead: string;
  // The dome's warm end dots (decoration, never text).
  amber: string;
  divider: string;
  dividerWidth: number;
  // The ringing screen's Stop button (and Snooze's border) over bedside.
  accent: string;
  onAccent: string;
  // Now on the dome: the sun's outline and halo opacities (inner, outer),
  // and the moon's color.
  sunOutline: { color: string; width: number } | null;
  sunHalo: [number, number] | null;
  moon: string;
  flip: { background: string; border: string; borderWidth: number; icon: string };
  // The weather column's condition icon.
  conditionIcon: string;
};

// Dark: dim, for night and the dark theme. Contrast on the background
// (#091141): brightText 15.3:1, warmText (amber) 11.0:1, mainText 9.3:1,
// mutedText 5.9:1, offText 4.9:1, so every text color passes AA; navy on
// the amber Stop button 11.0:1. domePast (2.0:1) and divider (1.4:1) are
// decoration only, never text; the dome's meaning is also in text
// ("7 hr 39 min until sunrise").
export const bedsidePalette: BedsidePalette = {
  background: darkPalette.navy,
  mainText: darkPalette.gray,
  brightText: darkPalette.iceBlue,
  mutedText: '#8C92B0',
  offText: '#7E84A6',
  strikeOff: false,
  warmText: palette.sun,
  warmWeight: '400',
  domePast: '#3A4580',
  pastDotScale: 1,
  domeAhead: darkPalette.periwinkle,
  amber: palette.sun,
  divider: '#1E2A6B',
  dividerWidth: 1,
  accent: palette.sun,
  onAccent: darkPalette.navy,
  sunOutline: null,
  sunHalo: [0.22, 0.12],
  moon: darkPalette.iceBlue,
  flip: { background: 'transparent', border: '#3A4580', borderWidth: 1.5, icon: darkPalette.gray },
  conditionIcon: darkPalette.periwinkle,
};

// Light: Auto in the daytime, or Light chosen (day and night). Contrast on
// mist: mainText and brightText (ink) 17.4:1, warmText (deepBlue, bold)
// 10.9:1, mutedText and offText (slate) 8.0:1 ("Off" carries the meaning);
// white on the deepBlue Stop button 12.0:1. Amber (1.5:1) is never text
// here: only the end dots and the sun, which gets a deepBlue outline.
// domePast (1.6:1), domeAhead (3.7:1), and divider (1.4:1) are decoration.
export const bedsideLightPalette: BedsidePalette = {
  background: palette.mist,
  mainText: palette.ink,
  brightText: palette.ink,
  mutedText: palette.slate,
  offText: palette.slate,
  strikeOff: false,
  warmText: palette.deepBlue,
  warmWeight: '700',
  domePast: '#BFC4CC',
  pastDotScale: 1,
  domeAhead: palette.periwinkle,
  amber: palette.sun,
  divider: '#CDD4DF',
  dividerWidth: 1,
  accent: palette.deepBlue,
  onAccent: palette.white,
  sunOutline: { color: palette.deepBlue, width: 2 },
  sunHalo: [0.32, 0.18],
  // When Light is chosen for the night too.
  moon: palette.deepBlue,
  flip: { background: palette.white, border: '#CDD4DF', borderWidth: 1.5, icon: palette.deepBlue },
  conditionIcon: palette.deepBlue,
};

// High contrast: solid colors, thick lines. Contrast on ink: every text
// color white 19.1:1, warmText (sun) 11.7:1; ink on the sun Stop button
// 11.7:1. Off alarms are white too, with the time struck through.
export const bedsideHighContrastPalette: BedsidePalette = {
  background: palette.ink,
  mainText: palette.white,
  brightText: palette.white,
  mutedText: palette.white,
  offText: palette.white,
  strikeOff: true,
  warmText: palette.sun,
  warmWeight: '400',
  domePast: palette.white,
  pastDotScale: 0.6,
  domeAhead: palette.sun,
  amber: palette.sun,
  divider: palette.white,
  dividerWidth: 2,
  accent: palette.sun,
  onAccent: palette.ink,
  sunOutline: { color: palette.white, width: 2.5 },
  sunHalo: null,
  moon: palette.white,
  flip: { background: 'transparent', border: palette.white, borderWidth: 2, icon: palette.white },
  conditionIcon: palette.sun,
};

// Named colors for the cue screens: light cue colors and each condition's
// contrast pair (src/constants/condition-profiles.ts). The same in every
// theme, since they describe the cue itself.
export const cueColors = {
  amber: palette.sun,
  navy: palette.deepBlue,
  ink: palette.ink,
  white: palette.white,
  slate: palette.slate,
  periwinkle: palette.periwinkle,
  mist: palette.mist,
  iceBlue: darkPalette.iceBlue,
  yellow: darkPalette.yellow,
  midnight: darkPalette.navy,
};

export type CueColor = keyof typeof cueColors;

export type ThemeName = 'light' | 'dark' | 'highContrast';

export type ThemeColors = {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  heading: string;
  // Accents, icons, links.
  accent: string;
  // The big temperature.
  largeNumber: string;
  buttonBackground: string;
  buttonText: string;
  secondaryButtonBackground: string;
  secondaryButtonText: string;
  // The "playing" state (e.g. the amber pause button in the Sound
  // library), and its icon or text.
  highlight: string;
  onHighlight: string;
  border: string;
  // Includes its own transparency.
  shadow: string;
  // The Preferences toggle, after design/frames/12_Preferences.png: a
  // filled track when on, an outlined one when off. Each thumb passes 3:1
  // against its track (gray on white: 3.1:1).
  switchTrackOn: string;
  switchThumbOn: string;
  switchTrackOff: string;
  switchBorderOff: string;
  switchThumbOff: string;
  // The sun card's daylight bar: the dots still to come. The dots already
  // passed are `accent`, and the two pass 3:1 (checked in
  // src/components/daylight-bar.tsx).
  progressTrack: string;
};

// Frosted glass cards over soft condition-colored blobs. Unused for now:
// every theme has solid cards (glass: null), per design/frames/. Kept so it
// can come back without a rewrite.
//
// Readability: card text must stay WCAG AA (4.5:1) over the worst case
// behind it, which is a blob's center at full `blobOpacity` (blobs are
// spaced so their centers never overlap). The base `tintOpacity` passes for
// most conditions; `tintOpacityByCondition` raises it where it doesn't.
// Re-check these if you change blobOpacity, a tint, or a condition color.
export type Glass = {
  // Card color laid over the blur.
  tint: string;
  // 0-1. Lower = more background shows through.
  tintOpacity: number;
  tintOpacityByCondition: Partial<Record<ConditionId, number>>;
  // 1px edge; the top edge is brighter, like light catching glass.
  border: string;
  borderTop: string;
  // iOS material that expo-blur adds on top of the blur.
  blurTint: 'systemThinMaterialLight' | 'systemThinMaterialDark' | 'light' | 'dark' | 'default';
  // expo-blur intensity, 1-100.
  blurIntensity: number;
  // Peak opacity of the condition-colored blobs behind the cards.
  blobOpacity: number;
};

// The dotted brand illustrations (src/components/brand/: the clock-face
// sun, the halftone field, the dot rings) and the sun card's "now" dot.
// Decorative: the same information is always in text.
export type IllustrationColors = {
  // Halftone and ring dots.
  dots: string;
  // The sun's edge, and the "now" dot on the sun card's daylight bar.
  sun: string;
  // The clock face inside the sun.
  sunFace: string;
  // The clock hands and tick marks.
  hands: string;
  // Severe alert, after design/frames/11_Weather_warning.png: alternating
  // dark and light rings on an amber disc, the same in every theme. For the
  // weather warning screen (not built yet).
  alertDisc: string;
  alertDark: string;
  alertLight: string;
};

export type Theme = {
  name: ThemeName;
  colors: ThemeColors;
  illustration: IllustrationColors;
  statusBarStyle: 'dark' | 'light';
  cardBorderWidth: number;
  // Null means solid cards and no blobs (also used when iOS Reduce
  // Transparency is on).
  glass: Glass | null;
  // Which of each condition's colors (in condition-profiles.ts) to use, or
  // 'accent' to use `colors.accent` for every condition.
  conditionColors: 'light' | 'dark' | 'accent';
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: palette.mist,
    card: palette.white,
    textPrimary: palette.ink,
    textSecondary: palette.slate,
    heading: palette.deepBlue,
    accent: palette.deepBlue,
    largeNumber: palette.ink,
    buttonBackground: palette.deepBlue,
    buttonText: palette.white,
    secondaryButtonBackground: palette.ink,
    secondaryButtonText: palette.white,
    // 11.7:1.
    highlight: palette.sun,
    onHighlight: palette.ink,
    border: palette.gray,
    shadow: withAlpha(palette.ink, 0.08),
    switchTrackOn: palette.deepBlue,
    switchThumbOn: palette.sun,
    switchTrackOff: palette.white,
    switchBorderOff: palette.gray,
    switchThumbOff: palette.gray,
    // 3.9:1 with deepBlue; 3.0:1 on the white card.
    progressTrack: palette.gray,
  },
  illustration: {
    dots: palette.periwinkle,
    sun: palette.sun,
    sunFace: palette.sunPale,
    hands: palette.deepBlue,
    alertDisc: palette.sun,
    alertDark: palette.ink,
    alertLight: palette.white,
  },
  statusBarStyle: 'dark',
  cardBorderWidth: 0,
  // Flat white cards and no blobs, like the frames in design/frames/.
  glass: null,
  conditionColors: 'light',
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: darkPalette.navy,
    card: darkPalette.navyCard,
    textPrimary: darkPalette.white,
    textSecondary: darkPalette.gray,
    heading: darkPalette.iceBlue,
    accent: darkPalette.periwinkle,
    largeNumber: darkPalette.periwinkle,
    buttonBackground: darkPalette.yellow,
    buttonText: darkPalette.navy,
    secondaryButtonBackground: darkPalette.royalBlue,
    secondaryButtonText: darkPalette.white,
    // Buttons are already yellow in dark mode, so playing is ice blue
    // (15.3:1 with navy).
    highlight: darkPalette.iceBlue,
    onHighlight: darkPalette.navy,
    border: withAlpha(darkPalette.royalBlue, 0.6),
    // Shadows barely show on navy, so dark cards also get a 1px border.
    shadow: withAlpha(darkPalette.black, 0.35),
    // Yellow with a navy thumb, like dark mode's buttons.
    switchTrackOn: darkPalette.yellow,
    switchThumbOn: darkPalette.navy,
    switchTrackOff: darkPalette.navy,
    switchBorderOff: darkPalette.gray,
    switchThumbOff: darkPalette.gray,
    // A fill, never text. 3.3:1 with periwinkle.
    progressTrack: darkPalette.royalBlue,
  },
  // A navy cloud would vanish on navy, so clouds are ice blue.
  illustration: {
    dots: darkPalette.periwinkle,
    sun: darkPalette.yellow,
    sunFace: darkPalette.yellow,
    hands: darkPalette.navy,
    alertDisc: palette.sun,
    alertDark: palette.ink,
    alertLight: palette.white,
  },
  statusBarStyle: 'light',
  cardBorderWidth: 1,
  // Solid navyCard cards, like light mode's flat white ones.
  glass: null,
  conditionColors: 'dark',
};

// Overrides both light and dark when turned on in Preferences.
export const highContrastTheme: Theme = {
  name: 'highContrast',
  colors: {
    background: palette.ink,
    card: palette.ink,
    textPrimary: palette.white,
    textSecondary: palette.white,
    heading: palette.white,
    accent: palette.sun,
    largeNumber: palette.white,
    buttonBackground: palette.sun,
    buttonText: palette.ink,
    secondaryButtonBackground: palette.white,
    secondaryButtonText: palette.ink,
    // Buttons are sun in high contrast, so playing is white (19.1:1).
    highlight: palette.white,
    onHighlight: palette.ink,
    border: palette.white,
    shadow: withAlpha(palette.ink, 0),
    switchTrackOn: palette.sun,
    switchThumbOn: palette.ink,
    switchTrackOff: palette.ink,
    switchBorderOff: palette.white,
    switchThumbOff: palette.white,
    // 5.3:1 with sun. (White would be only 1.6:1 with sun.)
    progressTrack: palette.slate,
  },
  illustration: {
    dots: palette.white,
    sun: palette.sun,
    sunFace: palette.sun,
    hands: palette.ink,
    alertDisc: palette.sun,
    alertDark: palette.ink,
    alertLight: palette.white,
  },
  statusBarStyle: 'light',
  cardBorderWidth: 2,
  // Solid cards and no blobs: nothing should reduce contrast.
  glass: null,
  // Some condition colors (e.g. thunderstorm = ink) would vanish on an ink
  // background, so high contrast uses sun for every condition accent.
  conditionColors: 'accent',
};

// Adds transparency to a 6-digit hex token, e.g. withAlpha(colors.accent, 0.1).
export function withAlpha(hex: string, alpha: number): string {
  const byte = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${byte}`;
}

// The font family for all text. Undefined means the system font (San
// Francisco on iOS, Roboto on Android). To use the design font: load it with
// expo-font, then put its name here.
export const FONT_FAMILY: string | undefined = undefined;

// Text styles from the frames in design/frames/: big, bold, left-aligned
// headlines. Spread one into a style, then add a color:
// `{ ...typography.title, color: theme.colors.textPrimary }`.
//
// These are the sizes at the default text size. The phone's text size
// setting (Dynamic Type) scales them, line heights too. Display and h1 are
// already huge, so cap their growth with
// `maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}`.
export const typography = {
  // The big temperature and condition names. Tight line height: these are
  // short, usually a single line.
  display: { fontFamily: FONT_FAMILY, fontSize: 88, lineHeight: 88, fontWeight: '700', letterSpacing: -2 },
  // Screen titles.
  h1: { fontFamily: FONT_FAMILY, fontSize: 56, lineHeight: 60, fontWeight: '700', letterSpacing: -1 },
  // Section headlines and the greeting.
  h2: { fontFamily: FONT_FAMILY, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  // Row titles, card values, and card headings.
  title: { fontFamily: FONT_FAMILY, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  body: { fontFamily: FONT_FAMILY, fontSize: 17, lineHeight: 24, fontWeight: '400' },
  // Labels and notes.
  caption: { fontFamily: FONT_FAMILY, fontSize: 14, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export const LARGE_TEXT_MAX_SCALE = 1.3;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

// `button` is the rounded square buttons on the Weather screen.
export const radius = { md: 16, button: 20, lg: 24, pill: 999 };

export function cardShadow(theme: Theme) {
  return {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: theme.cardBorderWidth,
    boxShadow: `0 4px 16px ${theme.colors.shadow}`,
  };
}
