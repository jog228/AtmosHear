// The time-of-day greeting on the Weather screen. Pure, so the rules are
// easy to test. Times compare as minutes since midnight, phone time.

type Period = 'Good morning' | 'Good afternoon' | 'Good evening' | 'Good night';

const MORNING_START = 5 * 60; // 5:00 AM
const NOON = 12 * 60;
const LATEST_EVENING_START = 17 * 60; // 5:00 PM
const FALLBACK_SUNSET = 20 * 60; // 8:00 PM, if sunset is unavailable

// 5:00 AM-11:59 AM: morning. Noon until evening: afternoon. Evening starts
// at 5:00 PM or an hour before sunset, whichever is earlier, and lasts until
// sunset. Sunset until 4:59 AM (across midnight): night.
// "Good morning!", or "Good morning, Jolie!" with a name.
export function getGreeting(now: Date, sunset: Date | null, name?: string): string {
  const period = getPeriod(now, sunset);
  const trimmed = name?.trim();
  return trimmed ? `${period}, ${trimmed}!` : `${period}!`;
}

function getPeriod(now: Date, sunset: Date | null): Period {
  const minutes = minutesOfDay(now);
  const sunsetMinutes = sunset ? minutesOfDay(sunset) : FALLBACK_SUNSET;
  const eveningStart = Math.min(LATEST_EVENING_START, sunsetMinutes - 60);

  if (minutes < MORNING_START || minutes >= sunsetMinutes) return 'Good night';
  if (minutes < NOON) return 'Good morning';
  if (minutes >= eveningStart) return 'Good evening';
  return 'Good afternoon';
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
