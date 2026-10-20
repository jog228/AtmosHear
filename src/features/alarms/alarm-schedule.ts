import type { Alarm } from './alarm-types';

// When alarms ring: plain functions of the alarm and the time, so the
// in-app ringer, the notifications, and the one-time alarm cleanup all
// agree.

// The next time the clock shows hour:minute, strictly after `now`.
export function nextOccurrence(hour: number, minute: number, now: number): number {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= now) date.setDate(date.getDate() + 1);
  return date.getTime();
}

// The start of the minute `now` is in.
export function minuteStart(now: number): number {
  return Math.floor(now / 60_000) * 60_000;
}

// True while `now` is in the minute an enabled alarm rings.
export function isDue(alarm: Alarm, now: number): boolean {
  if (!alarm.enabled) return false;
  const date = new Date(now);
  if (alarm.repeatDays.length === 0) {
    return alarm.onceAt !== undefined && minuteStart(now) === alarm.onceAt;
  }
  return alarm.repeatDays.includes(date.getDay()) && date.getHours() === alarm.hour && date.getMinutes() === alarm.minute;
}

// One key per ring, so the same ring isn't started twice (the in-app check
// and a notification can both see it).
export function ringKey(alarmId: string, ringMinute: number): string {
  return `${alarmId}@${minuteStart(ringMinute)}`;
}

// A one-time alarm whose minute has passed (it rang, or the app was closed
// and only the notification could ring it).
export function isExpired(alarm: Alarm, now: number): boolean {
  return alarm.enabled && alarm.repeatDays.length === 0 && alarm.onceAt !== undefined && now >= alarm.onceAt + 60_000;
}
