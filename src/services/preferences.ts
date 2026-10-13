import AsyncStorage from '@react-native-async-storage/async-storage';

export type Appearance = 'system' | 'light' | 'dark';

export type Preferences = {
  appearance: Appearance;
  highContrast: boolean;
  ambientSound: boolean;
};

const KEYS: Record<keyof Preferences, string> = {
  appearance: 'preferences.appearance',
  highContrast: 'preferences.highContrast',
  ambientSound: 'preferences.ambientSound',
};

const DEFAULTS: Preferences = {
  appearance: 'system',
  highContrast: false,
  ambientSound: true,
};

export async function loadPreferences(): Promise<Preferences> {
  try {
    const [appearance, highContrast, ambientSound] = await Promise.all([
      AsyncStorage.getItem(KEYS.appearance),
      AsyncStorage.getItem(KEYS.highContrast),
      AsyncStorage.getItem(KEYS.ambientSound),
    ]);
    return {
      appearance: appearance === 'light' || appearance === 'dark' ? appearance : DEFAULTS.appearance,
      highContrast: highContrast === 'true',
      // On unless the user turned it off.
      ambientSound: ambientSound !== 'false',
    };
  } catch {
    return DEFAULTS;
  }
}

export async function savePreferences(changes: Partial<Preferences>): Promise<void> {
  try {
    await AsyncStorage.multiSet(
      Object.entries(changes).map(([key, value]) => [KEYS[key as keyof Preferences], String(value)]),
    );
  } catch (error) {
    console.warn('Failed to save preferences', error);
  }
}
