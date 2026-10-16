import { StyleSheet, Text } from 'react-native';

import { LARGE_TEXT_MAX_SCALE, typography, type Theme } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useTheme } from '@/hooks/use-theme';
import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';
import { getGreeting } from '@/services/greeting';
import type { Place } from '@/services/location';
import { resolveSunTimes } from '@/services/sun-times';
import type { WeatherData } from '@/services/weather-data';

type Props = {
  weather: WeatherData;
  place: Place;
  // False while another tab is showing: stops the once-a-minute check.
  visible: boolean;
};

// "Good evening!", or "Good evening, Jolie!" with the name saved in
// Preferences, following today's sunset. Checks each minute and on return
// to the app; Developer "Simulate time" applies too. Not announced when it
// changes: VoiceOver reads it in order after the location and buttons, as
// one line. It's the screen's headline (and its VoiceOver header).
export function Greeting({ weather, place, visible }: Props) {
  const styles = createStyles(useTheme());
  const clock = useMinuteClock(visible);
  const { simulatedTime, now: openingNow, name } = useOpeningPreferences();
  const now = simulatedTime ? openingNow() : new Date(clock);

  const sun = resolveSunTimes(now.getTime(), weather.sun, place.latitude, place.longitude);
  const greeting = getGreeting(now, sun ? new Date(sun.sunset) : null, name);
  // With a name, always two lines: "Good afternoon," / "Jolie!". The first
  // line never splits; the name can wrap if it's ever too wide.
  const [first, ...rest] = greeting.split(', ');
  const display = [first.replace(/ /g, '\u00A0'), ...rest].join(',\n');

  return (
    // Always full size, scaled only by the phone's text size setting (capped
    // at 1.3×). No auto-shrink: on iOS it shrank the text far too much. In
    // the rare case a line is too wide (a long name at the largest sizes),
    // it wraps instead.
    <Text
      style={styles.greeting}
      accessibilityRole="header"
      accessibilityLabel={greeting}
      allowFontScaling
      maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}
    >
      {display}
    </Text>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    // A big bold left-aligned headline. The temperature (display) stays the
    // largest text.
    greeting: {
      ...typography.h2,
      color: theme.colors.textPrimary,
    },
  });
}
