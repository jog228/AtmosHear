import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { mostSignificant } from '@/constants/condition-priority';
import { spacing, type Theme } from '@/constants/theme';
import { useConditionColor, useTheme } from '@/hooks/use-theme';
import type { CurrentWeather } from '@/services/weather-data';

import { GlassCard } from './glass-card';

type Detail = {
  label: string;
  value: string;
  // The whole card, as VoiceOver reads it.
  spoken: string;
  icon: SymbolViewProps['name'];
};

// Four cards fit on screen, plus this share of the next one peeking in at
// the right edge so it's clear the row scrolls.
const VISIBLE_CARDS = 4;
const PEEK = 0.18;
const GAP = spacing.sm;
// The row reaches the screen edges (the page has spacing.md padding), so
// cards scroll all the way across and their shadows aren't cut off.
const BLEED = spacing.md;
// Room for the card shadows above and below, inside the scroll view.
const SHADOW_TOP = spacing.md;
const SHADOW_BOTTOM = spacing.lg;

export function DetailCards({ current }: { current: CurrentWeather }) {
  const styles = createStyles(useTheme());
  const accent = useConditionColor(mostSignificant(current.conditions));

  // Card width from the row's width (the screen width until measured).
  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState<number | null>(null);
  const width = rowWidth ?? windowWidth;
  const cardWidth = (width - BLEED - VISIBLE_CARDS * GAP) / (VISIBLE_CARDS + PEEK);

  const details = describeDetails(current);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + GAP}
      decelerationRate="fast"
      style={styles.scroller}
      contentContainerStyle={styles.row}
      onLayout={(event: LayoutChangeEvent) => setRowWidth(event.nativeEvent.layout.width)}
    >
      {details.map((detail, i) => (
        <GlassCard
          key={detail.label}
          style={[styles.card, { width: cardWidth }]}
          accessible
          // iOS can't announce a label on the row itself, so the first card
          // says what the row is as VoiceOver enters it.
          accessibilityLabel={i === 0 ? `Weather details, ${details.length} items. ${detail.spoken}` : detail.spoken}
        >
          <SymbolView name={detail.icon} size={22} tintColor={accent} accessible={false} />
          <Text style={styles.value}>{detail.value}</Text>
          <Text style={styles.label}>{detail.label}</Text>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

function describeDetails(current: CurrentWeather): Detail[] {
  const { uvIndex, snowToday } = current;
  const uvLevel = uvIndex === null ? null : uvLevelName(uvIndex);
  return [
    {
      label: 'Wind',
      value: `${current.windSpeed} mph`,
      spoken: `Wind, ${current.windSpeed} miles per hour`,
      icon: { ios: 'wind', android: 'air', web: 'air' },
    },
    {
      label: 'Humidity',
      value: `${current.humidity}%`,
      spoken: `Humidity, ${current.humidity} percent`,
      icon: { ios: 'humidity.fill', android: 'humidity_percentage', web: 'humidity_percentage' },
    },
    {
      label: 'Rain',
      value: `${current.rainChance}%`,
      spoken: `Rain, ${current.rainChance} percent chance`,
      icon: { ios: 'umbrella.fill', android: 'umbrella', web: 'umbrella' },
    },
    {
      label: 'Feels like',
      value: `${current.feelsLike}°`,
      spoken: `Feels like, ${current.feelsLike} degrees`,
      icon: { ios: 'thermometer.medium', android: 'thermometer', web: 'thermometer' },
    },
    {
      // "7" with "UV · High". NWS has no UV: a dash, never a made-up value.
      label: uvLevel ? `UV · ${uvLevel}` : 'UV',
      value: uvIndex === null ? '–' : String(uvIndex),
      spoken: uvIndex === null ? 'UV index unavailable' : `UV index ${uvIndex}, ${uvLevel?.toLowerCase()}`,
      icon: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' },
    },
    {
      // 2.5" (one decimal), or 0" when none. NWS has no snowfall amounts.
      label: 'Snow today',
      value: snowToday === null ? '–' : `${formatInches(snowToday)}"`,
      spoken:
        snowToday === null
          ? 'Snowfall unavailable'
          : `Snow today, ${formatInches(snowToday)} ${snowToday === 1 ? 'inch' : 'inches'}`,
      icon: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' },
    },
  ];
}

// WHO UV index levels.
function uvLevelName(uv: number): string {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very high';
  return 'Extreme';
}

// 2.54 -> "2.5", 3 -> "3", 0 -> "0".
function formatInches(inches: number): string {
  return String(Math.round(inches * 10) / 10);
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    scroller: {
      marginHorizontal: -BLEED,
      marginTop: -SHADOW_TOP,
      marginBottom: -SHADOW_BOTTOM,
    },
    row: {
      gap: GAP,
      paddingHorizontal: BLEED,
      paddingTop: SHADOW_TOP,
      paddingBottom: SHADOW_BOTTOM,
    },
    card: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    value: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    label: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
}
