import type { LightCue } from '@/constants/light-cues';

type Listener = (cue: LightCue | null) => void;

// Tells the full-screen light overlay (src/components/light-overlay.tsx)
// what to play. One cue at a time: a new one replaces the old.
class LightCueChannel {
  private listeners = new Set<Listener>();

  play(cue: LightCue) {
    this.listeners.forEach((listener) => listener(cue));
  }

  stop() {
    this.listeners.forEach((listener) => listener(null));
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const lightCue = new LightCueChannel();
