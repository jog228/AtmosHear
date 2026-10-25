import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDateString } from './time';
import type { WeatherData } from './weather-data';

// Bump the version if WeatherData changes shape, so old saves are ignored.
// v2: added uvIndex and snowToday. (airQuality is filled in from its own
// cache when a saved forecast is used.)
const CACHE_KEY = 'weather.cache.v2';
const HOUR_MS = 60 * 60 * 1000;

export async function saveCachedWeather(data: WeatherData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.log('Failed to save weather cache', error);
  }
}

// The last live forecast, marked as source 'cache', with hours that have
// already passed removed. Null if nothing usable was saved.
export async function loadCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as WeatherData;
    if (!data?.current || !Array.isArray(data.hourly)) return null;

    const now = Date.now();
    const today = localDateString();
    return {
      ...data,
      source: 'cache',
      hourly: data.hourly.filter((hour) => hour.time + HOUR_MS > now),
      // Days that have passed are dropped. Saves from before the 5-day
      // forecast have 3 days (or none, before the 3-day one); they show as
      // they are.
      daily: (data.daily ?? []).filter((day) => day.date >= today),
    };
  } catch {
    return null;
  }
}
