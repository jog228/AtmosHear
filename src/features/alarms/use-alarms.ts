import { useEffect, useMemo, useRef, useState } from 'react';

import { loadAlarms, saveAlarms } from './alarm-storage';
import { DEFAULT_LABEL, type Alarm, type AlarmDraft } from './alarm-types';

// The saved alarms, earliest first, plus actions that change them. Every
// change is saved right away, so alarms survive closing the app.
export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Don't save until the saved list has loaded, or it would be wiped.
  const ready = useRef(false);

  useEffect(() => {
    loadAlarms().then((saved) => {
      setAlarms(saved);
      setLoaded(true);
      ready.current = true;
    });
  }, []);

  const change = (update: (current: Alarm[]) => Alarm[]) => {
    if (!ready.current) return;
    setAlarms((current) => {
      const next = update(current);
      saveAlarms(next);
      return next;
    });
  };

  const sorted = useMemo(() => [...alarms].sort(compareAlarms), [alarms]);

  return {
    alarms: sorted,
    loaded,
    // New alarms start switched on.
    add: (draft: AlarmDraft) =>
      change((current) => [...current, { ...clean(draft), id: newId(), enabled: true, createdAt: Date.now() }]),
    // Saving an edit switches the alarm back on, like Apple's Clock.
    update: (id: string, draft: AlarmDraft) =>
      change((current) => current.map((alarm) => (alarm.id === id ? { ...alarm, ...clean(draft), enabled: true } : alarm))),
    toggle: (id: string, enabled: boolean) =>
      change((current) => current.map((alarm) => (alarm.id === id ? { ...alarm, enabled } : alarm))),
    remove: (id: string) => change((current) => current.filter((alarm) => alarm.id !== id)),
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
