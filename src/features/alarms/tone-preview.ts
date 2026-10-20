import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect, useState } from 'react';

import { useIsForeground } from '@/hooks/use-is-foreground';

import { ALARM_TONES, type AlarmTone } from './alarm-tones';

type Listener = (playing: AlarmTone | null) => void;

// Plays one alarm tone through once, for the editor's Sound list. One
// preview at a time: a new one replaces the old.
class TonePreview {
  private player: AudioPlayer | null = null;
  private playing: AlarmTone | null = null;
  private listeners = new Set<Listener>();

  play(tone: AlarmTone) {
    this.stop();
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    const player = createAudioPlayer(ALARM_TONES[tone].source);
    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish && this.player === player) this.stop();
    });
    player.play();
    this.player = player;
    this.playing = tone;
    this.emit();
  }

  stop() {
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
    }
    if (this.playing === null) return;
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

const tonePreview = new TonePreview();

// The preview for a screen: which tone is playing, and toggle. Stops when
// the screen closes or the app goes to the background.
export function useTonePreview() {
  const foreground = useIsForeground();
  const [playing, setPlaying] = useState<AlarmTone | null>(() => tonePreview.current());
  useEffect(() => tonePreview.subscribe(setPlaying), []);
  useEffect(() => () => tonePreview.stop(), []);
  useEffect(() => {
    if (!foreground) tonePreview.stop();
  }, [foreground]);
  return {
    playing,
    toggle: (tone: AlarmTone) => (playing === tone ? tonePreview.stop() : tonePreview.play(tone)),
    stop: () => tonePreview.stop(),
  };
}
