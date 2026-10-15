import { usePathname } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentConditions } from '@/components/current-conditions';
import { DetailCards } from '@/components/detail-cards';
import { GlassBackdrop } from '@/components/glass-backdrop';
import { HourlyForecast } from '@/components/hourly-forecast';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/status-states';
import { mostSignificant, sortByPriority } from '@/constants/condition-priority';
import { spacing } from '@/constants/theme';
import { useAlertSound } from '@/hooks/use-alert-sound';
import { useConditionHaptics } from '@/hooks/use-condition-haptics';
import { useConditionSound } from '@/hooks/use-condition-sound';
import { useWeather } from '@/hooks/use-weather';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, reload, developerMode } = useWeather();
  // Weather sound and vibration stop on the Alarms tab (the sound fades
  // out, then back in on return). Settings, opened from here, keeps them.
  const onWeatherTab = usePathname() !== '/alarms';
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
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <ScreenHeader place={place} weather={weather} developerMode={developerMode} />
      <CurrentConditions
        current={weather.current}
        alertActive={!!alert}
        onReplay={
          alert
            ? replayAlert
            : () => {
                replay();
                replayHaptics();
              }
        }
      />
      {/* Only cards go in the backdrop: page text can't sit on the blobs, so
          they spread sideways to the screen edges but never up. */}
      <GlassBackdrop
        condition={mostSignificant(weather.current.conditions)}
        bleed={{ top: 0, sides: spacing.md }}
        style={styles.cards}
      >
        <DetailCards current={weather.current} />
        <HourlyForecast hours={weather.hourly} />
      </GlassBackdrop>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  cards: {
    gap: spacing.lg,
  },
});
