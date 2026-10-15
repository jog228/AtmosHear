import type { Alarm } from './alarm-types';

// 0 = Sunday, matching Date.getDay().
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS = [1, 2, 3, 4, 5];
const WEEKENDS = [0, 6];

// The time as shown: 12-hour "7:05" with period "AM", or 24-hour "07:05"
// with no period, following the phone's 24-hour setting.
export function formatTime(hour: number, minute: number, uses24Hour: boolean): { time: string; period: string } {
  const mm = String(minute).padStart(2, '0');
  if (uses24Hour) return { time: `${String(hour).padStart(2, '0')}:${mm}`, period: '' };
  return { time: `${hour % 12 || 12}:${mm}`, period: hour < 12 ? 'AM' : 'PM' };
}

// "7:05 AM" or "07:05", for screen readers and messages.
export function timeText(hour: number, minute: number, uses24Hour: boolean): string {
  const { time, period } = formatTime(hour, minute, uses24Hour);
  return period ? `${time} ${period}` : time;
}

// Like Apple's Clock: "Never", "Every day", "Weekdays", "Weekends", a single
// "Every Monday", or short names in week order, "Mon Wed Fri".
export function repeatSummary(days: number[]): string {
  const set = new Set(days);
  const has = (list: number[]) => list.length === set.size && list.every((day) => set.has(day));
  if (set.size === 0) return 'Never';
  if (set.size === 7) return 'Every day';
  if (has(WEEKDAYS)) return 'Weekdays';
  if (has(WEEKENDS)) return 'Weekends';
  if (set.size === 1) return `Every ${DAY_NAMES[[...set][0]]}`;
  return SHORT_DAY_NAMES.filter((_, day) => set.has(day)).join(' ');
}

// The line under the time in the list: "Alarm, weekdays", or just the
// label when it doesn't repeat.
export function alarmSubtitle(alarm: Pick<Alarm, 'label' | 'repeatDays'>): string {
  if (alarm.repeatDays.length === 0) return alarm.label;
  const summary = repeatSummary(alarm.repeatDays);
  // Lowercase the general words; day names keep their capitals.
  const lowered = ['Every day', 'Weekdays', 'Weekends'].includes(summary) ? summary.toLowerCase() : summary;
  return `${alarm.label}, ${lowered}`;
}

// What VoiceOver reads for the repeat days: full names, not "Mon Wed Fri".
export function spokenRepeat(days: number[]): string {
  const summary = repeatSummary(days);
  if (summary === 'Never') return 'does not repeat';
  if (summary.startsWith('Every ')) return `repeats ${summary.replace('Every day', 'every day')}`;
  if (summary === 'Weekdays' || summary === 'Weekends') return `repeats on ${summary.toLowerCase()}`;
  return `repeats ${DAY_NAMES.filter((_, day) => days.includes(day)).join(', ')}`;
}
