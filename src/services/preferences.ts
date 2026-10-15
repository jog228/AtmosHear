import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TEST_WEATHER, isTestWeatherId } from '@/constants/test-weather';

export type Appearance = 'system' | 'light' | 'dark';

export type TemperatureUnit = 'fahrenheit' | 'celsius';
// 'auto': the usual unit in the country you're in (src/hooks/use-temperature.ts).
export type TemperatureSetting = 'auto' | TemperatureUnit;

// Where Developer mode gets its weather: filler data, or one live provider.
export type DevWeatherSource = 'test' | 'open-meteo' | 'nws';

export type Preferences = {
  appearance: Appearance;
  temperatureUnit: TemperatureSetting;
  // Not a setting: the country of the last live location ("US"), kept so
  // 'auto' picks the right unit as soon as the app opens.
  locationCountry: string | null;
  highContrast: boolean;
  ambientSound: boolean;
  vibration: boolean;
  developerMode: boolean;
  devWeatherSource: DevWeatherSource;
  // An id from src/constants/test-weather.ts.
  testWeather: string;
  // Not saved: always off after a restart, so the app never starts cycling
  // on its own.
  autoCycle: boolean;
};

const KEYS: Partial<Record<keyof Preferences, string>> = {
  appearance: 'preferences.appearance',
  temperatureUnit: 'preferences.temperatureUnit',
  locationCountry: 'preferences.locationCountry',
  highContrast: 'preferences.highContrast',
  ambientSound: 'preferences.ambientSound',
  vibration: 'preferences.vibration',
  developerMode: 'preferences.developerMode',
  devWeatherSource: 'preferences.devWeatherSource',
  testWeather: 'preferences.testWeather',
};

const DEFAULTS: Preferences = {
  appearance: 'system',
  temperatureUnit: 'auto',
  locationCountry: null,
  highContrast: false,
  ambientSound: true,
  vibration: true,
  developerMode: false,
  devWeatherSource: 'test',
  testWeather: DEFAULT_TEST_WEATHER,
  autoCycle: false,
};

export async function loadPreferences(): Promise<Preferences> {
  try {
    const keys = Object.keys(KEYS) as (keyof Preferences)[];
    const pairs = await AsyncStorage.multiGet(keys.map((key) => KEYS[key]!));
    const saved = Object.fromEntries(keys.map((key, i) => [key, pairs[i][1]]));
    return {
      ...DEFAULTS,
      appearance: saved.appearance === 'light' || saved.appearance === 'dark' ? saved.appearance : DEFAULTS.appearance,
      temperatureUnit:
        saved.temperatureUnit === 'fahrenheit' || saved.temperatureUnit === 'celsius'
          ? saved.temperatureUnit
          : DEFAULTS.temperatureUnit,
      locationCountry: saved.locationCountry || null,
      highContrast: saved.highContrast === 'true',
      // On unless the user turned it off.
      ambientSound: saved.ambientSound !== 'false',
      vibration: saved.vibration !== 'false',
      developerMode: saved.developerMode === 'true',
      devWeatherSource:
        saved.devWeatherSource === 'open-meteo' || saved.devWeatherSource === 'nws'
          ? saved.devWeatherSource
          : DEFAULTS.devWeatherSource,
      testWeather: isTestWeatherId(saved.testWeather) ? saved.testWeather : DEFAULTS.testWeather,
    };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreferences(changes: Partial<Preferences>): Promise<void> {
  const entries = Object.entries(changes)
    .filter(([key]) => KEYS[key as keyof Preferences])
    .map(([key, value]) => [KEYS[key as keyof Preferences]!, String(value)] as [string, string]);
  if (entries.length === 0) return;
  try {
    await AsyncStorage.multiSet(entries);
  } catch (error) {
    console.warn('Failed to save preferences', error);
  }
}
