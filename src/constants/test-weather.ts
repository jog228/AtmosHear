import type { ConditionId } from './conditions';

// Filler weather for Developer mode (and the last-resort demo fallback).
// Tweak any value here; the 12-hour forecast is generated from it by
// src/services/providers/demo.ts. Units: °F, mph, percent.

export type TestWeather = {
  id: string;
  label: string;
  group: 'Conditions' | 'Combinations';
  // Most significant first is not required; the app sorts by priority.
  conditions: ConditionId[];
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  // How much the temperature rises and falls with the time of day.
  dailySwing: number;
  // The next 12 hours, as [conditions, number of hours] segments that add up
  // to 12. Each hour's rain chance comes from its conditions.
  forecast: [ConditionId[], number][];
  // A severe weather alert to show with this weather (its name).
  alert?: string;
};

export const TEST_WEATHER: TestWeather[] = [
  // Single conditions
  { id: 'clear', label: 'Clear', group: 'Conditions', conditions: ['clear'],
    temperature: 72, feelsLike: 72, humidity: 45, windSpeed: 6, rainChance: 0, dailySwing: 8,
    forecast: [[['clear'], 8], [['partly-cloudy'], 4]] },
  { id: 'partly-cloudy', label: 'Partly cloudy', group: 'Conditions', conditions: ['partly-cloudy'],
    temperature: 68, feelsLike: 68, humidity: 52, windSpeed: 8, rainChance: 5, dailySwing: 7,
    forecast: [[['partly-cloudy'], 6], [['clear'], 3], [['partly-cloudy'], 3]] },
  { id: 'overcast', label: 'Overcast', group: 'Conditions', conditions: ['overcast'],
    temperature: 61, feelsLike: 61, humidity: 72, windSpeed: 9, rainChance: 15, dailySwing: 4,
    forecast: [[['overcast'], 7], [['light-rain'], 3], [['overcast'], 2]] },
  { id: 'light-rain', label: 'Light rain', group: 'Conditions', conditions: ['light-rain'],
    temperature: 55, feelsLike: 53, humidity: 88, windSpeed: 10, rainChance: 70, dailySwing: 3,
    forecast: [[['light-rain'], 6], [['overcast'], 4], [['partly-cloudy'], 2]] },
  { id: 'heavy-rain', label: 'Heavy rain', group: 'Conditions', conditions: ['heavy-rain'],
    temperature: 52, feelsLike: 49, humidity: 96, windSpeed: 14, rainChance: 95, dailySwing: 2,
    forecast: [[['heavy-rain'], 4], [['light-rain'], 5], [['overcast'], 3]] },
  { id: 'thunderstorm', label: 'Thunderstorm', group: 'Conditions', conditions: ['thunderstorm'],
    temperature: 78, feelsLike: 82, humidity: 85, windSpeed: 18, rainChance: 90, dailySwing: 5,
    forecast: [[['thunderstorm'], 3], [['heavy-rain'], 3], [['light-rain'], 3], [['partly-cloudy'], 3]] },
  { id: 'snow', label: 'Snow', group: 'Conditions', conditions: ['snow'],
    temperature: 28, feelsLike: 20, humidity: 90, windSpeed: 12, rainChance: 85, dailySwing: 3,
    forecast: [[['snow'], 8], [['overcast'], 4]] },
  { id: 'sleet', label: 'Sleet', group: 'Conditions', conditions: ['sleet'],
    temperature: 32, feelsLike: 25, humidity: 92, windSpeed: 13, rainChance: 80, dailySwing: 2,
    forecast: [[['sleet'], 5], [['snow'], 4], [['overcast'], 3]] },
  { id: 'fog', label: 'Fog', group: 'Conditions', conditions: ['fog'],
    temperature: 48, feelsLike: 47, humidity: 99, windSpeed: 3, rainChance: 10, dailySwing: 5,
    forecast: [[['fog'], 5], [['overcast'], 4], [['partly-cloudy'], 3]] },
  { id: 'wind', label: 'Wind', group: 'Conditions', conditions: ['wind'],
    temperature: 58, feelsLike: 51, humidity: 48, windSpeed: 28, rainChance: 10, dailySwing: 6,
    forecast: [[['wind'], 6], [['partly-cloudy', 'wind'], 4], [['partly-cloudy'], 2]] },
  { id: 'extreme-heat', label: 'Extreme heat', group: 'Conditions', conditions: ['extreme-heat'],
    temperature: 98, feelsLike: 108, humidity: 48, windSpeed: 6, rainChance: 5, dailySwing: 9,
    forecast: [[['extreme-heat'], 7], [['clear'], 5]] },
  { id: 'extreme-cold', label: 'Extreme cold', group: 'Conditions', conditions: ['extreme-cold'],
    temperature: 2, feelsLike: -14, humidity: 65, windSpeed: 14, rainChance: 5, dailySwing: 5,
    forecast: [[['extreme-cold'], 9], [['clear', 'extreme-cold'], 3]] },
  { id: 'severe-alert', label: 'Severe alert', group: 'Conditions', conditions: ['severe-alert', 'thunderstorm', 'heavy-rain'],
    alert: 'Severe Thunderstorm Warning',
    temperature: 79, feelsLike: 84, humidity: 82, windSpeed: 32, rainChance: 90, dailySwing: 4,
    forecast: [[['severe-alert'], 3], [['thunderstorm'], 3], [['heavy-rain'], 3], [['overcast'], 3]] },

  // Overlaps
  { id: 'light-rain+wind', label: 'Rain + wind', group: 'Combinations', conditions: ['light-rain', 'wind'],
    temperature: 54, feelsLike: 46, humidity: 87, windSpeed: 26, rainChance: 75, dailySwing: 3,
    forecast: [[['light-rain', 'wind'], 5], [['light-rain'], 4], [['overcast'], 3]] },
  { id: 'snow+wind', label: 'Snow + wind', group: 'Combinations', conditions: ['snow', 'wind'],
    temperature: 25, feelsLike: 11, humidity: 86, windSpeed: 25, rainChance: 85, dailySwing: 3,
    forecast: [[['snow', 'wind'], 6], [['snow'], 4], [['overcast', 'wind'], 2]] },
  { id: 'thunderstorm+heavy-rain', label: 'Thunderstorm + heavy rain', group: 'Combinations', conditions: ['thunderstorm', 'heavy-rain'],
    temperature: 76, feelsLike: 79, humidity: 93, windSpeed: 22, rainChance: 95, dailySwing: 4,
    forecast: [[['thunderstorm', 'heavy-rain'], 3], [['heavy-rain'], 4], [['light-rain'], 3], [['overcast'], 2]] },
  { id: 'fog+extreme-cold', label: 'Fog + cold', group: 'Combinations', conditions: ['fog', 'extreme-cold'],
    temperature: 8, feelsLike: -2, humidity: 96, windSpeed: 4, rainChance: 5, dailySwing: 4,
    forecast: [[['fog', 'extreme-cold'], 5], [['extreme-cold'], 4], [['clear', 'extreme-cold'], 3]] },
  { id: 'clear+extreme-heat', label: 'Clear + heat', group: 'Combinations', conditions: ['clear', 'extreme-heat'],
    temperature: 101, feelsLike: 109, humidity: 38, windSpeed: 5, rainChance: 0, dailySwing: 10,
    forecast: [[['clear', 'extreme-heat'], 7], [['clear'], 5]] },
  { id: 'clear+wind', label: 'Clear + wind', group: 'Combinations', conditions: ['clear', 'wind'],
    temperature: 66, feelsLike: 61, humidity: 40, windSpeed: 24, rainChance: 0, dailySwing: 7,
    forecast: [[['clear', 'wind'], 6], [['clear'], 6]] },
  { id: 'overcast+light-rain', label: 'Overcast + light rain', group: 'Combinations', conditions: ['overcast', 'light-rain'],
    temperature: 57, feelsLike: 55, humidity: 86, windSpeed: 9, rainChance: 60, dailySwing: 3,
    forecast: [[['overcast', 'light-rain'], 5], [['overcast'], 4], [['partly-cloudy'], 3]] },
];

// Typical rain chance per condition, used for the hourly forecast.
export const HOURLY_RAIN_CHANCE: Record<ConditionId, number> = {
  'clear': 0,
  'partly-cloudy': 5,
  'overcast': 15,
  'light-rain': 65,
  'heavy-rain': 90,
  'thunderstorm': 85,
  'snow': 80,
  'sleet': 75,
  'fog': 10,
  'wind': 5,
  'extreme-heat': 0,
  'extreme-cold': 5,
  'severe-alert': 90,
};

export const DEFAULT_TEST_WEATHER = 'clear';

export function getTestWeatherOption(id: string): TestWeather {
  return TEST_WEATHER.find((option) => option.id === id) ?? TEST_WEATHER[0];
}

export function isTestWeatherId(id: string | null): id is string {
  return TEST_WEATHER.some((option) => option.id === id);
}
