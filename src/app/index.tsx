import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrentConditions } from '@/components/current-conditions';
import { DetailCards } from '@/components/detail-cards';
import { HourlyForecast } from '@/components/hourly-forecast';
import { PlayButton } from '@/components/play-button';
import { ScreenHeader } from '@/components/screen-header';
import { ErrorState, LoadingState } from '@/components/status-states';
import { spacing } from '@/constants/theme';
import { useWeather } from '@/hooks/use-weather';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { state, reload } = useWeather();

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
      <ScreenHeader place={place} weather={weather} />
      <CurrentConditions current={weather.current} />
      {/* Placeholder: sound and haptics are added in a later step. */}
      <PlayButton onPress={() => {}} />
      <DetailCards current={weather.current} />
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
