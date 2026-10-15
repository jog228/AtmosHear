import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useStartTabOnReturn } from '@/features/preferences/use-start-tab-on-return';
import { useTheme } from '@/hooks/use-theme';

// Three tabs: Weather, Alarms, and Preferences. Native tabs, so VoiceOver
// reads "Weather, tab, 1 of 3" and the selected state on its own. Settings
// opens above the tabs (see src/app/_layout.tsx). The starting tab comes
// from Preferences: src/app/index.tsx on launch, and the hook below after
// 5+ minutes in the background.
export default function TabsLayout() {
  const { colors } = useTheme();
  useStartTabOnReturn();

  return (
    <NativeTabs
      backgroundColor={colors.card}
      tintColor={colors.buttonBackground}
      iconColor={{ default: colors.textSecondary, selected: colors.buttonBackground }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.buttonBackground },
      }}
    >
      {/* Each tab paints our page background, never the navigator's default. */}
      <NativeTabs.Trigger name="weather" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'cloud.sun', selected: 'cloud.sun.fill' }} md="partly_cloudy_day" />
        <NativeTabs.Trigger.Label>Weather</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alarms" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'alarm', selected: 'alarm.fill' }} md="alarm" />
        <NativeTabs.Trigger.Label>Alarms</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="preferences" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf="slider.horizontal.3" md="tune" />
        <NativeTabs.Trigger.Label>Preferences</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
