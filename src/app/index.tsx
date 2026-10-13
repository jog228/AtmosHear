import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentConditions } from '@/components/current-conditions';
import { DetailCards } from '@/components/detail-cards';
import { HourlyForecast } from '@/components/hourly-forecast';
import { PlayButton } from '@/components/play-button';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/status-states';
import { conditionProfiles } from '@/constants/condition-profiles';
import { spacing } from '@/constants/theme';
import { useWeather } from '@/hooks/use-weather';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, reload } = useWeather();

  if (state.status === 'loading') return <LoadingState />;
  if (state.status === 'error') return <ErrorState onRetry={reload} />;

  const { place, weather } = state;
  const accent = conditionProfiles[weather.current.condition].color;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <ScreenHeader place={place} />
      <CurrentConditions current={weather.current} />
      {/* Placeholder: sound and haptics are added in a later step. */}
      <PlayButton color={accent} onPress={() => {}} />
      <DetailCards current={weather.current} accent={accent} />
      <HourlyForecast hours={weather.hourly} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
});
