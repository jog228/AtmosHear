import type { AlarmTone } from './alarm-tones';

// One alarm: the data the list, the editor, and the ringer work with.
export type Alarm = {
  id: string;
  // 24-hour clock: 0-23 and 0-59.
  hour: number;
  minute: number;
  enabled: boolean;
  // Days it repeats, 0 = Sunday ... 6 = Saturday. Empty = rings once.
  repeatDays: number[];
  label: string;
  // Which sound it rings with (alarm-tones.ts). Alarms saved before tones
  // existed load as the default.
  tone: AlarmTone;
  // A non-repeating alarm's ring time (ms since 1970), set when it's
  // switched on or saved. Once it has passed, the alarm switches off.
  onceAt?: number;
  // Milliseconds since 1970; breaks ties when two alarms share a time.
  createdAt: number;
};

// What the editor fills in. The id, createdAt, enabled, and onceAt are set
// when it's saved.
export type AlarmDraft = Pick<Alarm, 'hour' | 'minute' | 'repeatDays' | 'label' | 'tone'>;

export const DEFAULT_LABEL = 'Alarm';
