import { StyleSheet, Text, View } from 'react-native';

import { spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Place } from '@/services/location';
import type { WeatherData } from '@/services/weather-data';

// The forecast's location, under the temperature and above the detail
// cards, with a note when the phone's location wasn't available.
export function LocationLine({ place, weather }: { place: Place; weather: WeatherData }) {
  const styles = createStyles(useTheme());
  return (
    <View style={styles.container}>
      <Text style={styles.location}>{weather.locationName}</Text>
      {place.isFallback && <Text style={styles.note}>Location unavailable, showing default</Text>}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    // Close under the temperature (8pt instead of the page's 24) so it reads
    // as part of it; the usual 24pt separates it from the cards.
    container: {
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: -spacing.md,
    },
    location: {
      fontSize: 20,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    note: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
