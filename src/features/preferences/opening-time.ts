// Which tab AtmosHear opens to, by time of day. Pure functions only, so the
// rules are easy to test.

// A time of day on a 24-hour clock: hour 0-23, minute 0-59.
export type ClockTime = { hour: number; minute: number };

export type StartTab = 'weather' | 'alarms';

export const DEFAULT_MORNING: ClockTime = { hour: 9, minute: 0 };
export const DEFAULT_EVENING: ClockTime = { hour: 19, minute: 0 };

// Coming back after at least this long in the background counts as a fresh
// open. Shorter, and the user stays where they were.
export const RESET_AFTER_BACKGROUND_MS = 5 * 60 * 1000;

// From the morning time until the evening time: Weather. From the evening
// time until the next morning (passing midnight): Alarms. Both boundaries
// switch on the exact minute, so 9:00 AM is Weather and 7:00 PM is Alarms.
// The morning time is always AM and the evening time PM, so morning comes
// first.
export function getStartTab(now: Date, morning: ClockTime, evening: ClockTime): StartTab {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isDay = minutes >= toMinutes(morning) && minutes < toMinutes(evening);
  return isDay ? 'weather' : 'alarms';
}

// AM: midnight (12:00 AM) to 11:59 AM. PM: noon (12:00 PM) to 11:59 PM.
export function isAm(time: ClockTime): boolean {
  return time.hour < 12;
}

// Today's date at the given time, e.g. for a simulated "now".
export function todayAt(time: ClockTime, today = new Date()): Date {
  const date = new Date(today);
  date.setHours(time.hour, time.minute, 0, 0);
  return date;
}

// "9:00 AM", or "09:00" with the phone's 24-hour setting on.
export function formatClockTime(time: ClockTime, uses24Hour: boolean): string {
  const mm = String(time.minute).padStart(2, '0');
  if (uses24Hour) return `${String(time.hour).padStart(2, '0')}:${mm}`;
  return `${time.hour % 12 || 12}:${mm} ${isAm(time) ? 'AM' : 'PM'}`;
}

function toMinutes(time: ClockTime): number {
  return time.hour * 60 + time.minute;
}
