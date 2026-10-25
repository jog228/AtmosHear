// What other features may use from the alarm feature (e.g. onboarding),
// so they never reach into its internals.
import { ALARM_TONES, DEFAULT_TONE, TONE_IDS, type AlarmTone } from './alarm-tones';
import { playToneSample, stopToneSample } from './tone-preview';

export type { AlarmTone };
export { DEFAULT_TONE, playToneSample, stopToneSample };

// The tones in the editor's order, with the names it shows.
export const TONE_CHOICES: { id: AlarmTone; label: string }[] = TONE_IDS.map((id) => ({ id, label: ALARM_TONES[id].label }));
