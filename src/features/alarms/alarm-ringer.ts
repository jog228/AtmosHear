import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { taps } from '@/constants/haptics';
import { hapticPlayer } from '@/services/haptics';

import { ringKey } from './alarm-schedule';
import { alarmStore } from './alarm-store';
import { ALARM_TONES, type AlarmTone } from './alarm-tones';

// What's ringing: a saved alarm (or a snoozed one coming back), or the
// Developer "Test alarm now" (no id).
export type Ring = {
  alarmId: string | null;
  label: string;
  tone: AlarmTone;
  // When it was meant to ring (ms since 1970), for the time on screen.
  at: number;
};

const FADE_IN_MS = 3000;
const FADE_STEP_MS = 100;
// Gives up if nobody answers.
const AUTO_STOP_MS = 10 * 60_000;
export const SNOOZE_MS = 9 * 60_000;
// A strong beat every second: three heavy taps close together, so it can
// be felt (and woken to) without hearing the tone.
const BUZZ = taps('heavy', [0, 100, 200]);
const BUZZ_EVERY_MS = 1000;

type Listener = (ring: Ring | null) => void;

// Rings alarms while the app is open: loops the tone at full volume (even
// in Silent mode), fading in over 3 seconds, with a repeating vibration
// that ignores the weather Vibration setting. One ring at a time; the
// screen at /alarm-ringing shows it. Only runs in the foreground: a closed
// app can only ring through the backup notification.
class AlarmRinger {
  private ring: Ring | null = null;
  private player: AudioPlayer | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private snoozeTimer?: ReturnType<typeof setTimeout>;
  // Rings already started, so the in-app check and a notification don't
  // both start the same one.
  private started = new Set<string>();
  private listeners = new Set<Listener>();
  // Set by the notification code: schedules and cancels the snooze's
  // backup notification (kept out of here so this file works without it).
  snoozeBackup?: { schedule: (ring: Ring) => void; cancel: () => void };

  current() {
    return this.ring;
  }

  // Starts ringing, unless this exact ring (alarm + minute) already
  // started. Returns false if it was skipped.
  start(ring: Ring): boolean {
    if (ring.alarmId) {
      const key = ringKey(ring.alarmId, ring.at);
      if (this.started.has(key)) return false;
      this.started.add(key);
      // A one-time alarm switches off as soon as it rings.
      alarmStore.rang(ring.alarmId);
    }
    this.silence();
    this.cancelSnooze();
    this.ring = ring;
    this.playTone(ring.tone);
    this.buzz();
    this.timers.push(setTimeout(() => this.stop(), AUTO_STOP_MS));
    this.emit();
    return true;
  }

  // Quiet for 9 minutes, then rings again (a backup notification covers a
  // phone that locks in the meantime).
  snooze() {
    const ring = this.ring;
    if (!ring) return;
    this.end();
    const again: Ring = { ...ring, at: Date.now() + SNOOZE_MS };
    this.snoozeTimer = setTimeout(() => {
      this.snoozeBackup?.cancel();
      this.start(again);
    }, SNOOZE_MS);
    this.snoozeBackup?.schedule(again);
  }

  stop() {
    if (!this.ring) return;
    this.end();
    // NEXT PHASE (weather overlay): this is where waking up continues.
    // After Stop, the plan is to fade the current weather's ambient sound
    // in over the last of the alarm (or right after it), so you hear the
    // weather before you look at it. Build it as an onWake(ring) callback
    // registered from outside src/features/alarms/ (alarm code must not
    // import weather code), called here. Not built yet.
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private end() {
    this.silence();
    this.ring = null;
    this.emit();
  }

  private cancelSnooze() {
    clearTimeout(this.snoozeTimer);
    this.snoozeTimer = undefined;
    this.snoozeBackup?.cancel();
  }

  private playTone(tone: AlarmTone) {
    // Plays even with the ring/silent switch on silent. Set here too, since
    // a night launch on the Alarms tab never starts the weather sound
    // (which sets the same mode).
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const player = createAudioPlayer(ALARM_TONES[tone].source);
    player.loop = true;
    player.volume = 0;
    player.play();
    this.player = player;
    const startedAt = Date.now();
    const fade = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / FADE_IN_MS);
      player.volume = t;
      if (t >= 1) clearInterval(fade);
    }, FADE_STEP_MS);
    this.intervals.push(fade);
  }

  private buzz() {
    // `alert: true`: like a severe alert's taps, weather patterns can't cut
    // these off.
    const beat = () => hapticPlayer.play([BUZZ], { alert: true });
    beat();
    this.intervals.push(setInterval(beat, BUZZ_EVERY_MS));
  }

  private silence() {
    this.timers.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
    this.timers = [];
    this.intervals = [];
    hapticPlayer.cancel();
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
    }
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.ring));
  }
}

export const alarmRinger = new AlarmRinger();
