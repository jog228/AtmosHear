import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { ALERT_REPEATS, ALERT_SOUND } from '@/constants/alert-sound';

import { ambientSound } from './ambient-sound';

// Plays the severe weather alert: the alert sound a few times back to back
// at full volume, with the ambient sounds ducked underneath. Separate from
// the ambient loops, and plays even when "Ambient sound" is off in Settings.
class AlertSound {
  private player: AudioPlayer | null = null;
  // Beeps still to play after the current one.
  private remaining = 0;
  private beeping = false;
  private onFinished?: () => void;
  // Alerts that have already beeped this session.
  private played = new Set<string>();

  // Loads the file ahead of time so the first beep starts sharply.
  preload() {
    this.getPlayer();
  }

  // Beeps for an alert the first time it's seen. Refreshing the weather or
  // returning from the background keeps the same ID, so it doesn't repeat.
  playIfNew(alertId: string, onFinished?: () => void) {
    if (this.played.has(alertId)) return;
    this.played.add(alertId);
    this.play(onFinished);
  }

  // Plays all the beeps now (restarting if they're already playing), then
  // calls onFinished.
  play(onFinished?: () => void) {
    this.remaining = ALERT_REPEATS - 1;
    this.onFinished = onFinished;
    ambientSound.setDucked(true);
    this.beep();
  }

  // Cuts the beeps short (e.g. the app went to the background).
  stop() {
    if (!this.player) return;
    this.remaining = 0;
    this.beeping = false;
    this.onFinished = undefined;
    this.player.pause();
    ambientSound.setDucked(false);
  }

  private beep() {
    const player = this.getPlayer();
    this.beeping = true;
    // Full volume with no fade-in, and not lowered for VoiceOver.
    player.volume = 1;
    player.seekTo(0);
    player.play();
  }

  private handleFinished() {
    if (!this.beeping) return;
    this.beeping = false;
    if (this.remaining > 0) {
      this.remaining -= 1;
      this.beep();
      return;
    }
    ambientSound.setDucked(false);
    const onFinished = this.onFinished;
    this.onFinished = undefined;
    onFinished?.();
  }

  private getPlayer() {
    if (!this.player) {
      const player = createAudioPlayer(ALERT_SOUND);
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) this.handleFinished();
      });
      this.player = player;
    }
    return this.player;
  }
}

export const alertSound = new AlertSound();
