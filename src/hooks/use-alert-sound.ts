import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

import { alertSound } from '@/services/alert-sound';
import type { WeatherAlert } from '@/services/weather-data';

import { useIsForeground } from './use-is-foreground';

// Beeps once for each new severe weather alert (also when the app opens with
// one active), then announces it to VoiceOver/TalkBack. Ignores the
// "Ambient sound" setting. Returns `replay`, which beeps again.
export function useAlertSound(alert: WeatherAlert | undefined) {
  const foreground = useIsForeground();

  useEffect(() => {
    alertSound.preload();
    return () => alertSound.stop();
  }, []);

  // Audio can't play in the background, so cut the beeps short there.
  useEffect(() => {
    if (!foreground) alertSound.stop();
  }, [foreground]);

  const id = alert?.id;
  const name = alert?.name;
  useEffect(() => {
    if (!id || !name || !foreground) return;
    alertSound.playIfNew(id, () => announceAlert(name));
  }, [id, name, foreground]);

  return {
    replay: () => {
      if (name) alertSound.play(() => announceAlert(name));
    },
  };
}

// Spoken after the beeps, so the words aren't drowned out (or cut off by
// VoiceOver reading the screen as the app opens).
export function announceAlert(name: string) {
  AccessibilityInfo.announceForAccessibility(`Severe weather alert: ${name}`);
}
