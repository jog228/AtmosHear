import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  DEFAULT_OPENING_PREFERENCES,
  loadOpeningPreferences,
  saveOpeningPreferences,
  type OpeningPreferences,
} from './opening-storage';
import { getStartTab, todayAt, type StartTab } from './opening-time';

type OpeningPreferencesValue = OpeningPreferences & {
  update: (changes: Partial<OpeningPreferences>) => void;
  // The time the opening logic uses: the simulated time while it's allowed
  // and set, otherwise the real time.
  now: () => Date;
  // The tab to open to right now.
  startTab: () => StartTab;
};

const OpeningPreferencesContext = createContext<OpeningPreferencesValue | null>(null);

// Loads the opening-screen preferences once and shares them (the tab
// layout, the Preferences page, and the Developer "Simulate time" row).
// Renders nothing until loaded, so the first tab is chosen with the saved
// times. `allowSimulatedTime` is true while Developer mode is on.
export function OpeningPreferencesProvider({
  allowSimulatedTime,
  children,
}: {
  allowSimulatedTime: boolean;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<OpeningPreferences | null>(null);

  useEffect(() => {
    loadOpeningPreferences().then(setPreferences);
  }, []);

  if (!preferences) return null;

  const now = () =>
    allowSimulatedTime && preferences.simulatedTime ? todayAt(preferences.simulatedTime) : new Date();

  const value: OpeningPreferencesValue = {
    ...preferences,
    simulatedTime: allowSimulatedTime ? preferences.simulatedTime : null,
    update: (changes) =>
      setPreferences((current) => {
        const next = { ...(current ?? DEFAULT_OPENING_PREFERENCES), ...changes };
        saveOpeningPreferences(next);
        return next;
      }),
    now,
    startTab: () => getStartTab(now(), preferences.morning, preferences.evening),
  };

  return <OpeningPreferencesContext.Provider value={value}>{children}</OpeningPreferencesContext.Provider>;
}

export function useOpeningPreferences(): OpeningPreferencesValue {
  const value = useContext(OpeningPreferencesContext);
  if (!value) throw new Error('useOpeningPreferences must be used inside OpeningPreferencesProvider');
  return value;
}
