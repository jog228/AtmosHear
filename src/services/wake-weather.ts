import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { alarmRinger } from '@/features/alarms/alarm-ringer';
import { ALARM_TONES, type AlarmTone } from '@/features/alarms/alarm-tones';

import { alertSound } from './alert-sound';
import { ambientSound, layerVolumes, WAKE_VOLUME } from './ambient-sound';
import { cuePreview } from './cue-preview';
import { loadLatestWeather, weatherNow } from './latest-weather';
import type { Preferences } from './preferences';

// Balancing the alarm tone against the weather under it. Tune after
// hearing it on the phone.
// The tone may be at most this much louder than the weather (LU). A louder
// tone is turned down until it's exactly this much louder.
export const WAKE_MAX_GAP_LU = 10;
// ...but never below this share of its level, so the alarm can still wake
// someone. Under very quiet weather the gap stays a bit over 10 LU.
export const WAKE_MIN_TONE_GAIN = 0.35;

// The weather comes in a moment after the tone starts.
const START_DELAY_MS = 500;
// After Stop, the weather keeps playing on its own, then fades out.
const AFTER_STOP_HOLD_MS = 10_000;
const AFTER_STOP_FADE_MS = 3000;
// After Snooze or the 10-minute timeout, it fades out with the tone.
const WITH_TONE_FADE_MS = 1000;

// The weather on wake: while an alarm rings, the current weather's ambient
// loops play under the tone (sound only: no condition vibrations or light
// cues, so the alarm's buzz stays the only vibration). Alarm code fires
// the ring events and exposes setToneGain; it never imports this file.
// Call once (the root layout does); returns a function that stops it.
export function registerWakeWeather(getPreferences: () => Preferences) {
  // Bumped by every ring event, so a slow cache read from an earlier ring
  // never starts the weather for a later one.
  let session = 0;
  let waking = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const endWake = (fadeMs: number) => {
    waking = false;
    ambientSound.setWake(null, { fadeMs });
  };

  const offStart = alarmRinger.onRingStart(async (ring) => {
    const id = ++session;
    clearTimeout(timer);
    // Nothing else plays cues while an alarm rings.
    cuePreview.stop();
    alertSound.stop();
    const conditions = playable(await currentConditions(getPreferences()));
    if (id !== session) return;
    // No weather: the alarm rings normally, at full tone.
    if (conditions.length === 0) {
      if (waking) endWake(WITH_TONE_FADE_MS);
      return;
    }
    alarmRinger.setToneGain(toneGain(ring.tone, conditions));
    timer = setTimeout(() => {
      waking = true;
      ambientSound.setWake(conditions);
    }, START_DELAY_MS);
  });

  const offEnd = alarmRinger.onRingEnd((_ring, reason) => {
    session++;
    clearTimeout(timer);
    if (!waking) return;
    if (reason === 'stop') timer = setTimeout(() => endWake(AFTER_STOP_FADE_MS), AFTER_STOP_HOLD_MS);
    else endWake(WITH_TONE_FADE_MS);
  });

  return () => {
    offStart();
    offEnd();
    clearTimeout(timer);
    if (waking) endWake(0);
  };
}

// The weather to wake to, from what's already loaded so it starts at once
// (src/services/latest-weather.ts). None without saved or test weather.
async function currentConditions(preferences: Preferences): Promise<ConditionId[]> {
  const weather = await loadLatestWeather(preferences);
  return weather ? weatherNow(weather).conditions : [];
}

// The conditions with a loop. A severe alert's conditions play, but not its
// beeps. (The ringing screen names these as "Playing the … sound".)
export function playable(conditions: ConditionId[]): ConditionId[] {
  return conditions.filter((id) => id !== 'severe-alert' && conditionProfiles[id].sound);
}

// The tone gain that keeps the weather audible: compares the weather's
// loudest layer (its file's loudness at its layer volume) with the tone's
// level (its loudness at its toneVolume).
export function toneGain(tone: AlarmTone, conditions: ConditionId[]): number {
  const weather = Math.max(
    ...layerVolumes(conditions, WAKE_VOLUME).map(
      ({ id, volume }) => (conditionProfiles[id].lufs ?? -Infinity) + 20 * Math.log10(volume),
    ),
  );
  if (!Number.isFinite(weather)) return 1;
  const { lufs, toneVolume } = ALARM_TONES[tone];
  const excess = lufs + 20 * Math.log10(toneVolume) - weather - WAKE_MAX_GAP_LU;
  if (excess <= 0) return 1;
  return Math.max(WAKE_MIN_TONE_GAIN, 10 ** (-excess / 20));
}
