import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { sortByPriority } from '@/constants/condition-priority';
import { radius, spacing, typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatSavedTime } from '@/services/time';
import type { WeatherData } from '@/services/weather-data';

import { SoundsIcon } from './icons';
import { MuteButton } from './mute-button';
import { SQUARE_BUTTON_SIZE, SquareButton, squareButtonIconColor } from './square-button';

// The All sounds icon, a little larger than the mute icon: its ring has
// small dots that need the room.
const SOUNDS_ICON_SIZE = 28;

type Props = {
  weather: WeatherData;
  // Shows a "Developer mode" pill so test weather is never mistaken for real.
  developerMode: boolean;
  // Top left, beside the buttons, e.g. the location.
  location?: ReactNode;
  // Under the top row, e.g. a note that the location is a fallback.
  locationNote?: ReactNode;
  // The headline under the top row, e.g. the time-of-day greeting.
  greeting?: ReactNode;
};

export function ScreenHeader({ weather, developerMode, location, locationNote, greeting }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const source = describeSource(weather);
  // The live provider's name is for developers only. Saved forecasts and
  // demo data always say so, since they mean the weather may not be current.
  const isLive = weather.source === 'open-meteo' || weather.source === 'nws';
  const showSource = developerMode || !isLive;

  return (
    <View style={styles.container}>
      {/* Top row: location on the left, vertically centered on the
          buttons; All sounds (white) and the quick mute (deepBlue) as
          rounded square buttons on the right. */}
      <View style={styles.topRow}>
        <View style={styles.location}>{location}</View>
        <View style={styles.controls}>
          {/* Opens the Sound library, with the current conditions under
              "Right now". router.push rather than <Link asChild>: Link
              drops a pressed-state style function, which left this button
              without its square. */}
          <SquareButton
            variant="card"
            onPress={() =>
              router.push({
                pathname: '/sounds',
                params: { current: sortByPriority(weather.current.conditions).join(',') },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="All sounds"
            accessibilityHint="Hear and feel every weather condition"
          >
            <SoundsIcon size={SOUNDS_ICON_SIZE} color={squareButtonIconColor(theme, 'card')} />
          </SquareButton>
          <MuteButton />
        </View>
      </View>
      {locationNote}
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
    // Left-aligned, like the frames.
    container: {
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    topRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: SQUARE_BUTTON_SIZE,
    },
    // Takes the room the buttons leave, so a long name wraps, never runs
    // under them.
    location: {
      flex: 1,
    },
    controls: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: theme.colors.heading,
    },
    pillText: {
      ...typography.caption,
      fontWeight: '700',
      color: theme.colors.heading,
    },
    note: {
      ...typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}
