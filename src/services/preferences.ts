import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_CONTRAST_KEY = 'preferences.highContrast';

export async function loadHighContrast(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HIGH_CONTRAST_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveHighContrast(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
  } catch (error) {
    console.warn('Failed to save high contrast preference', error);
  }
}
