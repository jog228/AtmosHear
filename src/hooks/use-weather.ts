import { useCallback, useEffect, useState } from 'react';

import { demoConditions, forceDemo } from '@/constants/debug';
import { getPlace, type Place } from '@/services/location';
import { getWeather } from '@/services/weather';
import type { WeatherData } from '@/services/weather-data';

export type WeatherState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; place: Place; weather: WeatherData };

async function loadWeather(): Promise<WeatherState> {
  try {
    const place = await getPlace();
    const weather = await getWeather(place);
    return { status: 'ready', place, weather };
  } catch (error) {
    console.warn('Failed to load weather', error);
    return { status: 'error' };
  }
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({ status: 'loading' });
  // In development, saving a change to constants/debug.ts refetches without
  // a full reload, keeping the old weather on screen until the new arrives,
  // so you can hear sounds crossfade between demo conditions.
  const debugKey = __DEV__ ? JSON.stringify({ forceDemo, demoConditions }) : '';

  useEffect(() => {
    let cancelled = false;
    loadWeather().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [debugKey]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    loadWeather().then(setState);
  }, []);

  return { state, reload };
}
