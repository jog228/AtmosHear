import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import type { ConditionId } from '@/constants/conditions';
import { AMBIENT_VOLUME, AMBIENT_VOLUME_SCREEN_READER, ambientSound } from '@/services/ambient-sound';

import { usePreferences } from './use-preferences';

// Loops the ambient sound for the given conditions while the app is in the
// foreground and "Ambient weather sound" is on in Settings. Pass an empty
// list for silence (e.g. while the weather is loading). Returns `replay`,
// which restarts the sound with a fade-in.
export function useConditionSound(conditions: ConditionId[]) {
  const { preferences } = usePreferences();
  const foreground = useIsForeground();
  const screenReader = useScreenReaderEnabled();

  useEffect(() => {
    ambientSound.configure();
    return () => ambientSound.stopAll();
  }, []);

  // A string, so a new array with the same conditions doesn't restart fades.
  const key = conditions.join(',');
  useEffect(() => {
    ambientSound.update({
      conditions: key ? (key.split(',') as ConditionId[]) : [],
      enabled: preferences.ambientSound,
      foreground,
      volume: screenReader ? AMBIENT_VOLUME_SCREEN_READER : AMBIENT_VOLUME,
    });
  }, [key, preferences.ambientSound, foreground, screenReader]);

  return { replay: () => ambientSound.replay() };
}

function useIsForeground(): boolean {
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    // 'inactive' (e.g. Control Center open) still counts as foreground.
    const subscription = AppState.addEventListener('change', (state) => setForeground(state !== 'background'));
    return () => subscription.remove();
  }, []);
  return foreground;
}

function useScreenReaderEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setEnabled);
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setEnabled);
    return () => subscription.remove();
  }, []);
  return enabled;
}
