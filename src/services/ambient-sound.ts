import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';

// Volumes (0-1) and fade lengths. Tune these freely.
export const AMBIENT_VOLUME = 0.6;
// Quieter while VoiceOver/TalkBack is on, so it doesn't compete with speech.
export const AMBIENT_VOLUME_SCREEN_READER = 0.3;
const FADE_IN_MS = 1500; // launch, returning to the app, turning sound on
const CROSSFADE_MS = 1000; // condition changes
const TURN_OFF_MS = 300; // Settings toggle off
const VOLUME_CHANGE_MS = 500; // screen reader turned on/off

export type AmbientState = {
  // Conditions to play, most significant first. Each one with a sound
  // becomes a looping layer, so rain + wind can play together later.
  conditions: ConditionId[];
  enabled: boolean;
  foreground: boolean;
  volume: number;
};

type Layer = {
  player: AudioPlayer;
  fadeTimer?: ReturnType<typeof setInterval>;
};

// Plays each condition's looping ambient sound, fading layers in and out as
// the conditions, settings, and app state change.
class AmbientSound {
  private layers = new Map<ConditionId, Layer>();

  // Silent switch mutes the app; other apps' music keeps playing alongside.
  async configure() {
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
    });
  }

  update({ conditions, enabled, foreground, volume }: AmbientState) {
    const wanted = enabled && foreground ? conditions.filter((id) => conditionProfiles[id].sound) : [];
    let crossfading = false;

    // Fade out layers that should stop. Pause right away when the app goes
    // to the background (timers don't run there).
    for (const [id, layer] of this.layers) {
      if (wanted.includes(id)) continue;
      const conditionEnded = !conditions.includes(id);
      if (conditionEnded && foreground && enabled) crossfading = true;
      const fadeMs = !foreground ? 0 : !enabled ? TURN_OFF_MS : CROSSFADE_MS;
      this.fade(layer, 0, fadeMs, () => {
        layer.player.pause();
        // Keep the player for a quick resume unless its condition is gone.
        if (conditionEnded) this.remove(id);
      });
    }

    // Start or adjust the layers that should play.
    for (const id of wanted) {
      let layer = this.layers.get(id);
      if (!layer) {
        const player = createAudioPlayer(conditionProfiles[id].sound);
        player.loop = true;
        player.volume = 0;
        layer = { player };
        this.layers.set(id, layer);
      }
      // Never jump to full volume: anything starting from silence fades in.
      const startingFromSilence = !layer.player.playing;
      if (startingFromSilence) layer.player.play();
      const fadeMs = startingFromSilence ? (crossfading ? CROSSFADE_MS : FADE_IN_MS) : VOLUME_CHANGE_MS;
      this.fade(layer, volume, fadeMs);
    }
  }

  // Stops and frees everything (e.g. when the screen unmounts).
  stopAll() {
    for (const id of [...this.layers.keys()]) this.remove(id);
  }

  private remove(id: ConditionId) {
    const layer = this.layers.get(id);
    if (!layer) return;
    clearInterval(layer.fadeTimer);
    layer.player.pause();
    layer.player.release();
    this.layers.delete(id);
  }

  // Moves a layer's volume to `to` in small steps. Starting a new fade
  // cancels the previous one (and its onDone).
  private fade(layer: Layer, to: number, ms: number, onDone?: () => void) {
    clearInterval(layer.fadeTimer);
    layer.fadeTimer = undefined;
    const from = layer.player.volume;
    if (ms <= 0 || from === to) {
      layer.player.volume = to;
      onDone?.();
      return;
    }
    const steps = Math.max(1, Math.round(ms / 40));
    let step = 0;
    layer.fadeTimer = setInterval(() => {
      step += 1;
      layer.player.volume = from + (to - from) * (step / steps);
      if (step >= steps) {
        clearInterval(layer.fadeTimer);
        layer.fadeTimer = undefined;
        onDone?.();
      }
    }, ms / steps);
  }
}

export const ambientSound = new AmbientSound();
