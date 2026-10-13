import { simulateOutage } from '@/constants/debug';

import type { Place } from './location';
import { getDemoWeather } from './providers/demo';
import { fetchNws } from './providers/nws';
import { fetchOpenMeteo } from './providers/open-meteo';
import { loadCachedWeather, saveCachedWeather } from './weather-cache';
import type { WeatherData } from './weather-data';

const liveProviders = [
  { name: 'Open-Meteo', fetch: fetchOpenMeteo, simulateOutage: simulateOutage.openMeteo },
  { name: 'NWS', fetch: fetchNws, simulateOutage: simulateOutage.nws },
];

// Fallback order: Open-Meteo → NWS → last saved forecast → demo data.
// Always resolves, so the app always has something to show and play.
export async function getWeather(place: Place): Promise<WeatherData> {
  for (const provider of liveProviders) {
    try {
      if (__DEV__ && provider.simulateOutage) throw new Error('Simulated outage');
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
