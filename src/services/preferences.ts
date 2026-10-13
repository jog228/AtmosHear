import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TEST_WEATHER, isTestWeatherId } from '@/constants/test-weather';

export type Appearance = 'system' | 'light' | 'dark';

// Where Developer mode gets its weather: filler data, or one live provider.
export type DevWeatherSource = 'test' | 'open-meteo' | 'nws';

export type Preferences = {
  appearance: Appearance;
  highContrast: boolean;
  ambientSound: boolean;
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
  highContrast: 'preferences.highContrast',
  ambientSound: 'preferences.ambientSound',
  developerMode: 'preferences.developerMode',
  devWeatherSource: 'preferences.devWeatherSource',
  testWeather: 'preferences.testWeather',
};

const DEFAULTS: Preferences = {
  appearance: 'system',
  highContrast: false,
  ambientSound: true,
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
      highContrast: saved.highContrast === 'true',
      // On unless the user turned it off.
      ambientSound: saved.ambientSound !== 'false',
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
