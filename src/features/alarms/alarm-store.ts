import { isExpired, nextOccurrence } from './alarm-schedule';
import { loadAlarms, saveAlarms } from './alarm-storage';
import type { Alarm } from './alarm-types';

type Listener = () => void;

// The saved alarms, shared by the Alarms tab, the ringer, and the
// notification scheduler. Every change is saved right away. Read it in
// components with useAlarms().
class AlarmStore {
  private alarms: Alarm[] = [];
  private loaded = false;
  private loading?: Promise<void>;
  private listeners = new Set<Listener>();

  load() {
    this.loading ??= loadAlarms().then((saved) => {
      // One-time alarms saved before onceAt existed get their next time.
      const now = Date.now();
      this.alarms = saved.map((alarm) => withOnceAt(alarm, now, false));
      this.loaded = true;
      this.expireOnce(now);
      this.emit();
    });
    return this.loading;
  }

  list() {
    return this.alarms;
  }

  isLoaded() {
    return this.loaded;
  }

  find(id: string) {
    return this.alarms.find((alarm) => alarm.id === id);
  }

  // Doesn't save until the saved list has loaded, or it would be wiped.
  change(update: (current: Alarm[]) => Alarm[]) {
    if (!this.loaded) return;
    this.alarms = update(this.alarms);
    saveAlarms(this.alarms);
    this.emit();
  }

  // Switches off one-time alarms whose minute has passed.
  expireOnce(now: number) {
    if (!this.alarms.some((alarm) => isExpired(alarm, now))) return;
    this.change((current) => current.map((alarm) => (isExpired(alarm, now) ? { ...alarm, enabled: false } : alarm)));
  }

  // A one-time alarm turns off once it rings; repeating ones stay on.
  rang(id: string) {
    this.change((current) =>
      current.map((alarm) => (alarm.id === id && alarm.repeatDays.length === 0 ? { ...alarm, enabled: false } : alarm)),
    );
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

// A one-time alarm that's on gets the next time its clock time comes
// round (`reset`: even if it has one already, e.g. it was just switched
// on). Repeating alarms don't use onceAt.
export function withOnceAt(alarm: Alarm, now: number, reset = true): Alarm {
  if (alarm.repeatDays.length > 0 || !alarm.enabled) return { ...alarm, onceAt: undefined };
  if (!reset && alarm.onceAt !== undefined) return alarm;
  return { ...alarm, onceAt: nextOccurrence(alarm.hour, alarm.minute, now) };
}

export const alarmStore = new AlarmStore();
