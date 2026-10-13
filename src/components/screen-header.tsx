import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Place } from '@/services/location';
import { formatSavedTime } from '@/services/time';
import type { WeatherData } from '@/services/weather-data';

type Props = {
  place: Place;
  weather: WeatherData;
};

export function ScreenHeader({ place, weather }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const source = describeSource(weather);

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header" accessibilityLabel="AtmosHear">
        AtmosHear
      </Text>
      <Text style={styles.location}>{weather.locationName}</Text>
      {place.isFallback && (
        <Text style={styles.note}>Location unavailable, showing default</Text>
      )}
      <Text style={styles.note} accessibilityLabel={source.spoken}>
        {source.label}
      </Text>
      <Link href="/settings" asChild>
        <Pressable style={styles.settingsButton} accessibilityRole="button" accessibilityLabel="Settings">
          <SymbolView
            name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
            size={26}
            tintColor={theme.colors.heading}
            accessible={false}
          />
        </Pressable>
      </Link>
    </View>
  );
}

// Short text on screen; a fuller sentence for screen readers, since hearing
// that the weather isn't live matters more when you can't see the label.
function describeSource(weather: WeatherData): { label: string; spoken: string } {
  switch (weather.source) {
    case 'open-meteo':
      return { label: 'Source: Open-Meteo', spoken: 'Source: Open-Meteo' };
    case 'nws':
      return { label: 'Source: NWS', spoken: 'Source: National Weather Service' };
    case 'cache': {
      const time = formatSavedTime(weather.updatedAt);
      return {
        label: `Saved forecast from ${time}`,
        spoken: `Live weather unavailable. Showing saved forecast from ${time}.`,
      };
    }
    case 'demo':
      return { label: 'Demo data', spoken: 'Live weather unavailable. Showing demo data, not real weather.' };
  }
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: 48,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.heading,
    },
    location: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    note: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    settingsButton: {
      position: 'absolute',
      top: -10,
      right: 0,
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
