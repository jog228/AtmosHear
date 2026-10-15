// One alarm. Alarms don't ring yet; this is the data the list and editor
// work with.
export type Alarm = {
  id: string;
  // 24-hour clock: 0-23 and 0-59.
  hour: number;
  minute: number;
  enabled: boolean;
  // Days it repeats, 0 = Sunday ... 6 = Saturday. Empty = rings once.
  repeatDays: number[];
  label: string;
  // Milliseconds since 1970; breaks ties when two alarms share a time.
  createdAt: number;
};

// What the editor fills in. The id, createdAt, and enabled are set when it's
// saved.
export type AlarmDraft = Pick<Alarm, 'hour' | 'minute' | 'repeatDays' | 'label'>;

export const DEFAULT_LABEL = 'Alarm';
