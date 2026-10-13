import { useCallback, useEffect, useMemo, useState } from 'react';

import { TEST_WEATHER } from '@/constants/test-weather';
import { FALLBACK_PLACE, getPlace, type Place } from '@/services/location';
import { getDemoWeather } from '@/services/providers/demo';
import { getWeather, type LiveSource } from '@/services/weather';
import type { WeatherData } from '@/services/weather-data';

import { usePreferences } from './use-preferences';

export type WeatherState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; place: Place; weather: WeatherData };

const AUTO_CYCLE_MS = 8000;

// Developer mode always shows Bethlehem, without asking for location.
const DEV_PLACE: Place = { ...FALLBACK_PLACE, isFallback: false };

async function loadWeather(source: LiveSource): Promise<WeatherState> {
  try {
    const place = await getPlace();
    const weather = await getWeather(place, source);
    return { status: 'ready', place, weather };
  } catch (error) {
    console.warn('Failed to load weather', error);
    return { status: 'error' };
  }
}

// Live weather normally. In Developer mode: filler data for the chosen test
// weather (no API calls), or one forced live provider.
export function useWeather() {
  const { preferences, updatePreferences } = usePreferences();
  const { developerMode, devWeatherSource, testWeather, autoCycle } = preferences;
  const testMode = developerMode && devWeatherSource === 'test';
  const liveSource: LiveSource = developerMode && devWeatherSource !== 'test' ? devWeatherSource : 'auto';

  const [live, setLive] = useState<WeatherState>({ status: 'loading' });
  useEffect(() => {
    if (testMode) return;
    let cancelled = false;
    loadWeather(liveSource).then((next) => {
      if (!cancelled) setLive(next);
    });
    return () => {
      cancelled = true;
    };
  }, [testMode, liveSource]);

  // Built instantly, so switching test weather swaps the screen (and
  // crossfades the sound) without a loading state.
  const test = useMemo<WeatherState | null>(
    () =>
      testMode
        ? { status: 'ready', place: DEV_PLACE, weather: getDemoWeather(DEV_PLACE.name, testWeather, 'test') }
        : null,
    [testMode, testWeather],
  );

  // Auto-cycle: move to the next test weather every 8 seconds.
  useEffect(() => {
    if (!testMode || !autoCycle) return;
    const index = TEST_WEATHER.findIndex((option) => option.id === testWeather);
    const next = TEST_WEATHER[(index + 1) % TEST_WEATHER.length];
    const timer = setTimeout(() => updatePreferences({ testWeather: next.id }), AUTO_CYCLE_MS);
    return () => clearTimeout(timer);
  }, [testMode, autoCycle, testWeather, updatePreferences]);

  const reload = useCallback(() => {
    setLive({ status: 'loading' });
    loadWeather(liveSource).then(setLive);
  }, [liveSource]);

  return { state: test ?? live, reload, developerMode };
}
