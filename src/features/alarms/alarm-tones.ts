import type { AudioSource } from 'expo-audio';

// The alarm tones, in one place: the files in assets/sounds/alarms/ (names
// kept as delivered) and what the editor's Sound list shows. To add one,
// add its id here and to TONE_IDS.
export const TONE_IDS = ['morning', 'digital', 'generic', 'dreamcore'] as const;
export type AlarmTone = (typeof TONE_IDS)[number];

export const DEFAULT_TONE: AlarmTone = 'morning';

type ToneInfo = {
  label: string;
  // TODO: descriptions are from the file names; confirm by ear.
  description: string;
  // Must be a static require() so Expo bundles the file.
  source: AudioSource;
  // Integrated loudness of the file as delivered (BS.1770, LUFS).
  lufs: number;
  // Player volume (0-1) that brings the tone to about TONE_TARGET_LUFS.
  // Quieter files stay at 1: a player can't go above full volume.
  toneVolume: number;
};

// Every tone plays at about this level (the ringer and the editor's
// previews both apply toneVolume).
export const TONE_TARGET_LUFS = -17;

// Loudness and length measured 2026-10-20, re-measured 2026-10-25 (same
// values). Generic is far louder than the rest, so it's turned down.
export const ALARM_TONES: Record<AlarmTone, ToneInfo> = {
  // 10 s. 0.4 LU under the target; can't be raised.
  morning: {
    label: 'Morning',
    description: 'Bright morning tune',
    source: require('../../../assets/sounds/alarms/morning-alarm_clipped.m4a'),
    lufs: -17.4,
    toneVolume: 1,
  },
  // 7.6 s. 2.6 LU under the target; can't be raised.
  digital: {
    label: 'Digital',
    description: 'Electronic beeps',
    source: require('../../../assets/sounds/alarms/digital-alarm.m4a'),
    lufs: -19.6,
    toneVolume: 1,
  },
  // 4.6 s. 11.1 LU over the target: 10 ** (-11.1 / 20) = 0.28.
  generic: {
    label: 'Classic',
    description: 'Loud, classic alarm',
    source: require('../../../assets/sounds/alarms/generic-alarm.m4a'),
    lufs: -5.9,
    toneVolume: 0.28,
  },
  // 10 s. 1.6 LU under the target; can't be raised.
  dreamcore: {
    label: 'Dreamcore',
    description: 'Soft, dreamy synth',
    source: require('../../../assets/sounds/alarms/dreamcore-alarm.m4a'),
    lufs: -18.6,
    toneVolume: 1,
  },
};

export function isAlarmTone(value: unknown): value is AlarmTone {
  return typeof value === 'string' && (TONE_IDS as readonly string[]).includes(value);
}
