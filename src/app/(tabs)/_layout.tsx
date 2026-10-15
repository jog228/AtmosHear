import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

// Two tabs: Weather and Alarms. Native tabs, so VoiceOver reads "Weather,
// tab, 1 of 2" and the selected state on its own. Settings opens above the
// tabs (see src/app/_layout.tsx).
export default function TabsLayout() {
  const { colors } = useTheme();

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
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'cloud.sun', selected: 'cloud.sun.fill' }} md="partly_cloudy_day" />
        <NativeTabs.Trigger.Label>Weather</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alarms" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'alarm', selected: 'alarm.fill' }} md="alarm" />
        <NativeTabs.Trigger.Label>Alarms</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
