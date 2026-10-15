import { useCalendars } from 'expo-localization';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { spacing, type Theme } from '@/constants/theme';
import { useIsForeground } from '@/hooks/use-is-foreground';
import { useConditionColor, useTheme } from '@/hooks/use-theme';
import type { Place } from '@/services/location';
import { formatDuration, formatTimeOfDay, resolveSunTimes, sunPhase } from '@/services/sun-times';
import type { WeatherData } from '@/services/weather-data';

import { GlassCard } from './glass-card';

type Props = {
  weather: WeatherData;
  place: Place;
  // False while another tab is showing: stops the once-a-minute countdown
  // update.
  visible: boolean;
};

// Sunrise and sunset, with how much daylight is left (or, at night, how
// long until sunrise).
export function SunCard({ weather, place, visible }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const accent = useConditionColor(mostSignificant(weather.current.conditions));
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
  const spokenStatus =
    phase.kind === 'day' ? `${duration.spoken} of daylight left` : `sunrise in ${duration.spoken}`;

  return (
    <GlassCard
      style={styles.card}
      accessible
      accessibilityLabel={`Sunrise ${sunrise}, sunset ${sunset}, ${spokenStatus}`}
    >
      <View style={styles.times}>
        <SunTime label="Sunrise" time={sunrise} icon={{ ios: 'sunrise.fill', android: 'wb_twilight', web: 'wb_twilight' }} color={accent} theme={theme} />
        <SunTime label="Sunset" time={sunset} icon={{ ios: 'sunset.fill', android: 'wb_twilight', web: 'wb_twilight' }} color={accent} theme={theme} alignRight />
      </View>

      <Text style={styles.status}>{status}</Text>
    </GlassCard>
  );
}

function SunTime({
  label,
  time,
  icon,
  color,
  theme,
  alignRight,
}: {
  label: string;
  time: string;
  icon: SymbolViewProps['name'];
  color: string;
  theme: Theme;
  alignRight?: boolean;
}) {
  const styles = createStyles(theme);
  return (
    <View style={[styles.time, alignRight && styles.timeRight]}>
      <SymbolView name={icon} size={20} tintColor={color} accessible={false} />
      <View style={alignRight && styles.textRight}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{time}</Text>
      </View>
    </View>
  );
}

// The current time, refreshed on each new minute while `active`, and right
// away when it becomes active again.
function useMinuteClock(active: boolean): number {
  const foreground = useIsForeground();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !foreground) return;
    const tick = () => setNow(Date.now());
    let interval: ReturnType<typeof setInterval> | undefined;
    const catchUp = setTimeout(tick, 0);
    // Line up with the start of the next minute, then every minute.
    const align = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(catchUp);
      clearTimeout(align);
      clearInterval(interval);
    };
  }, [active, foreground]);

  return now;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    times: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    time: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    timeRight: {
      flexDirection: 'row-reverse',
    },
    textRight: {
      alignItems: 'flex-end',
    },
    label: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    status: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
