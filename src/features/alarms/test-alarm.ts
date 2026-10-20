import { alarmRinger } from './alarm-ringer';
import { alarmStore } from './alarm-store';
import { DEFAULT_TONE } from './alarm-tones';

// Preferences › Developer › "Test alarm now": rings right away with the
// first alarm's tone (earliest in the list), or the default with none.
// Doesn't change any saved alarm.
export function testAlarmNow() {
  const first = [...alarmStore.list()].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))[0];
  alarmRinger.start({ alarmId: null, label: 'Test alarm', tone: first?.tone ?? DEFAULT_TONE, at: Date.now() });
}
