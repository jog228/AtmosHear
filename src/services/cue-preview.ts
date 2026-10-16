import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { lightDuration } from '@/constants/light-cues';

import { alertSound } from './alert-sound';
import { ambientSound } from './ambient-sound';
import { hapticPlayer } from './haptics';
import { lightCue } from './light-cue';

// Two loops of a 4-second ambient sound.
const MIN_PREVIEW_MS = 8000;

type Listener = (playing: ConditionId | null) => void;

// Previews one condition's cues together: its sound (through the ambient
// player, which pauses the Weather loop and resumes it after), its
// vibration, and its light. One preview at a time; a new one replaces the
// old. Ends on its own once the longest cue is done.
class CuePreview {
  private playing: ConditionId | null = null;
  private timer?: ReturnType<typeof setTimeout>;
  private listeners = new Set<Listener>();

  play(id: ConditionId, { vibrate }: { vibrate: boolean }) {
    this.stop();
    const profile = conditionProfiles[id];
    this.playing = id;

    if (id === 'severe-alert') {
      // The alert has no loop: it previews its beeps (silencing the Weather
      // loop meanwhile), with its vibration unless Vibration is off.
      ambientSound.setPreview(id);
      alertSound.play(undefined, { vibrate });
    } else {
      ambientSound.setPreview(id);
      if (vibrate) hapticPlayer.play([profile.haptic]);
    }
    lightCue.play(profile.light);

    const hapticMs = Math.max(0, ...profile.haptic.map((tap) => tap.at));
    const ms = Math.max(MIN_PREVIEW_MS, lightDuration(profile.light), hapticMs);
    this.timer = setTimeout(() => this.stop(), ms);
    this.emit();
  }

  stop() {
    clearTimeout(this.timer);
    if (!this.playing) return;
    if (this.playing === 'severe-alert') alertSound.stop();
    else hapticPlayer.cancelConditionPattern();
    ambientSound.setPreview(null);
    lightCue.stop();
    this.playing = null;
    this.emit();
  }

  current() {
    return this.playing;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener(this.playing));
  }
}

export const cuePreview = new CuePreview();
