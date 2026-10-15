import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSavedTime } from '@/services/time';
import type { WeatherData } from '@/services/weather-data';

import { MuteButton } from './mute-button';

type Props = {
  weather: WeatherData;
  // Shows a "Developer mode" pill so test weather is never mistaken for real.
  developerMode: boolean;
  // Shown under the title, e.g. the time-of-day greeting.
  greeting?: ReactNode;
};

export function ScreenHeader({ weather, developerMode, greeting }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const source = describeSource(weather);
  // The live provider's name is for developers only. Saved forecasts and
  // demo data always say so, since they mean the weather may not be current.
  const isLive = weather.source === 'open-meteo' || weather.source === 'nws';
  const showSource = developerMode || !isLive;

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header" accessibilityLabel="AtmosHear">
        AtmosHear
      </Text>
      {developerMode && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>Developer mode</Text>
        </View>
      )}
      {greeting}
      {showSource && (
        <Text style={styles.note} accessibilityLabel={source.spoken}>
          {source.label}
        </Text>
      )}
      {/* Top-right controls: Settings, with the quick mute under it. */}
      <View style={styles.controls}>
        <Link href="/settings" asChild>
          <Pressable style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Settings">
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              size={26}
              tintColor={theme.colors.heading}
              accessible={false}
            />
          </Pressable>
        </Link>
        <MuteButton />
      </View>
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
    case 'test':
      return { label: 'Test weather', spoken: 'Test weather, not real weather.' };
  }
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    // Title and greeting as one group, with the same small gap
    // between each. The side padding matches the buttons' width on both
    // sides, so text stays centered and never runs under them. Extra room
    // below (32 in all) sets the group apart from the weather icon.
    container: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: 48,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.heading,
    },
    pill: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: theme.colors.heading,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.heading,
    },
    note: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    controls: {
      position: 'absolute',
      top: -10,
      right: 0,
    },
    iconButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
