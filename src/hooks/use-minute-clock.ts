import { useEffect, useState } from 'react';

import { useIsForeground } from './use-is-foreground';

// The current time, refreshed on each new minute while `active` and the app
// is in the foreground, and right away when it becomes active again.
export function useMinuteClock(active: boolean): number {
  const foreground = useIsForeground();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !foreground) return;
    const tick = () => setNow(Date.now());
    let interval: ReturnType<typeof setInterval> | undefined;
    const catchUp = setTimeout(tick, 0);
    // Line up with the start of the next minute, then every minute.
    const align = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(catchUp);
      clearTimeout(align);
      clearInterval(interval);
    };
  }, [active, foreground]);

  return now;
}
