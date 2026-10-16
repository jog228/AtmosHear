import type { CueColor } from './theme';

// A light cue is a full-screen color overlay (src/components/light-overlay.tsx)
// stepping through opacities. Each step moves to `opacity` (0-1) over `ms`,
// in `color`. Cues start and end at 0. Swap a color by its cueColors name.
export type LightStep = { color: CueColor; opacity: number; ms: number };
export type LightCue = LightStep[];

// WCAG 2.3.1: never more than 3 flashes in any one second.
export const MAX_FLASHES_PER_SECOND = 3;

// A change this big (in opacity) counts toward a flash.
const FLASH_DELTA = 0.1;

// Slow pulses: up to `peak` and back down, `times` times.
export function breathe(color: CueColor, { periodMs = 4000, peak = 0.45, times = 2 } = {}): LightCue {
  return Array.from({ length: times }, (): LightStep[] => [
    { color, opacity: peak, ms: periodMs / 2 },
    { color, opacity: 0, ms: periodMs / 2 },
  ]).flat();
}

// Stays at the current opacity for `ms`.
export function hold(color: CueColor, opacity: number, ms: number): LightStep {
  return { color, opacity, ms };
}

export function lightDuration(cue: LightCue): number {
  return cue.reduce((sum, step) => sum + step.ms, 0);
}

// Peaks: each time the light rises, then falls, by at least FLASH_DELTA
// (a flash is a pair of opposing changes). Returns when each peak is
// reached, in ms from the start.
function peakTimes(cue: LightCue): number[] {
  // The levels the light turns around at, skipping holds and steps that
  // keep going the same way.
  const turns = [{ at: 0, level: 0 }];
  let time = 0;
  for (const step of cue) {
    time += step.ms;
    const last = turns[turns.length - 1];
    if (step.opacity === last.level) continue;
    const before = turns[turns.length - 2];
    const sameWay = before && (last.level - before.level) * (step.opacity - last.level) > 0;
    if (sameWay) turns[turns.length - 1] = { at: time, level: step.opacity };
    else turns.push({ at: time, level: step.opacity });
  }
  const peaks: number[] = [];
  for (let i = 1; i < turns.length; i++) {
    const next = turns[i + 1]?.level ?? 0;
    const { at, level } = turns[i];
    if (level - turns[i - 1].level >= FLASH_DELTA && level - next >= FLASH_DELTA) peaks.push(at);
  }
  return peaks;
}

// How many pulses or flashes the cue has, e.g. for "2 pulses over 8 s".
export function pulseCount(cue: LightCue): number {
  return peakTimes(cue).length;
}

// The most flashes inside any one-second window.
export function maxFlashesPerSecond(cue: LightCue): number {
  const peaks = peakTimes(cue);
  return peaks.reduce((most, start) => Math.max(most, peaks.filter((t) => t >= start && t < start + 1000).length), 0);
}

// With Reduce Motion on (or for a cue that would flash too fast): one slow,
// soft fade in the cue's first color, no flashing.
export function gentleFade(cue: LightCue): LightCue {
  const color = cue[0]?.color ?? 'white';
  const peak = Math.min(0.3, Math.max(0, ...cue.map((step) => step.opacity)));
  return [
    { color, opacity: peak, ms: 1200 },
    { color, opacity: peak, ms: 800 },
    { color, opacity: 0, ms: 1200 },
  ];
}

// The cue as it should play: gentle when Reduce Motion is on, and never
// unsafe. Unsafe cues also log in development so they get fixed.
export function safeLightCue(cue: LightCue, reduceMotion: boolean): LightCue {
  if (reduceMotion) return gentleFade(cue);
  if (maxFlashesPerSecond(cue) > MAX_FLASHES_PER_SECOND) {
    if (__DEV__) console.error('Light cue flashes more than 3 times per second; playing a gentle fade instead.');
    return gentleFade(cue);
  }
  return cue;
}

// "2 pulses over 8 s".
export function describeLightTiming(cue: LightCue): string {
  const count = pulseCount(cue);
  const seconds = Math.round(lightDuration(cue) / 100) / 10;
  return `${count} ${count === 1 ? 'pulse' : 'pulses'} over ${seconds} s`;
}
