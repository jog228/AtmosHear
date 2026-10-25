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
// How long setToneGain takes to reach its new level.
const GAIN_RAMP_MS = 1000;
// Gives up if nobody answers.
const AUTO_STOP_MS = 10 * 60_000;
export const SNOOZE_MS = 9 * 60_000;
// A strong beat every second: three heavy taps close together, so it can
// be felt (and woken to) without hearing the tone.
const BUZZ = taps('heavy', [0, 100, 200]);
const BUZZ_EVERY_MS = 1000;

type Listener = (ring: Ring | null) => void;

// Why a ring ended: Stop, Snooze, or nobody answered for 10 minutes.
export type RingEndReason = 'stop' | 'snooze' | 'timeout';
type RingStartListener = (ring: Ring) => void;
type RingEndListener = (ring: Ring, reason: RingEndReason) => void;

// Rings alarms while the app is open: loops the tone at its toneVolume
// (even in Silent mode), fading in over 3 seconds, with a repeating
// vibration that ignores the weather Vibration setting. One ring at a time;
// the screen at /alarm-ringing shows it. Only runs in the foreground: a
// closed app can only ring through the backup notification.
//
// Other code can follow rings with onRingStart/onRingEnd and turn the tone
// down with setToneGain (the weather on wake does, from outside this
// folder). This file doesn't know who listens.
class AlarmRinger {
  private ring: Ring | null = null;
  private player: AudioPlayer | null = null;
  // The tone's volume is toneVolume × fade-in (0-1) × gain (0-1).
  private toneVolume = 1;
  private fadeLevel = 0;
  private gain = 1;
  private gainTimer?: ReturnType<typeof setInterval>;
  private startListeners = new Set<RingStartListener>();
  private endListeners = new Set<RingEndListener>();
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
    this.timers.push(
      setTimeout(() => {
        if (this.ring) this.end('timeout');
      }, AUTO_STOP_MS),
    );
    this.emit();
    this.startListeners.forEach((listener) => listener(ring));
    return true;
  }

  // Quiet for 9 minutes, then rings again (a backup notification covers a
  // phone that locks in the meantime).
  snooze() {
    const ring = this.ring;
    if (!ring) return;
    this.end('snooze');
    const again: Ring = { ...ring, at: Date.now() + SNOOZE_MS };
    this.snoozeTimer = setTimeout(() => {
      this.snoozeBackup?.cancel();
      this.start(again);
    }, SNOOZE_MS);
    this.snoozeBackup?.schedule(again);
  }

  stop() {
    if (!this.ring) return;
    this.end('stop');
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

  // Called each time a ring starts (a snoozed alarm coming back too).
  onRingStart(listener: RingStartListener) {
    this.startListeners.add(listener);
    return () => {
      this.startListeners.delete(listener);
    };
  }

  // Called when a ring ends, with why.
  onRingEnd(listener: RingEndListener) {
    this.endListeners.add(listener);
    return () => {
      this.endListeners.delete(listener);
    };
  }

  // Turns the ringing tone down (or back up) to `gain` (0-1) of its level,
  // smoothly, over about a second. Resets to 1 when the ring ends.
  setToneGain(gain: number) {
    if (!this.ring) return;
    clearInterval(this.gainTimer);
    const from = this.gain;
    const to = Math.min(1, Math.max(0, gain));
    const startedAt = Date.now();
    this.gainTimer = setInterval(() => {
      const t = Math.min(1, (Date.now() - startedAt) / GAIN_RAMP_MS);
      this.gain = from + (to - from) * t;
      this.applyVolume();
      if (t >= 1) clearInterval(this.gainTimer);
    }, FADE_STEP_MS);
  }

  private end(reason: RingEndReason) {
    const ring = this.ring;
    this.silence();
    this.ring = null;
    this.emit();
    if (ring) this.endListeners.forEach((listener) => listener(ring, reason));
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
    this.toneVolume = ALARM_TONES[tone].toneVolume;
    this.fadeLevel = 0;
    const startedAt = Date.now();
    const fade = setInterval(() => {
      this.fadeLevel = Math.min(1, (Date.now() - startedAt) / FADE_IN_MS);
      this.applyVolume();
      if (this.fadeLevel >= 1) clearInterval(fade);
    }, FADE_STEP_MS);
    this.intervals.push(fade);
  }

  private applyVolume() {
    if (this.player) this.player.volume = this.toneVolume * this.fadeLevel * this.gain;
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
    clearInterval(this.gainTimer);
    this.gain = 1;
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
