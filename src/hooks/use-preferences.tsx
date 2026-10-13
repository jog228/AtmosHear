import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { loadPreferences, savePreferences, type Preferences } from '@/services/preferences';

type PreferencesContextValue = {
  preferences: Preferences;
  // Updates the given settings and saves them.
  updatePreferences: (changes: Partial<Preferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Loads the saved settings once. Renders nothing until they're loaded (the
// splash screen stays up), so nothing starts with the wrong setting.
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences | null>(null);

  useEffect(() => {
    loadPreferences().then(setPreferences);
  }, []);

  if (!preferences) return null;

  const updatePreferences = (changes: Partial<Preferences>) => {
    setPreferences((current) => (current ? { ...current, ...changes } : current));
    savePreferences(changes);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
