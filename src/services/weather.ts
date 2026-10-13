import type { ConditionId } from '@/constants/conditions';

import { conditionFromWmoCode } from './wmo-condition';

export type CurrentWeather = {
  condition: ConditionId;
  isDay: boolean;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
};

export type HourlyForecast = {
  time: string;
  hourLabel: string;
  condition: ConditionId;
  isDay: boolean;
  temperature: number;
  rainChance: number;
};

export type Weather = {
  current: CurrentWeather;
  hourly: HourlyForecast[];
};

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    is_day: number[];
  };
};

const HOURS_AHEAD = 12;

// Fetches current weather plus the next 12 hours, in °F and mph.
// Open-Meteo is free and needs no API key: https://open-meteo.com/en/docs
export async function fetchWeather(latitude: number, longitude: number): Promise<Weather> {
  const params = [
    `latitude=${latitude}`,
    `longitude=${longitude}`,
    'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
    'hourly=temperature_2m,weather_code,precipitation_probability,is_day',
    'temperature_unit=fahrenheit',
    'wind_speed_unit=mph',
    'timezone=auto',
    // The first hourly entry is the current hour, followed by the next 12.
    `forecast_hours=${HOURS_AHEAD + 1}`,
  ].join('&');

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
  const data: OpenMeteoResponse = await response.json();

  const { current, hourly } = data;
  const hours = hourly.time.map((time, i) => ({
    time,
    hourLabel: formatHour(time),
    condition: conditionFromWmoCode(hourly.weather_code[i]),
    isDay: hourly.is_day[i] === 1,
    temperature: Math.round(hourly.temperature_2m[i]),
    rainChance: hourly.precipitation_probability[i] ?? 0,
  }));

  return {
    current: {
      condition: conditionFromWmoCode(current.weather_code),
      isDay: current.is_day === 1,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      rainChance: hours[0]?.rainChance ?? 0,
    },
    hourly: hours.slice(1, HOURS_AHEAD + 1),
  };
}

// "2026-10-13T15:00" -> "3 PM". Times are already in the location's timezone.
function formatHour(time: string): string {
  const hour = Number(time.slice(11, 13));
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 || 12} ${suffix}`;
}
