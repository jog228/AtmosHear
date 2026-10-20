import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TONE, isAlarmTone } from './alarm-tones';
import type { Alarm } from './alarm-types';

const STORAGE_KEY = 'alarms.list';

// Saved alarms, or an empty list if there are none (or the saved data is
// unreadable). Anything that doesn't look like an alarm is dropped. Alarms
// saved by older versions get the fields added since (a tone).
export async function loadAlarms(): Promise<Alarm[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAlarm).map(upgrade) : [];
  } catch (error) {
    console.warn('Failed to load alarms', error);
    return [];
  }
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.warn('Failed to save alarms', error);
  }
}

function upgrade(alarm: Alarm): Alarm {
  return {
    ...alarm,
    tone: isAlarmTone(alarm.tone) ? alarm.tone : DEFAULT_TONE,
    onceAt: typeof alarm.onceAt === 'number' ? alarm.onceAt : undefined,
  };
}

// The fields every version has saved (tone and onceAt came later).
function isAlarm(value: unknown): value is Alarm {
  const alarm = value as Alarm;
  return (
    typeof alarm === 'object' &&
    alarm !== null &&
    typeof alarm.id === 'string' &&
    Number.isInteger(alarm.hour) &&
    Number.isInteger(alarm.minute) &&
    typeof alarm.enabled === 'boolean' &&
    Array.isArray(alarm.repeatDays) &&
    typeof alarm.label === 'string' &&
    typeof alarm.createdAt === 'number'
  );
}
