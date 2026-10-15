// Vibration patterns are plain data: taps at set times. The player in
// src/services/haptics.ts turns them into vibration, so a pattern can later
// be swapped for a Core Haptics (AHAP) file without touching this format.

// The tap strengths expo-haptics offers, from faintest to sharpest.
export type HapticStyle = 'soft' | 'light' | 'medium' | 'heavy' | 'rigid';

// One tap, `at` milliseconds after the pattern starts.
export type HapticTap = { at: number; style: HapticStyle };

export type HapticPattern = HapticTap[];

// Taps of one style at the given times: taps('soft', [0, 600, 1200]).
export function taps(style: HapticStyle, times: number[]): HapticPattern {
  return times.map((at) => ({ at, style }));
}

// Evenly spaced taps from `from` up to (not including) `until`:
// tapsEvery('heavy', 70, 0, 1400) is a heavy tap every 70 ms for 1.4 s.
export function tapsEvery(style: HapticStyle, everyMs: number, from: number, until: number): HapticPattern {
  const times: number[] = [];
  for (let at = from; at < until; at += everyMs) times.push(at);
  return taps(style, times);
}

// Gap between two patterns when conditions overlap (primary, then secondary).
export const COMBINED_PATTERN_GAP_MS = 400;
