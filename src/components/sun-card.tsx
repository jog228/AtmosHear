import { useCalendars } from 'expo-localization';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, type Theme } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useTheme } from '@/hooks/use-theme';
import type { Place } from '@/services/location';
import { formatDuration, formatTimeOfDay, resolveSunTimes, sunPhase } from '@/services/sun-times';
import type { WeatherData } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { SunriseIcon, SunsetIcon, type DotIconComponent } from './icons';
import { SunArc } from './sun-arc';

type Props = {
  weather: WeatherData;
  place: Place;
  // False while another tab is showing: stops the once-a-minute countdown
  // and clock update.
  visible: boolean;
};

// Sunrise and sunset, with how much daylight is left (or, at night, how
// long until sunrise), and a dotted arc showing where the sun is now.
export function SunCard({ weather, place, visible }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const now = useMinuteClock(visible);

  const times = resolveSunTimes(now, weather.sun, place.latitude, place.longitude);

  // Polar day or night: no sunrise or sunset to show.
  if (!times) {
    return (
      <GlassCard style={styles.card} accessible accessibilityLabel="No sunrise or sunset today">
        <Text style={styles.status}>No sunrise or sunset today</Text>
      </GlassCard>
    );
  }

  const phase = sunPhase(now, times);
  const sunrise = formatTimeOfDay(times.sunrise, uses24Hour);
  const sunset = formatTimeOfDay(times.sunset, uses24Hour);
  const duration = formatDuration(phase.kind === 'day' ? phase.daylightLeftMs : phase.untilSunriseMs);
  const status = phase.kind === 'day' ? `${duration.short} of daylight left` : `Sunrise in ${duration.short}`;
  const progress = phase.kind === 'day' ? (now - times.sunrise) / (times.sunset - times.sunrise) : null;
  const spokenStatus =
    phase.kind === 'day' ? `${duration.spoken} of daylight left` : `sunrise in ${duration.spoken}`;

  return (
    <GlassCard
      style={styles.card}
      accessible
      accessibilityLabel={`Sunrise ${sunrise}, sunset ${sunset}, ${spokenStatus}`}
    >
      <View style={styles.times}>
        <SunTime label="Sunrise" time={sunrise} icon={SunriseIcon} color={theme.colors.accent} theme={theme} />
        <SunTime label="Sunset" time={sunset} icon={SunsetIcon} color={theme.colors.accent} theme={theme} alignRight />
      </View>

      <SunArc progress={progress} now={now} />

      <Text style={styles.status}>{status}</Text>
    </GlassCard>
  );
}

function SunTime({
  label,
  time,
  icon: Icon,
  color,
  theme,
  alignRight,
}: {
  label: string;
  time: string;
  icon: DotIconComponent;
  color: string;
  theme: Theme;
  alignRight?: boolean;
}) {
  const styles = createStyles(theme);
  return (
    <View style={[styles.time, alignRight && styles.textRight]}>
      <View style={[styles.labelRow, alignRight && styles.labelRowRight]}>
        <Icon size={22} color={color} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{time}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      padding: spacing.md + spacing.xs,
      gap: spacing.md,
    },
    times: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    // A small label over a big bold time, like the frames.
    time: {
      gap: 2,
    },
    textRight: {
      alignItems: 'flex-end',
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    labelRowRight: {
      flexDirection: 'row-reverse',
    },
    label: {
      ...typography.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    value: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      color: theme.colors.textPrimary,
    },
    status: {
      ...typography.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
