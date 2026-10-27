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

// How long until a ring, rounded up to the minute: "16 hr 29 min",
// "2 days 3 hr", "5 min", and spoken, "16 hours 29 minutes".
export function untilText(ms: number): { short: string; spoken: string } {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (days > 0) {
    return {
      short: [plural(days, 'day'), hours > 0 && `${hours} hr`].filter(Boolean).join(' '),
      spoken: [plural(days, 'day'), hours > 0 && plural(hours, 'hour')].filter(Boolean).join(' '),
    };
  }
  return {
    short: [hours > 0 && `${hours} hr`, (mins > 0 || hours === 0) && `${mins} min`].filter(Boolean).join(' '),
    spoken: [hours > 0 && plural(hours, 'hour'), (mins > 0 || hours === 0) && plural(mins, 'minute')]
      .filter(Boolean)
      .join(' '),
  };
}

// A snooze countdown: "8:42", or "1:05:00" past an hour.
export function countdownText(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

// "Thursday, Oct 15", in the phone's language.
export function dateText(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
