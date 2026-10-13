import AsyncStorage from '@react-native-async-storage/async-storage';

export type Appearance = 'system' | 'light' | 'dark';

export type Preferences = {
  appearance: Appearance;
  highContrast: boolean;
};

const APPEARANCE_KEY = 'preferences.appearance';
const HIGH_CONTRAST_KEY = 'preferences.highContrast';

export async function loadPreferences(): Promise<Preferences> {
  try {
    const [appearance, highContrast] = await Promise.all([
      AsyncStorage.getItem(APPEARANCE_KEY),
      AsyncStorage.getItem(HIGH_CONTRAST_KEY),
    ]);
    return {
      appearance: appearance === 'light' || appearance === 'dark' ? appearance : 'system',
      highContrast: highContrast === 'true',
    };
  } catch {
    return { appearance: 'system', highContrast: false };
  }
}

export async function saveAppearance(appearance: Appearance): Promise<void> {
  await save(APPEARANCE_KEY, appearance);
}

export async function saveHighContrast(enabled: boolean): Promise<void> {
  await save(HIGH_CONTRAST_KEY, String(enabled));
}

async function save(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to save ${key}`, error);
  }
}
