import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { highContrastTheme, lightTheme, type Theme } from '@/constants/theme';
import { loadHighContrast, saveHighContrast } from '@/services/preferences';

type ThemeContextValue = {
  theme: Theme;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrastState] = useState<boolean | null>(null);

  useEffect(() => {
    loadHighContrast().then(setHighContrastState);
  }, []);

  // Render nothing until the saved choice loads, so a high-contrast user
  // never sees a flash of the light theme.
  if (highContrast === null) return null;

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    saveHighContrast(enabled);
  };

  return (
    <ThemeContext.Provider
      value={{ theme: highContrast ? highContrastTheme : lightTheme, highContrast, setHighContrast }}
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
  return theme.useConditionColors ? conditionProfiles[condition].color : theme.colors.accent;
}
