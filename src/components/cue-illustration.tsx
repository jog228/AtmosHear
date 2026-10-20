import { useCallback } from 'react';

import type { ConditionId } from '@/constants/conditions';
import type { HapticStyle } from '@/constants/haptics';
import { hapticPlayer } from '@/services/haptics';

import { DotRings, type PulseSource } from './brand';
import { ConditionImage } from './weather-hero';

// How far each tap strength grows the rings (1 = the full pulse).
const PULSE_STRENGTH: Record<HapticStyle, number> = {
  soft: 0.35,
  light: 0.5,
  medium: 0.7,
  heavy: 0.9,
  rigid: 1,
};

type Props = {
  condition: ConditionId;
  size: number;
  // True while "Play all cues" runs for this condition.
  playing: boolean;
};

// The cue screens' illustration: the condition's PNG inside dot rings.
// While its cues play, the rings pulse on every haptic tap, at the moment
// the haptics player fires it (the same timer, so the pulse can't drift
// from the vibration). No taps play when Vibration is off, so the rings
// stay still then too. Decorative: the rows below describe every cue.
export function CueIllustration({ condition, size, playing }: Props) {
  const pulses = useCallback<PulseSource>(
    (onPulse) => hapticPlayer.subscribeTaps((tap) => onPulse(PULSE_STRENGTH[tap.style])),
    [],
  );
  return (
    <DotRings size={size} pulses={playing ? pulses : undefined}>
      <ConditionImage condition={condition} size={size * 0.5} />
    </DotRings>
  );
}
