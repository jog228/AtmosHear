import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WeatherData } from './weather-data';

// Bump the version if WeatherData changes shape, so old saves are ignored.
// v2: added uvIndex and snowToday.
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
    return {
      ...data,
      source: 'cache',
      hourly: data.hourly.filter((hour) => hour.time + HOUR_MS > now),
    };
  } catch {
    return null;
  }
}
