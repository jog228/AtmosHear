import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentConditions } from '@/components/current-conditions';
import { DetailCards } from '@/components/detail-cards';
import { GlassBackdrop } from '@/components/glass-backdrop';
import { HourlyForecast } from '@/components/hourly-forecast';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/status-states';
import { mostSignificant } from '@/constants/condition-priority';
import { spacing } from '@/constants/theme';
import { useConditionSound } from '@/hooks/use-condition-sound';
import { useWeather } from '@/hooks/use-weather';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, reload, developerMode } = useWeather();
  // Only the most significant condition plays for now. To layer sounds
  // (e.g. rain + wind), pass all of weather.current.conditions instead.
  const { replay } = useConditionSound(state.status === 'ready' ? [mostSignificant(state.weather.current.conditions)] : []);

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
      <CurrentConditions current={weather.current} onReplay={replay} />
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
