import { getAirQuality, loadCachedAirQuality } from './air-quality';
import type { Place } from './location';
import { getDemoWeather } from './providers/demo';
import { fetchNws } from './providers/nws';
import { fetchOpenMeteo } from './providers/open-meteo';
import { loadCachedWeather, saveCachedWeather } from './weather-cache';
import type { ProviderWeather, WeatherData } from './weather-data';

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
// Air quality loads at the same time, whichever source answers; if it
// fails, the weather still shows (with a dash on the air quality card).
export async function getWeather(place: Place, source: LiveSource = 'auto'): Promise<WeatherData> {
  const airQuality = getAirQuality(place);
  const withAirQuality = async (data: ProviderWeather): Promise<WeatherData> => {
    const full = { ...data, airQuality: await airQuality };
    saveCachedWeather(full);
    return full;
  };

  if (source !== 'auto') {
    const provider = liveProviders.find((p) => p.source === source)!;
    return withAirQuality(await provider.fetch(place));
  }

  for (const provider of liveProviders) {
    try {
      return await withAirQuality(await provider.fetch(place));
    } catch (error) {
      console.log(`${provider.name} unavailable, trying the next source`, error);
    }
  }

  // Offline: the saved forecast, with the last air quality that loaded.
  const cached = await loadCachedWeather();
  if (cached) return { ...cached, airQuality: (await airQuality) ?? (await loadCachedAirQuality()) };

  return getDemoWeather(place.name);
}
