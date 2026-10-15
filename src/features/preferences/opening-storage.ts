import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_EVENING, DEFAULT_MORNING, isAm, type ClockTime } from './opening-time';

export type OpeningPreferences = {
  morning: ClockTime;
  evening: ClockTime;
  // Developer testing: a fake time of day for the opening logic only, or
  // null for the real time. Only used while Developer mode is on.
  simulatedTime: ClockTime | null;
  // For the Weather screen greeting ("Good morning, Jolie!"). Trimmed;
  // empty means no name.
  name: string;
};

export const NAME_MAX_LENGTH = 15;

const STORAGE_KEY = 'openingPreferences';

export const DEFAULT_OPENING_PREFERENCES: OpeningPreferences = {
  morning: DEFAULT_MORNING,
  evening: DEFAULT_EVENING,
  simulatedTime: null,
  name: '',
};

// Saved preferences, with defaults for anything missing or invalid (the
// morning time must be AM and the evening time PM).
export async function loadOpeningPreferences(): Promise<OpeningPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<OpeningPreferences>) : {};
    return {
      morning: isClockTime(saved.morning) && isAm(saved.morning) ? saved.morning : DEFAULT_MORNING,
      evening: isClockTime(saved.evening) && !isAm(saved.evening) ? saved.evening : DEFAULT_EVENING,
      simulatedTime: isClockTime(saved.simulatedTime) ? saved.simulatedTime : null,
      name: cleanName(saved.name),
    };
  } catch (error) {
    console.warn('Failed to load opening preferences', error);
    return DEFAULT_OPENING_PREFERENCES;
  }
}

export async function saveOpeningPreferences(preferences: OpeningPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save opening preferences', error);
  }
}

// Trims spaces and limits the length; anything else becomes no name.
export function cleanName(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, NAME_MAX_LENGTH).trim() : '';
}

function isClockTime(value: unknown): value is ClockTime {
  const time = value as ClockTime;
  return (
    typeof time === 'object' &&
    time !== null &&
    Number.isInteger(time.hour) &&
    Number.isInteger(time.minute) &&
    time.hour >= 0 &&
    time.hour < 24 &&
    time.minute >= 0 &&
    time.minute < 60
  );
}
