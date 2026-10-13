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
const REPLAY_DIP_MS = 200; // quick dip before a replay restarts the sound

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
  private playing: ConditionId[] = [];
  private volume = AMBIENT_VOLUME;

  // Plays even with the ringer switch on silent: only the volume buttons
  // and the in-app toggle control it. Other apps' audio keeps playing.
  async configure() {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
    });
  }

  update({ conditions, enabled, foreground, volume }: AmbientState) {
    const wanted = enabled && foreground ? conditions.filter((id) => conditionProfiles[id].sound) : [];
    this.playing = wanted;
    this.volume = volume;
    let crossfading = false;

    // Fade out layers that should stop. Pause right away when the app goes
    // to the background (timers don't run there).
    for (const [id, layer] of this.layers) {
      if (wanted.includes(id)) continue;
      const conditionEnded = !conditions.includes(id);
      if (conditionEnded && foreground && enabled) crossfading = true;
      const fadeMs = !foreground ? 0 : !enabled ? TURN_OFF_MS : CROSSFADE_MS;
      const curve = fadeMs === CROSSFADE_MS ? 'equalPower' : 'linear';
      this.fade(layer, 0, fadeMs, curve, () => {
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
      this.fade(layer, layerVolume(id, volume), fadeMs, crossfading ? 'equalPower' : 'linear');
    }
  }

  // Restarts the playing sounds from the beginning with a fade-in. Does
  // nothing while ambient sound is off or the condition has no sound.
  replay() {
    for (const id of this.playing) {
      const layer = this.layers.get(id);
      if (!layer) continue;
      this.fade(layer, 0, REPLAY_DIP_MS, 'linear', async () => {
        await layer.player.seekTo(0);
        // Skip if the app went to the background (or sound was turned off) meanwhile.
        if (!this.playing.includes(id)) return;
        layer.player.play();
        this.fade(layer, layerVolume(id, this.volume), FADE_IN_MS, 'linear');
      });
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
  // 'equalPower' keeps the combined loudness steady while one sound fades
  // out and another fades in (straight lines dip ~3 dB in the middle).
  private fade(layer: Layer, to: number, ms: number, curve: 'linear' | 'equalPower', onDone?: () => void) {
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
      const t = step / steps;
      const eased = curve === 'linear' ? t : to > from ? Math.sin((t * Math.PI) / 2) : 1 - Math.cos((t * Math.PI) / 2);
      layer.player.volume = from + (to - from) * eased;
      if (step >= steps) {
        clearInterval(layer.fadeTimer);
        layer.fadeTimer = undefined;
        onDone?.();
      }
    }, ms / steps);
  }
}

// The ambient volume, corrected for files that are louder than the rest.
function layerVolume(id: ConditionId, volume: number) {
  return volume * (conditionProfiles[id].soundVolume ?? 1);
}

export const ambientSound = new AmbientSound();
