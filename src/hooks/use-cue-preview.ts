import { useEffect, useState } from 'react';

import type { ConditionId } from '@/constants/conditions';
import { cuePreview } from '@/services/cue-preview';

import { useIsForeground } from './use-is-foreground';
import { usePreferences } from './use-preferences';

// The cue preview for a screen: which condition is playing (or null), and
// play/stop. Previews respect the Vibration setting. They stop when the
// screen closes or the app goes to the background.
export function useCuePreview() {
  const { preferences } = usePreferences();
  const foreground = useIsForeground();
  const [playing, setPlaying] = useState<ConditionId | null>(() => cuePreview.current());

  useEffect(() => cuePreview.subscribe(setPlaying), []);
  useEffect(() => () => cuePreview.stop(), []);
  useEffect(() => {
    if (!foreground) cuePreview.stop();
  }, [foreground]);

  return {
    playing,
    vibrationOn: preferences.vibration,
    play: (id: ConditionId) => cuePreview.play(id, { vibrate: preferences.vibration }),
    stop: () => cuePreview.stop(),
    toggle: (id: ConditionId) =>
      playing === id ? cuePreview.stop() : cuePreview.play(id, { vibrate: preferences.vibration }),
  };
}
