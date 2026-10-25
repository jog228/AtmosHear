import { useCalendars } from 'expo-localization';
import { useEffect, useState } from 'react';

import { BedsideWeatherColumn } from '@/components/bedside-weather-column';
import { describeConditions } from '@/constants/condition-profiles';
import { useBedsideOpen } from '@/features/alarms/bedside-screen';
import type { BedsideSky, BedsideSlots } from '@/features/alarms/bedside-slots';
import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';
import { loadLatestWeather, weatherNow } from '@/services/latest-weather';
import { FALLBACK_PLACE, lastKnownCoordinates } from '@/services/location';
import { formatDuration, formatTimeOfDay, sunSpan } from '@/services/sun-times';
import type { WeatherData } from '@/services/weather-data';

import { usePreferences } from './use-preferences';
import { useTemperature } from './use-temperature';

type Loaded = { weather: WeatherData | null; latitude: number; longitude: number };

// Fills bedside mode's slots (src/features/alarms/bedside-slots.tsx) from
// the weather side: the weather column and the sunset/sunrise dome, from
// the weather already on hand (test weather or the last saved forecast)
// and the phone's last known position, so it works offline. Loads only
// while bedside mode is open. Without weather, the slots stay empty: no
// weather column, and a plain arc without sunrise or sunset.
export function useBedsideWeather(): BedsideSlots {
  const open = useBedsideOpen();
  const { preferences } = usePreferences();
  const temperature = useTemperature();
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  // Developer › Simulate time (only set while Developer mode is on).
  const { simulatedTime, now: openingNow } = useOpeningPreferences();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Developer test weather is Bethlehem's, like the Weather tab.
    const testMode = preferences.developerMode && preferences.devWeatherSource === 'test';
    Promise.all([loadLatestWeather(preferences), testMode ? FALLBACK_PLACE : lastKnownCoordinates()]).then(
      ([weather, { latitude, longitude }]) => {
        if (!cancelled) setLoaded({ weather, latitude, longitude });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [open, preferences]);

  const weather = open ? loaded?.weather : null;
  // Always filled, with or without weather.
  const always = {
    debug: preferences.developerMode,
    appearance: preferences.bedsideAppearance,
    now: (real: number) => (simulatedTime ? openingNow().getTime() : real),
  };
  if (!loaded || !weather) return { renderWeatherColumn: null, weatherSpoken: null, sky: null, ...always };

  const current = weatherNow(weather);
  const condition = describeConditions(current.conditions);
  const degrees = (fahrenheit: number) => `${temperature.value(fahrenheit)}°`;
  const today = weather.daily[0];
  const feelsLike = current.feelsLike === null ? null : temperature.value(current.feelsLike);

  const sky = (now: number): BedsideSky | null => {
    const span = sunSpan(now, weather.sun, loaded.latitude, loaded.longitude);
    if (!span) return null;
    const time = (ms: number) => formatTimeOfDay(ms, uses24Hour);
    const night = span.kind === 'night';
    const until = formatDuration(span.end - now);
    const toward = night ? 'sunrise' : 'sunset';
    return {
      ...span,
      startLabel: night ? `Sunset ${time(span.start)}` : `Sunrise ${time(span.start)}`,
      endLabel: night ? `Sunrise ${time(span.end)}` : `Sunset ${time(span.end)}`,
      untilText: `${until.short} until ${toward}`,
      untilSpoken: `${until.spoken} until ${toward}`,
    };
  };

  return {
    renderWeatherColumn: (scale, colors) => (
      <BedsideWeatherColumn
        scale={scale}
        colors={colors}
        conditions={current.conditions}
        temperature={degrees(current.temperature)}
        condition={condition}
        feelsLike={feelsLike === null ? null : `Feels like ${feelsLike}°`}
        highLow={today ? `High ${degrees(today.high)} · Low ${degrees(today.low)}` : null}
      />
    ),
    weatherSpoken: [
      `${temperature.value(current.temperature)} degrees`,
      condition.toLowerCase(),
      feelsLike === null ? null : `feels like ${feelsLike}`,
    ]
      .filter(Boolean)
      .join(', '),
    sky,
    ...always,
  };
}
