// The only file in the app that contains hex codes. Components read colors
// through `useTheme()` by token name (e.g. `colors.textPrimary`).

// Team palette. Contrast rules (WCAG AA) for light backgrounds:
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

export type ThemeName = 'light' | 'highContrast';

export type ThemeColors = {
  background: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  heading: string;
  accent: string;
  buttonBackground: string;
  buttonText: string;
  border: string;
  shadow: string;
};

export type Theme = {
  name: ThemeName;
  colors: ThemeColors;
  statusBarStyle: 'dark' | 'light';
  cardBorderWidth: number;
  // When false, every condition illustration uses `colors.accent` instead of
  // its own color from condition-profiles.ts.
  useConditionColors: boolean;
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
    buttonBackground: palette.deepBlue,
    buttonText: palette.white,
    border: palette.gray,
    shadow: palette.ink,
  },
  statusBarStyle: 'dark',
  cardBorderWidth: 0,
  useConditionColors: true,
};

export const highContrastTheme: Theme = {
  name: 'highContrast',
  colors: {
    background: palette.ink,
    card: palette.ink,
    textPrimary: palette.white,
    textSecondary: palette.white,
    heading: palette.white,
    accent: palette.sun,
    buttonBackground: palette.sun,
    buttonText: palette.ink,
    border: palette.white,
    shadow: palette.ink,
  },
  statusBarStyle: 'light',
  cardBorderWidth: 2,
  // Some condition colors (e.g. thunderstorm = ink) would vanish on an ink
  // background, so high contrast uses sun for every illustration.
  useConditionColors: false,
};

// TODO: dark palette pending from design team.
// Add `darkTheme: Theme` here with a full `colors` set, then add 'dark' to
// ThemeName and `themes`, and offer it in src/app/settings.tsx.

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  highContrast: highContrastTheme,
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
    boxShadow: `0 4px 16px ${withAlpha(theme.colors.shadow, 0.08)}`,
  };
}
