import type { Place } from './location';
import { getDemoWeather } from './providers/demo';
import { fetchNws } from './providers/nws';
import { fetchOpenMeteo } from './providers/open-meteo';
import { loadCachedWeather, saveCachedWeather } from './weather-cache';
import type { WeatherData } from './weather-data';

// 'auto' is the normal fallback chain. Developer mode can force one live
// provider instead, to test it on its own.
export type LiveSource = 'auto' | 'open-meteo' | 'nws';

const liveProviders = [
  { source: 'open-meteo', name: 'Open-Meteo', fetch: fetchOpenMeteo },
  { source: 'nws', name: 'NWS', fetch: fetchNws },
] as const;

// Fallback order: Open-Meteo → NWS → last saved forecast → demo data.
// Always resolves, so the app always has something to show and play.
// A forced provider has no fallback: if it fails, the error shows.
export async function getWeather(place: Place, source: LiveSource = 'auto'): Promise<WeatherData> {
  if (source !== 'auto') {
    const provider = liveProviders.find((p) => p.source === source)!;
    const data = await provider.fetch(place);
    saveCachedWeather(data);
    return data;
  }

  for (const provider of liveProviders) {
    try {
      const data = await provider.fetch(place);
      saveCachedWeather(data);
      return data;
    } catch (error) {
      console.log(`${provider.name} unavailable, trying the next source`, error);
    }
  }

  const cached = await loadCachedWeather();
  if (cached) return cached;

  return getDemoWeather(place.name);
}
