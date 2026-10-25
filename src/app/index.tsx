import { Redirect } from 'expo-router';

import { useOnboardingStatus } from '@/features/onboarding/onboarding-storage';
import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';

// Cold launch: a first launch goes to onboarding; otherwise straight to
// Weather during the day or Alarms at night, before either tab shows, so
// the Weather sound and vibration don't start on a night launch. Renders
// nothing until the onboarding key has been read (the root layout starts
// reading it at launch), so the tabs never flash first.
export default function Index() {
  const onboarding = useOnboardingStatus();
  const { startTab } = useOpeningPreferences();
  if (onboarding === 'loading') return null;
  if (onboarding === 'needed') return <Redirect href="/onboarding/welcome" />;
  return <Redirect href={startTab() === 'alarms' ? '/alarms' : '/weather'} />;
}
