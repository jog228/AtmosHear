import { Redirect } from 'expo-router';

import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';

// Cold launch: opens straight to Weather during the day or Alarms at night,
// before either tab shows, so the Weather sound and vibration don't start
// on a night launch.
export default function Index() {
  const { startTab } = useOpeningPreferences();
  return <Redirect href={startTab() === 'alarms' ? '/alarms' : '/weather'} />;
}
