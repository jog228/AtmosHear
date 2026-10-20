import { useLastNotificationResponse } from 'expo-notifications';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { useIsForeground } from '@/hooks/use-is-foreground';
import { useMinuteClock } from '@/hooks/use-minute-clock';

import { alarmRinger } from './alarm-ringer';
import { isDue, minuteStart } from './alarm-schedule';
import { alarmStore } from './alarm-store';
import { handleResponse, rescheduleAlarmNotifications, setUpAlarmNotifications } from './alarm-notifications';
import { useAlarms } from './use-alarms';

export const RINGING_PATH = '/alarm-ringing';

// Mounted once in the root layout: makes alarms ring. While the app is in
// the foreground it checks every minute for a due alarm and rings it,
// keeps the backup notifications in step with the saved alarms, rings for
// a tapped notification, and opens the ringing screen whenever something
// rings. Renders nothing.
export function AlarmHost() {
  const { alarms, loaded } = useAlarms();
  const foreground = useIsForeground();
  const now = useMinuteClock(foreground);

  useEffect(() => setUpAlarmNotifications(), []);

  // The tap that opened the app, if it was an alarm notification.
  const launchResponse = useLastNotificationResponse();
  useEffect(() => {
    if (launchResponse) handleResponse(launchResponse);
  }, [launchResponse]);

  useEffect(() => {
    if (loaded) rescheduleAlarmNotifications(alarms);
  }, [alarms, loaded]);

  // Each new minute (and on coming back to the foreground): ring what's
  // due, and switch off one-time alarms that passed while the app was
  // closed.
  useEffect(() => {
    if (!loaded || !foreground) return;
    for (const alarm of alarmStore.list()) {
      if (isDue(alarm, now)) {
        alarmRinger.start({ alarmId: alarm.id, label: alarm.label, tone: alarm.tone, at: minuteStart(now) });
      }
    }
    alarmStore.expireOnce(now);
  }, [now, loaded, foreground]);

  // Opens the ringing screen when something starts ringing (once the
  // navigator is ready, e.g. after a cold start from a notification), and
  // again if anything navigates away while it still rings (like the
  // opening-screen switch after 5+ minutes in the background).
  const ring = useSyncExternalStore(
    (listener) => alarmRinger.subscribe(listener),
    () => alarmRinger.current(),
  );
  const pathname = usePathname();
  const navigationReady = !!useRootNavigationState()?.key;
  // True from the push until the screen shows, so it's pushed only once.
  const opening = useRef(false);
  useEffect(() => {
    if (pathname === RINGING_PATH || !ring) {
      opening.current = false;
      return;
    }
    if (!navigationReady || opening.current) return;
    opening.current = true;
    router.push(RINGING_PATH);
  }, [ring, navigationReady, pathname]);

  return null;
}
