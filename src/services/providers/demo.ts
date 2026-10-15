import type { ConditionId } from '@/constants/conditions';
import { getTestWeatherOption, HOURLY_RAIN_CHANCE, TEST_SUN } from '@/constants/test-weather';

import { formatHour } from '../time';
import type { HourlyForecast, WeatherData } from '../weather-data';

const HOUR_MS = 60 * 60 * 1000;

// Builds believable weather from a test weather option (values live in
// src/constants/test-weather.ts). Used by Developer mode ('test') and as the
// last-resort fallback when no live or saved weather exists ('demo').
export function getDemoWeather(
  locationName: string,
  optionId = 'light-rain+wind',
  source: 'demo' | 'test' = 'demo',
): WeatherData {
  const option = getTestWeatherOption(optionId);
  const now = Date.now();
  const startOfHour = now - (now % HOUR_MS);
  const nowHour = new Date(now).getHours();
  const hourConditions = option.forecast.flatMap(([conditions, count]) => Array(count).fill(conditions) as ConditionId[][]);

  // Warmest mid-afternoon, coolest before dawn.
  const daily = (hour: number) => Math.sin((2 * Math.PI * (hour - 9)) / 24);

  const hourly: HourlyForecast[] = hourConditions.slice(0, 12).map((conditions, i) => {
    const date = new Date(startOfHour + (i + 1) * HOUR_MS);
    const hour = date.getHours();
    const typicalRain = Math.max(...conditions.map((id) => HOURLY_RAIN_CHANCE[id]));
    // Small, repeatable variation so the row doesn't look copy-pasted.
    const wobble = typicalRain === 0 ? 0 : ((i * 7) % 11) - 5;
    return {
      time: date.getTime(),
      hourLabel: formatHour(hour),
      conditions,
      isDay: isDaytime(hour),
      temperature: Math.round(option.temperature + option.dailySwing * (daily(hour) - daily(nowHour))),
      rainChance: Math.min(100, Math.max(0, typicalRain + wobble)),
    };
  });

  return {
    source,
    locationName,
    updatedAt: now,
    current: {
      conditions: option.conditions,
      isDay: isDaytime(nowHour),
      temperature: option.temperature,
      feelsLike: option.feelsLike,
      humidity: option.humidity,
      windSpeed: option.windSpeed,
      rainChance: option.rainChance,
      uvIndex: option.uvIndex,
      snowToday: option.snowToday,
    },
    hourly,
    sun: {
      sunrise: todayAt(TEST_SUN.sunrise),
      sunset: todayAt(TEST_SUN.sunset),
      tomorrowSunrise: todayAt(TEST_SUN.tomorrowSunrise) + 24 * HOUR_MS,
    },
    // A fresh ID each time, so picking this test weather always beeps.
    alert: option.alert ? { id: `test-${option.id}-${now}`, name: option.alert } : undefined,
  };
}

function todayAt([hour, minute]: readonly [number, number]): number {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function isDaytime(hour: number) {
  return hour >= 7 && hour < 19;
}
