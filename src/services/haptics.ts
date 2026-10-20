import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { sortByPriority } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { COMBINED_PATTERN_GAP_MS, type HapticPattern, type HapticStyle, type HapticTap } from '@/constants/haptics';

const IMPACT_STYLES: Record<HapticStyle, Haptics.ImpactFeedbackStyle> = {
  soft: Haptics.ImpactFeedbackStyle.Soft,
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
};

// Plays vibration patterns as timed taps with expo-haptics, so it works in
// Expo Go. Only one sequence plays at a time: starting a new one cancels
// the rest of the old one. Patterns never loop. Each tap is also sent to
// tap listeners at the moment it plays (the cue screens' pulsing rings), so
// what you see can't drift from what you feel.
class HapticPlayer {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private tapListeners = new Set<(tap: HapticTap) => void>();
  // A severe alert's taps can't be cut off by a condition pattern.
  private alertPlaying = false;

  // Plays the patterns one after another, with a short gap between them.
  // `alert` marks severe alert taps, which win over condition patterns.
  play(patterns: HapticPattern[], { alert = false } = {}) {
    if (this.alertPlaying && !alert) return;
    this.cancel();

    this.alertPlaying = alert;
    let offset = 0;
    for (const pattern of patterns) {
      if (pattern.length === 0) continue;
      const sorted = [...pattern].sort((a, b) => a.at - b.at);
      for (const tap of sorted) {
        this.timers.push(
          setTimeout(() => {
            tapNow(tap.style);
            this.tapListeners.forEach((listener) => listener(tap));
          }, offset + tap.at),
        );
      }
      offset += sorted[sorted.length - 1].at + COMBINED_PATTERN_GAP_MS;
    }
    // Clear the alert flag once the last tap has played.
    this.timers.push(setTimeout(() => this.cancel(), offset));
  }

  // Stops any taps still to come (e.g. the app went to the background).
  cancel() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.alertPlaying = false;
  }

  // Called with each tap as it plays. Returns a function that stops.
  subscribeTaps(listener: (tap: HapticTap) => void) {
    this.tapListeners.add(listener);
    return () => {
      this.tapListeners.delete(listener);
    };
  }

  // Stops a condition pattern but lets severe alert taps finish (alerts
  // ignore the Vibration setting).
  cancelConditionPattern() {
    if (!this.alertPlaying) this.cancel();
  }
}

function tapNow(style: HapticStyle) {
  // No Taptic Engine on the web (the simulator just ignores the calls), but
  // the timers still run there so tap listeners get the same rhythm.
  if (Platform.OS === 'web') return;
  // Fails quietly where haptics aren't available.
  Haptics.impactAsync(IMPACT_STYLES[style]).catch(() => {});
}

// The patterns for a set of conditions: the most significant one's (same
// order as the icon), then the next one's. ['wind', 'light-rain'] -> light
// rain, then wind.
export function conditionPatterns(ids: ConditionId[]): HapticPattern[] {
  return sortByPriority(ids)
    .slice(0, 2)
    .map((id) => conditionProfiles[id].haptic);
}

export const hapticPlayer = new HapticPlayer();
