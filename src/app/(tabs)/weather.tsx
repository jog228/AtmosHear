import { usePathname } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentConditions } from '@/components/current-conditions';
import { DailyForecast } from '@/components/daily-forecast';
import { DetailCards } from '@/components/detail-cards';
import { Greeting } from '@/components/greeting';
import { HourlyForecast } from '@/components/hourly-forecast';
import { LocationLine, LocationNote } from '@/components/location-line';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/status-states';
import { SunCard } from '@/components/sun-card';
import { sortByPriority } from '@/constants/condition-priority';
import { spacing } from '@/constants/theme';
import { useAlertSound } from '@/hooks/use-alert-sound';
import { useConditionHaptics } from '@/hooks/use-condition-haptics';
import { useConditionSound } from '@/hooks/use-condition-sound';
import { useWeather } from '@/hooks/use-weather';
import { localDateString } from '@/services/time';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, reload, developerMode } = useWeather();
  // Weather sound and vibration stop on the other tabs (the sound fades
  // out, then back in on return). A screen opened on top keeps the tab it
  // came from: the Sound library (from here) keeps them, the test weather sheet
  // (from Preferences) stays quiet.
  const pathname = usePathname();
  const [tab, setTab] = useState(pathname);
  if (TAB_PATHS.includes(pathname) && pathname !== tab) setTab(pathname);
  // Silent under a ringing alarm too (the alarm will later bring the
  // weather sound in on purpose; see src/features/alarms/alarm-ringer.ts).
  const onWeatherTab = tab !== '/alarms' && tab !== '/preferences' && pathname !== '/alarm-ringing';
  const conditions = state.status === 'ready' && onWeatherTab ? state.weather.current.conditions : [];
  // Every current condition with a sound plays as its own layer.
  const { replay } = useConditionSound(sortByPriority(conditions));
  // Severe alerts beep separately, over the conditions underneath them.
  const alert = state.status === 'ready' ? state.weather.alert : undefined;
  const { replay: replayAlert } = useAlertSound(alert);
  // Each condition's vibration pattern; the alert vibrates with its beeps.
  const { replay: replayHaptics } = useConditionHaptics(
    conditions.filter((id) => id !== 'severe-alert'),
    !!alert,
  );

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState onRetry={reload} />;

  const { place, weather } = state;

  return (
    <ScrollView
      // On iOS the system adds the status bar and the tab bar to the scroll
      // insets. Set explicitly: the tabs only turn this on automatically for
      // the first scroll view they find, and this one only appears after the
      // loading state. Android gets the same space as padding.
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: (IOS ? 0 : insets.top) + spacing.md,
          paddingBottom: (IOS ? 0 : insets.bottom) + spacing.xl,
        },
      ]}
    >
      {/* Header, hero, and temperature sit close together, like the frame. */}
      <View style={styles.top}>
        <ScreenHeader
          weather={weather}
          developerMode={developerMode}
          location={<LocationLine weather={weather} />}
          locationNote={<LocationNote place={place} />}
          greeting={<Greeting weather={weather} place={place} visible={onWeatherTab} />}
        />
        <CurrentConditions
          current={weather.current}
          // A saved forecast's first day may be yesterday: match today's date.
          today={weather.daily.find((day) => day.date === localDateString())}
          alertActive={!!alert}
          visible={onWeatherTab}
          onReplay={
            alert
              ? replayAlert
              : () => {
                  replay();
                  replayHaptics();
                }
          }
        />
      </View>
      <DetailCards current={weather.current} airQuality={weather.airQuality} />
      <SunCard weather={weather} place={place} visible={onWeatherTab} />
      <HourlyForecast hours={weather.hourly} />
      <DailyForecast days={weather.daily} />
    </ScrollView>
  );
}

const IOS = Platform.OS === 'ios';
const TAB_PATHS = ['/weather', '/alarms', '/preferences'];

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  top: {
    gap: spacing.sm,
  },
});
