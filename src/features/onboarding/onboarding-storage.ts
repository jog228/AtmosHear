import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Whether first-run onboarding has been finished or skipped. Read once at
// launch (the root layout starts it), so the entry route can wait for it
// and send a first launch to /onboarding/welcome before any tab renders.

const KEY = 'onboarding.completed';

type Status = 'loading' | 'needed' | 'done';

let status: Status = 'loading';
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Status) {
  status = next;
  listeners.forEach((listener) => listener());
}

export function loadOnboardingStatus(): Promise<void> {
  loading ??= AsyncStorage.getItem(KEY)
    .then((value) => set(value ? 'done' : 'needed'))
    // If storage can't be read, don't trap anyone in onboarding.
    .catch(() => set('done'));
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

export function markOnboardingCompleted() {
  set('done');
  AsyncStorage.setItem(KEY, 'true').catch(() => {});
}

// Developer › Replay onboarding.
export function resetOnboarding() {
  set('needed');
  AsyncStorage.removeItem(KEY).catch(() => {});
}
