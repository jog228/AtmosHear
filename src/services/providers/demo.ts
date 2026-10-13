import { CONDITION_IDS, type ConditionId } from '@/constants/conditions';

import { formatHour } from '../time';
import type { HourlyForecast, WeatherData } from '../weather-data';

const HOUR_MS = 60 * 60 * 1000;

// Made-up weather, used when every live source and the saved copy are
// unavailable. The current conditions default to an overlap (rain + wind).
// The hourly row walks through the conditions in order (clear, partly
// cloudy, overcast, ...), so the demo shows off a dozen of them at once.
export function getDemoWeather(
  locationName: string,
  conditions: ConditionId[] = ['light-rain', 'wind'],
): WeatherData {
  const now = Date.now();
  const startOfHour = now - (now % HOUR_MS);

  const hourly: HourlyForecast[] = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(startOfHour + (i + 1) * HOUR_MS);
    const hour = date.getHours();
    return {
      time: date.getTime(),
      hourLabel: formatHour(hour),
      conditions: [CONDITION_IDS[i % CONDITION_IDS.length]],
      isDay: hour >= 7 && hour < 19,
      temperature: 58 - Math.round(i / 2),
      rainChance: Math.max(20, 80 - i * 5),
    };
  });

  const hour = new Date(now).getHours();
  return {
    source: 'demo',
    locationName,
    updatedAt: now,
    current: {
      conditions,
      isDay: hour >= 7 && hour < 19,
      temperature: 58,
      feelsLike: 52,
      humidity: 88,
      windSpeed: 22,
      rainChance: 80,
    },
    hourly,
  };
}
