import type { AqiLevel } from '@/constants/air-quality';
import type { ConditionId } from '@/constants/conditions';

// The one weather shape the app uses. Every provider (Open-Meteo, NWS, demo)
// converts its own response into this. Units: °F, mph, percent, inches.

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
  // UV index now, rounded (0-11+). Null when the source doesn't give it
  // (NWS): show it as unavailable, never a made-up value.
  uvIndex: number | null;
  // Total snowfall expected today, in inches. Null when unavailable (NWS).
  snowToday: number | null;
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

// One day of the 3-day forecast.
export type DailyForecast = {
  // The calendar day in the forecast location, "2026-10-15".
  date: string;
  // The day's main weather (for the icon and VoiceOver).
  conditions: ConditionId[];
  high: number;
  low: number;
};

// Today's sunrise and sunset, and tomorrow's sunrise (for the countdown at
// night), in milliseconds since 1970.
export type SunTimes = {
  sunrise: number;
  sunset: number;
  tomorrowSunrise: number;
};

// US Air Quality Index now (0-500), from the separate air quality request.
export type AirQuality = {
  aqi: number;
  level: AqiLevel;
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
  // Today and the next four days (fewer if the source ran short, or from a
  // save made before the 5-day forecast). Empty if unavailable.
  daily: DailyForecast[];
  // Missing when the source doesn't give them (NWS); the app then
  // calculates them from the location (src/services/sun-times.ts).
  sun?: SunTimes;
  // Null when the air quality request failed: the card shows a dash.
  airQuality: AirQuality | null;
  // The most important active severe weather alert, if any. Only test
  // weather sets this until NWS alert fetching is built.
  alert?: WeatherAlert;
};

// What a weather provider returns. Air quality comes from its own request
// (src/services/air-quality.ts), added by src/services/weather.ts.
export type ProviderWeather = Omit<WeatherData, 'airQuality'>;
