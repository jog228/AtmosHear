import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { alarmStore, withOnceAt } from './alarm-store';
import { DEFAULT_LABEL, type Alarm, type AlarmDraft } from './alarm-types';

// The saved alarms, earliest first, plus actions that change them. Shared
// through alarmStore, so every screen (and the ringer) sees the same list.
export function useAlarms() {
  const alarms = useSyncExternalStore(
    (listener) => alarmStore.subscribe(listener),
    () => alarmStore.list(),
  );
  const loaded = useSyncExternalStore(
    (listener) => alarmStore.subscribe(listener),
    () => alarmStore.isLoaded(),
  );
  useEffect(() => {
    alarmStore.load();
  }, []);

  const sorted = useMemo(() => [...alarms].sort(compareAlarms), [alarms]);

  return {
    alarms: sorted,
    loaded,
    // New alarms start switched on.
    add: (draft: AlarmDraft) =>
      alarmStore.change((current) => [
        ...current,
        withOnceAt({ ...clean(draft), id: newId(), enabled: true, createdAt: Date.now() }, Date.now()),
      ]),
    // Saving an edit switches the alarm back on, like Apple's Clock.
    update: (id: string, draft: AlarmDraft) =>
      alarmStore.change((current) =>
        current.map((alarm) => (alarm.id === id ? withOnceAt({ ...alarm, ...clean(draft), enabled: true }, Date.now()) : alarm)),
      ),
    toggle: (id: string, enabled: boolean) =>
      alarmStore.change((current) =>
        current.map((alarm) => (alarm.id === id ? withOnceAt({ ...alarm, enabled }, Date.now()) : alarm)),
      ),
    remove: (id: string) => alarmStore.change((current) => current.filter((alarm) => alarm.id !== id)),
    // Another alarm with the same time and repeat days, if there is one.
    findDuplicate: (draft: AlarmDraft, ignoreId?: string) =>
      alarms.find(
        (alarm) =>
          alarm.id !== ignoreId &&
          alarm.hour === draft.hour &&
          alarm.minute === draft.minute &&
          sameDays(alarm.repeatDays, draft.repeatDays),
      ),
  };
}

// Earliest time of day first; alarms at the same time in the order added.
function compareAlarms(a: Alarm, b: Alarm) {
  return a.hour * 60 + a.minute - (b.hour * 60 + b.minute) || a.createdAt - b.createdAt;
}

function clean(draft: AlarmDraft): AlarmDraft {
  return {
    hour: draft.hour,
    minute: draft.minute,
    repeatDays: [...new Set(draft.repeatDays)].sort((a, b) => a - b),
    label: draft.label.trim() || DEFAULT_LABEL,
    tone: draft.tone,
  };
}

function sameDays(a: number[], b: number[]) {
  const setA = new Set(a);
  const setB = new Set(b);
  return setA.size === setB.size && [...setA].every((day) => setB.has(day));
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
