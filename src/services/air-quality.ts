import AsyncStorage from '@react-native-async-storage/async-storage';

import { aqiLevel } from '@/constants/air-quality';

import { fetchJson } from './http';
import type { Place } from './location';
import type { AirQuality } from './weather-data';

type AirQualityResponse = {
  current: { us_aqi?: number | null };
};

const CACHE_KEY = 'airQuality.cache.v1';
// Shorter than the weather timeout: air quality loads alongside the weather,
// so a slow response shouldn't hold up the screen.
const TIMEOUT_MS = 5_000;

// Current US AQI from the Open-Meteo Air Quality API (free, no key). Kept
// separate from the weather providers, so it works whichever one is active.
// Never throws: null when unavailable, and the card shows a dash.
export async function getAirQuality(place: Place): Promise<AirQuality | null> {
  try {
    const params = [
      `latitude=${place.latitude}`,
      `longitude=${place.longitude}`,
      'current=us_aqi',
      'timezone=auto',
    ].join('&');
    const { current } = await fetchJson<AirQualityResponse>(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
      { timeoutMs: TIMEOUT_MS },
    );
    const value = current?.us_aqi;
    if (value === null || value === undefined || Number.isNaN(value)) throw new Error('No US AQI in response');
    const aqi = Math.round(value);
    const airQuality: AirQuality = { aqi, level: aqiLevel(aqi) };
    saveCachedAirQuality(airQuality);
    return airQuality;
  } catch (error) {
    console.log('Air quality unavailable', error);
    return null;
  }
}

// The last value that loaded, to go with a saved (cached) forecast.
export async function loadCachedAirQuality(): Promise<AirQuality | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AirQuality;
    return typeof data?.aqi === 'number' ? { aqi: data.aqi, level: aqiLevel(data.aqi) } : null;
  } catch {
    return null;
  }
}

async function saveCachedAirQuality(airQuality: AirQuality): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(airQuality));
  } catch (error) {
    console.log('Failed to save air quality cache', error);
  }
}
