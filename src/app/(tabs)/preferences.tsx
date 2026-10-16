import {
  AccessibilitySettings,
  AppearanceSettings,
  SoundSettings,
  TemperatureSettings,
} from '@/components/app-settings';
import { DeveloperSettings } from '@/components/developer-settings';
import { NameSection, OpeningScreenSection, PreferencesPage } from '@/features/preferences/preferences-screen';

// The Preferences tab: every setting in the app. The opening-screen parts
// come from src/features/preferences (which must not import weather code);
// the weather-dependent sections come from src/components.
export default function PreferencesScreen() {
  return (
    <PreferencesPage>
      <NameSection />
      <AppearanceSettings />
      <OpeningScreenSection />
      <TemperatureSettings />
      <SoundSettings />
      <AccessibilitySettings />
      <DeveloperSettings />
    </PreferencesPage>
  );
}
