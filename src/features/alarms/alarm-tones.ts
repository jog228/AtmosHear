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
};

// Loudness (BS.1770, integrated) and length, measured 2026-10-20. Generic
// is far louder than the rest; the files are played as delivered.
export const ALARM_TONES: Record<AlarmTone, ToneInfo> = {
  // -17.4 LUFS, 10 s.
  morning: {
    label: 'Morning',
    description: 'Bright morning tune',
    source: require('../../../assets/sounds/alarms/morning-alarm_clipped.m4a'),
  },
  // -19.6 LUFS, 7.6 s.
  digital: {
    label: 'Digital',
    description: 'Electronic beeps',
    source: require('../../../assets/sounds/alarms/digital-alarm.m4a'),
  },
  // -5.9 LUFS, 4.6 s.
  generic: {
    label: 'Classic',
    description: 'Loud, classic alarm',
    source: require('../../../assets/sounds/alarms/generic-alarm.m4a'),
  },
  // -18.6 LUFS, 10 s.
  dreamcore: {
    label: 'Dreamcore',
    description: 'Soft, dreamy synth',
    source: require('../../../assets/sounds/alarms/dreamcore-alarm.m4a'),
  },
};

export function isAlarmTone(value: unknown): value is AlarmTone {
  return typeof value === 'string' && (TONE_IDS as readonly string[]).includes(value);
}
