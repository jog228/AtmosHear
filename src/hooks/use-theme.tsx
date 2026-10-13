import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Appearance as RNAppearance, useColorScheme } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { darkTheme, highContrastTheme, lightTheme, type Theme } from '@/constants/theme';
import type { Appearance, Preferences } from '@/services/preferences';

import { usePreferences } from './use-preferences';

type ThemeContextValue = {
  theme: Theme;
  appearance: Appearance;
  setAppearance: (appearance: Appearance) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Picks the theme: high contrast overrides everything; otherwise the
// Appearance setting, where 'system' follows the phone's light/dark mode.
function resolveTheme(preferences: Preferences, systemScheme: string | null | undefined): Theme {
  if (preferences.highContrast) return highContrastTheme;
  const appearance = preferences.appearance === 'system' ? systemScheme : preferences.appearance;
  return appearance === 'dark' ? darkTheme : lightTheme;
}

// Must be inside PreferencesProvider, which holds the splash screen until
// the saved choices load, so nobody sees the wrong theme first.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preferences, updatePreferences } = usePreferences();
  const { appearance, highContrast } = preferences;
  // Updates live when the phone switches between light and dark mode.
  const systemScheme = useColorScheme();
  const theme = resolveTheme(preferences, systemScheme);

  // Make native pieces (switches, back button, keyboard) match the app's
  // choice. 'unspecified' hands control back to the phone's setting.
  useEffect(() => {
    RNAppearance.setColorScheme(highContrast ? 'dark' : appearance === 'system' ? 'unspecified' : appearance);
  }, [appearance, highContrast]);

  // Paint the root view behind the app, then reveal it, so there's no white
  // flash on launch in dark mode.
  const background = theme.colors.background;
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(background).finally(() => SplashScreen.hide());
  }, [background]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        appearance,
        setAppearance: (value) => updatePreferences({ appearance: value }),
        highContrast,
        setHighContrast: (value) => updatePreferences({ highContrast: value }),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeSettings(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}

export function useTheme(): Theme {
  return useThemeSettings().theme;
}

// A condition's accent color in the current theme.
export function useConditionColor(condition: ConditionId): string {
  const theme = useTheme();
  if (theme.conditionColors === 'accent') return theme.colors.accent;
  return conditionProfiles[condition].color[theme.conditionColors];
}
