import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Whether first-run onboarding has been seen. It shows only on the first
// launch after install: once the flag is set it stays set through restarts
// and app updates (AsyncStorage keeps it; uninstalling deletes it). The
// only thing that clears it is Developer › Replay onboarding
// (resetOnboarding); nothing else may.
//
// Read once at launch (the root layout starts it), so the entry route can
// wait for it and send a first launch to /onboarding/welcome before any
// tab renders.

const KEY = 'onboarding.completed';

// Keys only an install that has already been used would have. Their
// presence without the flag means the app was installed before onboarding
// existed (and updated since), so it counts as seen. The launch check
// starts before anything is saved, so a fresh install has none of them.
const EXISTING_INSTALL_PREFIXES = [
  'preferences.',
  'openingPreferences',
  'alarms.list',
  'weather.cache',
  'airQuality.cache',
  'bedside.',
];

type Status = 'loading' | 'needed' | 'done';

let status: Status = 'loading';
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Status) {
  status = next;
  listeners.forEach((listener) => listener());
}

// Saving the flag, tried twice so a passing storage error doesn't bring
// onboarding back on the next launch.
async function saveFlag() {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    await AsyncStorage.setItem(KEY, 'true').catch(() => {});
  }
}

export function loadOnboardingStatus(): Promise<void> {
  loading ??= (async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (keys.includes(KEY)) return set('done');
      if (keys.some((key) => EXISTING_INSTALL_PREFIXES.some((prefix) => key.startsWith(prefix)))) {
        // Installed before onboarding existed: never show it on an update.
        await saveFlag();
        return set('done');
      }
      set('needed');
    } catch {
      // If storage can't be read, don't trap anyone in onboarding.
      set('done');
    }
  })();
  return loading;
}

export function useOnboardingStatus(): Status {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
  );
}

// Finishing or skipping. Resolves once the flag is saved, so leaving
// onboarding right after (or the app closing) can't lose it.
export async function markOnboardingCompleted() {
  set('done');
  await saveFlag();
}

// Developer › Replay onboarding: the only thing that clears the flag.
export function resetOnboarding() {
  set('needed');
  AsyncStorage.removeItem(KEY).catch(() => {});
}
