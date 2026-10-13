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
  // becomes a looping layer, so thunderstorm + heavy rain play together.
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
    // Conditions without a sound file are skipped.
    const wanted = enabled && foreground ? conditions.filter((id) => conditionProfiles[id].sound) : [];
    // Adding, removing, or swapping layers while sound is playing crossfades
    // them together; starting from silence fades in.
    const crossfading = this.playing.length > 0 && wanted.length > 0 && wanted.join() !== this.playing.join();
    this.playing = wanted;
    this.volume = volume;

    // Fade out layers that should stop. Pause right away when the app goes
    // to the background (timers don't run there).
    for (const [id, layer] of this.layers) {
      if (wanted.includes(id)) continue;
      const conditionEnded = !conditions.includes(id);
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
      // Layers already playing glide to their new level (e.g. quieter once
      // another layer joins).
      const startingFromSilence = !layer.player.playing;
      if (startingFromSilence) layer.player.play();
      const fadeMs = crossfading ? CROSSFADE_MS : startingFromSilence ? FADE_IN_MS : VOLUME_CHANGE_MS;
      this.fade(layer, layerVolume(id, volume, wanted), fadeMs, crossfading ? 'equalPower' : 'linear');
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
        this.fade(layer, layerVolume(id, this.volume, this.playing), FADE_IN_MS, 'linear');
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

// A layer's volume: the ambient volume, corrected for files that are louder
// than the rest, times its share of the mix.
function layerVolume(id: ConditionId, volume: number, layers: ConditionId[]) {
  const weights = layers.map((layer) => mixWeight(layer, layers));
  // Stacked layers are lowered together so a combination isn't louder than
  // one sound: about 71% each for two equal layers, 58% each for three.
  const stackGain = 1 / Math.sqrt(weights.reduce((sum, w) => sum + w * w, 0) || 1);
  return volume * (conditionProfiles[id].soundVolume ?? 1) * mixWeight(id, layers) * stackGain;
}

// 1 for a main layer. Supporting layers (like wind) get their
// supportingVolume when any other sound is playing.
function mixWeight(id: ConditionId, layers: ConditionId[]) {
  const { supportingVolume, supportingVolumeWith = {} } = conditionProfiles[id];
  const others = layers.filter((layer) => layer !== id);
  if (supportingVolume === undefined || others.length === 0) return 1;
  return Math.min(...others.map((other) => supportingVolumeWith[other] ?? supportingVolume));
}

export const ambientSound = new AmbientSound();
