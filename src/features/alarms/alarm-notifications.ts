import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useIsForeground } from '@/hooks/use-is-foreground';

import { alarmRinger, type Ring } from './alarm-ringer';
import { isAlarmTone } from './alarm-tones';
import type { Alarm } from './alarm-types';

// The backup for a closed or locked app: a local notification for every
// enabled alarm, titled with its label, plus one for a snoozed alarm.
// Works in Expo Go, but always with the default notification sound (custom
// sounds need a native build), so it's a nudge, not a ringing alarm.
// Tapping it opens the app and rings for real.

const PREFIX = 'alarm-';
const SNOOZE_ID = `${PREFIX}snooze`;
const CHANNEL = 'alarms';
// The snooze's notification fires a little after the in-app snooze timer,
// so in the foreground the timer always wins and cancels it.
const SNOOZE_BACKUP_DELAY_MS = 5000;
// A tap on an alarm notification older than this (the ring would have
// auto-stopped) just opens the app.
const STALE_MS = 10 * 60_000;

const supported = Platform.OS !== 'web';

type AlarmData = { kind: 'alarm'; alarmId: string | null; label: string; tone: string };

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

// Call once at startup (AlarmHost). In the foreground, the app rings the
// alarm itself, so its notification isn't shown (no double alarm, e.g. in
// bedside mode); it starts the ring in case the in-app check missed it.
export function setUpAlarmNotifications() {
  if (!supported) return () => {};
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as Partial<AlarmData> | undefined;
      if (data?.kind !== 'alarm') {
        return { shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false };
      }
      alarmRinger.start(ringFrom(data as AlarmData, notification.date));
      return { shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false };
    },
  });
  // Android needs a channel before it asks for permission (Android 13+).
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
    }).catch(() => {});
  }
  alarmRinger.snoozeBackup = {
    schedule: (ring) => {
      Notifications.scheduleNotificationAsync({
        identifier: SNOOZE_ID,
        content: content(ring.label, ring.alarmId, ring.tone),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: ring.at + SNOOZE_BACKUP_DELAY_MS, channelId: CHANNEL },
      }).catch(() => {});
    },
    cancel: () => {
      Notifications.cancelScheduledNotificationAsync(SNOOZE_ID).catch(() => {});
    },
  };
  // A tap while the app is running (in the background or not).
  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
  return () => subscription.remove();
}

const handled = new Set<string>();

// Rings for a tapped alarm notification (once per notification). Also used
// for the tap that launched the app.
export function handleResponse(response: Notifications.NotificationResponse) {
  const { notification } = response;
  const data = notification.request.content.data as Partial<AlarmData> | undefined;
  if (data?.kind !== 'alarm') return;
  const key = `${notification.request.identifier}@${notification.date}`;
  if (handled.has(key)) return;
  handled.add(key);
  if (Date.now() - notification.date > STALE_MS) return;
  alarmRinger.start(ringFrom(data as AlarmData, notification.date));
}

function ringFrom(data: AlarmData, at: number): Ring {
  return {
    alarmId: data.alarmId,
    label: data.label,
    tone: isAlarmTone(data.tone) ? data.tone : 'morning',
    at,
  };
}

function content(label: string, alarmId: string | null, tone: string): Notifications.NotificationContentInput {
  const data: AlarmData = { kind: 'alarm', alarmId, label, tone };
  return { title: label, body: 'Alarm. Tap to open AtmosHear and turn it off.', sound: 'default', data };
}

// Replaces every scheduled alarm notification with the current alarms.
// Calls queue up, so quick changes can't interleave.
let queue: Promise<void> = Promise.resolve();
export function rescheduleAlarmNotifications(alarms: Alarm[]) {
  if (!supported) return;
  queue = queue.then(() => reschedule(alarms)).catch((error) => console.warn('Failed to schedule alarms', error));
}

async function reschedule(alarms: Alarm[]) {
  const { status } = await Notifications.getPermissionsAsync();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(PREFIX) && request.identifier !== SNOOZE_ID)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );
  if (status !== 'granted') return;
  const now = Date.now();
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const body = content(alarm.label, alarm.id, alarm.tone);
    if (alarm.repeatDays.length === 0) {
      if (alarm.onceAt === undefined || alarm.onceAt <= now) continue;
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${alarm.id}-once`,
        content: body,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: alarm.onceAt, channelId: CHANNEL },
      });
    } else {
      // One weekly notification per day. The notifications count days 1-7
      // from Sunday; alarms count 0-6.
      for (const day of alarm.repeatDays) {
        await Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX}${alarm.id}-${day}`,
          content: body,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1,
            hour: alarm.hour,
            minute: alarm.minute,
            channelId: CHANNEL,
          },
        });
      }
    }
  }
}

// --- Permission ----------------------------------------------------------

type PermissionListener = (state: PermissionState) => void;
const permissionListeners = new Set<PermissionListener>();

async function readPermission(): Promise<PermissionState> {
  if (!supported) return 'unavailable';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

// The first time an alarm is switched on (or added): one sentence on why,
// then the system prompt. Afterwards, does nothing. Reschedules once
// answered, since alarms couldn't be scheduled before.
export async function askForNotificationsIfNeeded(onAnswered: () => void) {
  if ((await readPermission()) !== 'undetermined') return;
  Alert.alert(
    'Allow notifications for alarms?',
    'AtmosHear rings alarms while it’s open; a notification wakes you if the app is closed or the phone is locked.',
    [
      { text: 'Not now', style: 'cancel', onPress: () => emitPermission('undetermined') },
      {
        text: 'Continue',
        onPress: async () => {
          await Notifications.requestPermissionsAsync();
          emitPermission(await readPermission());
          onAnswered();
        },
      },
    ],
  );
}

function emitPermission(state: PermissionState) {
  permissionListeners.forEach((listener) => listener(state));
}

// The notification permission, re-read when the app comes back (it may
// have changed in Settings).
export function useNotificationPermission(): PermissionState | null {
  const foreground = useIsForeground();
  const [state, setState] = useState<PermissionState | null>(null);
  useEffect(() => {
    permissionListeners.add(setState);
    return () => {
      permissionListeners.delete(setState);
    };
  }, []);
  useEffect(() => {
    if (foreground) readPermission().then(setState);
  }, [foreground]);
  return state;
}
