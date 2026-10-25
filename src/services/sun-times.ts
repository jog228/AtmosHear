import { getTimes } from 'suncalc';

import type { SunTimes } from './weather-data';

const DAY_MS = 24 * 60 * 60 * 1000;

// Sunrise and sunset for the day `now` falls on. Uses the source's times
// when they're for today; otherwise (NWS, an old saved forecast, or the app
// left open past midnight) calculates them from the location. Null only
// where the sun doesn't rise or set that day (polar day or night).
export function resolveSunTimes(now: number, provided: SunTimes | undefined, latitude: number, longitude: number): SunTimes | null {
  if (provided && sameDay(provided.sunrise, now)) return provided;
  const today = calculate(now, latitude, longitude);
  const tomorrow = calculate(now + DAY_MS, latitude, longitude);
  if (!today || !tomorrow) return null;
  return { sunrise: today.sunrise, sunset: today.sunset, tomorrowSunrise: tomorrow.sunrise };
}

export type SunPhase = { kind: 'day'; daylightLeftMs: number } | { kind: 'night'; untilSunriseMs: number };

export function sunPhase(now: number, times: SunTimes): SunPhase {
  if (now < times.sunrise) return { kind: 'night', untilSunriseMs: times.sunrise - now };
  if (now >= times.sunset) return { kind: 'night', untilSunriseMs: times.tomorrowSunrise - now };
  return { kind: 'day', daylightLeftMs: times.sunset - now };
}

// How much of today's daylight has passed, 0 (sunrise or earlier) to 1
// (sunset or later).
export function daylightPassed(now: number, times: SunTimes): number {
  return Math.min(1, Math.max(0, (now - times.sunrise) / (times.sunset - times.sunrise)));
}

// 11_400_000 -> { short: "3 hr 10 min", spoken: "3 hours 10 minutes" }.
// Under an hour: "45 min". Rounds down to the minute.
export function formatDuration(ms: number): { short: string; spoken: string } {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const short = [hours > 0 && `${hours} hr`, (minutes > 0 || hours === 0) && `${minutes} min`].filter(Boolean).join(' ');
  const spoken = [
    hours > 0 && `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
    (minutes > 0 || hours === 0) && `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`,
  ]
    .filter(Boolean)
    .join(' ');
  return { short, spoken };
}

// "7:12 AM", or "07:12" with the phone's 24-hour setting on.
export function formatTimeOfDay(timestamp: number, uses24Hour: boolean): string {
  const date = new Date(timestamp);
  const mm = String(date.getMinutes()).padStart(2, '0');
  const hour = date.getHours();
  if (uses24Hour) return `${String(hour).padStart(2, '0')}:${mm}`;
  return `${hour % 12 || 12}:${mm} ${hour < 12 ? 'AM' : 'PM'}`;
}

function calculate(timestamp: number, latitude: number, longitude: number) {
  // Midday, so suncalc picks the right calendar day.
  const noon = new Date(timestamp);
  noon.setHours(12, 0, 0, 0);
  const { sunrise, sunset } = getTimes(noon, latitude, longitude);
  // suncalc gives null or an invalid date when the sun doesn't rise or set.
  const rise = sunrise?.getTime() ?? NaN;
  const set = sunset?.getTime() ?? NaN;
  if (Number.isNaN(rise) || Number.isNaN(set)) return null;
  return { sunrise: rise, sunset: set };
}

function sameDay(a: number, b: number) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
