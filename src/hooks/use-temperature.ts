import { getLocales } from 'expo-localization';

import { unitForCountry } from '@/constants/temperature-units';
import type { TemperatureUnit } from '@/services/preferences';

import { usePreferences } from './use-preferences';

// Weather data is always in °F; this converts for display in the unit
// chosen in Preferences. On Auto (the default), that's the usual unit in the
// country of your last live location, or your phone region's before the
// first one. `value(72)` -> 72 or 22.
export function useTemperature() {
  const { temperatureUnit, locationCountry } = usePreferences().preferences;
  const unit = temperatureUnit === 'auto' ? automaticUnit(locationCountry) : temperatureUnit;
  return {
    unit,
    value: (fahrenheit: number) => convert(fahrenheit, unit),
    // "F" or "C", for "72°F".
    letter: unit === 'celsius' ? 'C' : 'F',
    // For VoiceOver: "72 degrees Fahrenheit".
    name: unit === 'celsius' ? 'Celsius' : 'Fahrenheit',
  };
}

function automaticUnit(country: string | null): TemperatureUnit {
  if (country) return unitForCountry(country);
  return getLocales()[0]?.temperatureUnit ?? 'fahrenheit';
}

function convert(fahrenheit: number, unit: TemperatureUnit): number {
  // `+ 0` turns -0 into 0, so it never shows "-0°".
  return unit === 'celsius' ? Math.round(((fahrenheit - 32) * 5) / 9) + 0 : fahrenheit;
}
