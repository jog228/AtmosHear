import type { ConditionId } from '@/constants/conditions';

import type { Preferences } from './preferences';
import { getDemoWeather } from './providers/demo';
import { loadCachedWeather } from './weather-cache';
import type { WeatherData } from './weather-data';

const HOUR_MS = 60 * 60 * 1000;

// The weather already on hand, without waiting for the network: Developer
// test weather, or the last saved live forecast. Null with nothing saved
// (demo filler isn't real weather). For screens away from the Weather tab
// (bedside mode) and the weather under an alarm.
export async function loadLatestWeather(preferences: Preferences): Promise<WeatherData | null> {
  if (preferences.developerMode && preferences.devWeatherSource === 'test') {
    return getDemoWeather('', preferences.testWeather, 'test');
  }
  return loadCachedWeather();
}

// What's outside now, from that weather. A forecast saved over an hour ago
// (e.g. last night) uses its forecast for this hour instead, which has no
// feels-like temperature.
export function weatherNow(
  weather: WeatherData,
  now = Date.now(),
): { conditions: ConditionId[]; temperature: number; feelsLike: number | null } {
  const hour = weather.hourly[0];
  if (now - weather.updatedAt > HOUR_MS && hour) {
    return { conditions: hour.conditions, temperature: hour.temperature, feelsLike: null };
  }
  const { conditions, temperature, feelsLike } = weather.current;
  return { conditions, temperature, feelsLike };
}
