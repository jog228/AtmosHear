import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance as RNAppearance, useColorScheme } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { darkTheme, highContrastTheme, lightTheme, type Theme } from '@/constants/theme';
import {
  loadPreferences,
  saveAppearance,
  saveHighContrast,
  type Appearance,
  type Preferences,
} from '@/services/preferences';

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  // Updates live when the phone switches between light and dark mode.
  const systemScheme = useColorScheme();
  const theme = preferences ? resolveTheme(preferences, systemScheme) : null;

  useEffect(() => {
    loadPreferences().then(setPreferences);
  }, []);

  // Make native pieces (switches, back button, keyboard) match the app's
  // choice. 'unspecified' hands control back to the phone's setting.
  useEffect(() => {
    if (!preferences) return;
    const override = preferences.highContrast
      ? 'dark'
      : preferences.appearance === 'system'
        ? 'unspecified'
        : preferences.appearance;
    RNAppearance.setColorScheme(override);
  }, [preferences]);

  // Paint the root view behind the app, then reveal it, so there's no white
  // flash on launch in dark mode.
  const background = theme?.colors.background;
  useEffect(() => {
    if (!background) return;
    SystemUI.setBackgroundColorAsync(background).finally(() => SplashScreen.hide());
  }, [background]);

  // The splash screen stays up until the saved choices load, so nobody sees
  // the wrong theme first.
  if (!preferences || !theme) return null;

  const update = (changes: Partial<Preferences>) => setPreferences({ ...preferences, ...changes });

  return (
    <ThemeContext.Provider
      value={{
        theme,
        appearance: preferences.appearance,
        setAppearance: (appearance) => {
          update({ appearance });
          saveAppearance(appearance);
        },
        highContrast: preferences.highContrast,
        setHighContrast: (highContrast) => {
          update({ highContrast });
          saveHighContrast(highContrast);
        },
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
