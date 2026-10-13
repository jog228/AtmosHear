import type { ConditionId } from './conditions';

// The only file in the app that contains hex codes. Components read colors
// through `useTheme()` by token name (e.g. `colors.textPrimary`).

// Light palette. Contrast rules (WCAG AA) for light backgrounds:
// - Small text may only use ink, deepBlue, or slate.
// - periwinkle is for text 24px+ (or 19px+ bold), icons, and fills only.
// - gray and sun are never text.
// - Text on deepBlue or ink buttons is white.
export const palette = {
  ink: '#090D27',
  deepBlue: '#1F2D80',
  periwinkle: '#6277D6',
  slate: '#484A57',
  gray: '#92939B',
  sun: '#FFBF4A',
  white: '#FFFFFF',
  mist: '#E8EDF2', // pale blue-gray page background
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
};

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
  border: string;
  // Includes its own transparency.
  shadow: string;
  switchTrackOn: string;
  switchTrackOff: string;
  switchThumb: string;
};

// Frosted glass cards over soft condition-colored blobs.
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

export type Theme = {
  name: ThemeName;
  colors: ThemeColors;
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
    border: palette.gray,
    shadow: withAlpha(palette.ink, 0.08),
    switchTrackOn: palette.deepBlue,
    switchTrackOff: palette.gray,
    switchThumb: palette.white,
  },
  statusBarStyle: 'dark',
  cardBorderWidth: 0,
  glass: {
    tint: palette.white,
    tintOpacity: 0.5,
    tintOpacityByCondition: {
      // Ink blob: slate text is 4.45:1 at 0.5, 4.8:1 at 0.55.
      'thunderstorm': 0.55,
    },
    border: withAlpha(palette.white, 0.4),
    borderTop: withAlpha(palette.white, 0.8),
    blurTint: 'systemThinMaterialLight',
    blurIntensity: 55,
    blobOpacity: 0.55,
  },
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
    border: withAlpha(darkPalette.royalBlue, 0.6),
    // Shadows barely show on navy, so dark cards also get a 1px border.
    shadow: withAlpha(darkPalette.black, 0.35),
    switchTrackOn: darkPalette.periwinkle,
    switchTrackOff: withAlpha(darkPalette.gray, 0.4),
    switchThumb: darkPalette.white,
  },
  statusBarStyle: 'light',
  cardBorderWidth: 1,
  glass: {
    // The page navy (darker than navyCard) keeps light text readable over
    // bright yellow and ice-blue blobs.
    tint: darkPalette.navy,
    tintOpacity: 0.5,
    tintOpacityByCondition: {
      // Yellow blobs: gray text is 4.58:1 at 0.5 (passes, barely), 5.0:1
      // at 0.55. Raised for margin.
      'clear': 0.55,
      'partly-cloudy': 0.55,
      'thunderstorm': 0.55,
      'extreme-heat': 0.55,
      // Ice-blue blob: gray text is 4.19:1 at 0.5 (fails), 5.0:1 at 0.6.
      'snow': 0.6,
    },
    border: withAlpha(darkPalette.white, 0.25),
    borderTop: withAlpha(darkPalette.white, 0.45),
    blurTint: 'systemThinMaterialDark',
    blurIntensity: 55,
    blobOpacity: 0.55,
  },
  conditionColors: 'dark',
};

// Overrides both light and dark when turned on in Settings.
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
    border: palette.white,
    shadow: withAlpha(palette.ink, 0),
    switchTrackOn: palette.sun,
    switchTrackOff: palette.white,
    switchThumb: palette.ink,
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

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { md: 16, lg: 24, pill: 999 };

export function cardShadow(theme: Theme) {
  return {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: theme.cardBorderWidth,
    boxShadow: `0 4px 16px ${theme.colors.shadow}`,
  };
}
