import type { ConditionId } from '@/constants/conditions';

// The one weather shape the app uses. Every provider (Open-Meteo, NWS, demo)
// converts its own response into this. Units: °F, mph, percent.

// 'test' is Developer mode's filler data; 'demo' is the last-resort fallback.
export type WeatherSource = 'open-meteo' | 'nws' | 'cache' | 'demo' | 'test';

export type CurrentWeather = {
  // Most important first, e.g. ['light-rain', 'wind'].
  conditions: ConditionId[];
  isDay: boolean;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
};

export type HourlyForecast = {
  // Start of the hour, in milliseconds since 1970 (like Date.now()).
  time: number;
  // e.g. "3 PM", in the forecast location's time zone.
  hourLabel: string;
  conditions: ConditionId[];
  isDay: boolean;
  temperature: number;
  rainChance: number;
};

export type WeatherAlert = {
  // Must stay the same for the whole life of one alert (NWS alert IDs do),
  // so the alert only beeps once.
  id: string;
  // e.g. "Severe Thunderstorm Warning".
  name: string;
};

export type WeatherData = {
  source: WeatherSource;
  locationName: string;
  // When this data was fetched, in milliseconds since 1970.
  updatedAt: number;
  current: CurrentWeather;
  hourly: HourlyForecast[];
  // The most important active severe weather alert, if any. Only test
  // weather sets this until NWS alert fetching is built.
  alert?: WeatherAlert;
};
