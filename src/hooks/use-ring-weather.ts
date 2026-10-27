import { useEffect, useState, useSyncExternalStore } from 'react';

import { conditionProfiles, describeConditions } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { alarmRinger } from '@/features/alarms/alarm-ringer';
import type { RingWeather } from '@/features/alarms/bedside-slots';
import { loadLatestWeather, weatherNow } from '@/services/latest-weather';
import { playable } from '@/services/wake-weather';

import { usePreferences } from './use-preferences';
import { useTemperature } from './use-temperature';

type Now = { conditions: ConditionId[]; temperature: number };

// Fills the ringing screen's weather slot (ringWeather in
// src/features/alarms/bedside-slots.tsx): while an alarm rings or is
// snoozed, the weather on hand, read the same way as the weather on wake
// (test weather, or the last saved forecast; demo filler doesn't count),
// so "Playing the wind sound" names what's actually playing. Read once
// when the ring starts; null without weather.
export function useRingWeather(): RingWeather | null {
  const { preferences } = usePreferences();
  const temperature = useTemperature();
  const active = useSyncExternalStore(
    (listener) => alarmRinger.subscribe(listener),
    () => alarmRinger.current() !== null || alarmRinger.snoozed() !== null,
  );
  const [now, setNow] = useState<Now | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    loadLatestWeather(preferences).then((weather) => {
      if (!cancelled) setNow(weather ? weatherNow(weather) : null);
    });
    // Forgotten when the ring (and any snooze) ends, so the next ring
    // never shows this one's weather.
    return () => {
      cancelled = true;
      setNow(null);
    };
    // Once per ring: a preferences change mid-ring doesn't change the sound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active || !now || now.conditions.length === 0) return null;
  const condition = describeConditions(now.conditions);
  const degrees = temperature.value(now.temperature);
  const sounds = playable(now.conditions).map((id) => conditionProfiles[id].label.toLowerCase());
  return {
    headline: `${condition} now, ${degrees}°`,
    playing: sounds.length === 0 ? null : `Playing the ${joinAnd(sounds)} sound${sounds.length > 1 ? 's' : ''}`,
    spoken: `${condition} now, ${degrees} degrees`,
  };
}

function joinAnd(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
