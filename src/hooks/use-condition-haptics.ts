import { useEffect, useRef } from 'react';

import type { ConditionId } from '@/constants/conditions';
import type { HapticPattern } from '@/constants/haptics';
import { conditionPatterns, hapticPlayer } from '@/services/haptics';

import { useIsForeground } from './use-is-foreground';
import { usePreferences } from './use-preferences';

// Vibrates the pattern for the given conditions once when the weather first
// loads and again whenever the conditions change, if "Vibration" is on in
// Preferences. Pass an empty list while loading. During a severe alert
// (`alertActive`), the alert vibrates with its beeps instead. Returns
// `replay` (for tapping the weather icon) and `playPattern`.
export function useConditionHaptics(conditions: ConditionId[], alertActive: boolean) {
  const { preferences } = usePreferences();
  const enabled = preferences.vibration;
  const foreground = useIsForeground();

  // A string, so a refresh with the same conditions doesn't vibrate again.
  const key = conditions.join(',');
  const lastKey = useRef('');
  useEffect(() => {
    // An empty list (loading, or another tab is showing) stops a pattern
    // mid-way, but doesn't count as a change: the same weather coming back
    // doesn't vibrate again.
    if (!key) {
      hapticPlayer.cancelConditionPattern();
      return;
    }
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (enabled && foreground && !alertActive) {
      hapticPlayer.play(conditionPatterns(key.split(',') as ConditionId[]));
    }
  }, [key, enabled, foreground, alertActive]);

  // Stop mid-pattern when the app leaves the screen (alerts stop too) or
  // Vibration is turned off (alerts keep going).
  useEffect(() => {
    if (!foreground) hapticPlayer.cancel();
    else if (!enabled) hapticPlayer.cancelConditionPattern();
  }, [foreground, enabled]);

  useEffect(() => () => hapticPlayer.cancelConditionPattern(), []);

  return {
    replay: () => {
      if (enabled) hapticPlayer.play(conditionPatterns(conditions));
    },
    playPattern: (pattern: HapticPattern) => {
      if (enabled) hapticPlayer.play([pattern]);
    },
  };
}
