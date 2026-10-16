import { StyleSheet, Text } from 'react-native';

import { typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Place } from '@/services/location';
import type { WeatherData } from '@/services/weather-data';

// The forecast's location, top left of the Weather screen, vertically
// centered on the buttons beside it.
export function LocationLine({ weather }: { weather: WeatherData }) {
  const styles = createStyles(useTheme());
  return <Text style={styles.location}>{weather.locationName}</Text>;
}

// Under the top row, when the phone's location wasn't available.
export function LocationNote({ place }: { place: Place }) {
  const styles = createStyles(useTheme());
  if (!place.isFallback) return null;
  return <Text style={styles.note}>Location unavailable, showing default</Text>;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    location: {
      ...typography.title,
      color: theme.colors.textPrimary,
    },
    note: {
      ...typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}
