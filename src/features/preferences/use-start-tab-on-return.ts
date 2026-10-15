import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { RESET_AFTER_BACKGROUND_MS } from './opening-time';
import { useOpeningPreferences } from './use-opening-preferences';

// When the app comes back after 5+ minutes in the background, opens the
// tab for the time of day, like a fresh launch. Shorter, and the user stays
// where they were. It never switches while the app is in use.
export function useStartTabOnReturn() {
  const { startTab } = useOpeningPreferences();
  // Read the latest preferences when the app returns, not the ones from
  // when the listener was added.
  const latestStartTab = useRef(startTab);
  useEffect(() => {
    latestStartTab.current = startTab;
  });

  useEffect(() => {
    let backgroundedAt: number | null = null;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt = Date.now();
      } else if (state === 'active' && backgroundedAt !== null) {
        const away = Date.now() - backgroundedAt;
        backgroundedAt = null;
        if (away >= RESET_AFTER_BACKGROUND_MS) {
          router.navigate(latestStartTab.current() === 'alarms' ? '/alarms' : '/weather');
        }
      }
    });
    return () => subscription.remove();
  }, []);
}
