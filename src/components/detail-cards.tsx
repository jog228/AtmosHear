import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, type LayoutChangeEvent } from 'react-native';

import { getAqiLevel } from '@/constants/air-quality';
import type { ConditionId } from '@/constants/conditions';
import { spacing, typography, type Theme } from '@/constants/theme';
import { useTemperature } from '@/hooks/use-temperature';
import { useTheme } from '@/hooks/use-theme';
import type { AirQuality, CurrentWeather } from '@/services/weather-data';

import { GlassCard } from './glass-card';
import { AirQualityIcon, FeelsLikeIcon, HumidityIcon, type DotIconComponent } from './icons';
import { ConditionIcon } from './weather-icon';

type Detail = {
  label: string;
  value: string;
  // The whole card, as VoiceOver reads it.
  spoken: string;
  // A detail icon, or a condition whose icon stands for it (wind, rain, UV
  // as clear's sun, snow), drawn through ConditionIcon like everywhere else.
  icon: DotIconComponent | ConditionId;
};

const DETAIL_ICON_SIZE = 26;

// Three cards fit on screen, plus this share of the next one peeking in at
// the right edge so it's clear the row scrolls, like the frames.
const VISIBLE_CARDS = 3;
const PEEK = 0.45;
const GAP = spacing.sm;
// The row reaches the screen edges (the page has spacing.md padding), so
// cards scroll all the way across and their shadows aren't cut off.
const BLEED = spacing.md;
// Room for the card shadows above and below, inside the scroll view.
const SHADOW_TOP = spacing.md;
const SHADOW_BOTTOM = spacing.lg;

export function DetailCards({ current, airQuality }: { current: CurrentWeather; airQuality: AirQuality | null }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Card width from the row's width (the screen width until measured).
  const { width: windowWidth } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState<number | null>(null);
  const width = rowWidth ?? windowWidth;
  const cardWidth = (width - BLEED - VISIBLE_CARDS * GAP) / (VISIBLE_CARDS + PEEK);

  const temperature = useTemperature();
  const details = describeDetails(current, airQuality, temperature.value(current.feelsLike));

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
          {/* Accent color, like the frames: 3:1 or more on cards in every theme. */}
          {typeof detail.icon === 'string' ? (
            <ConditionIcon id={detail.icon} size={DETAIL_ICON_SIZE} />
          ) : (
            <detail.icon size={DETAIL_ICON_SIZE} color={theme.colors.accent} />
          )}
          <Text style={styles.value}>{detail.value}</Text>
          <Text style={styles.label}>{detail.label}</Text>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

// `feelsLike` is already in the chosen unit.
function describeDetails(current: CurrentWeather, airQuality: AirQuality | null, feelsLike: number): Detail[] {
  const { uvIndex, snowToday } = current;
  const uvLevel = uvIndex === null ? null : uvLevelName(uvIndex);
  const aqiLevel = airQuality ? getAqiLevel(airQuality.level) : null;
  return [
    {
      label: 'Wind',
      value: `${current.windSpeed} mph`,
      spoken: `Wind, ${current.windSpeed} miles per hour`,
      icon: 'wind',
    },
    {
      label: 'Humidity',
      value: `${current.humidity}%`,
      spoken: `Humidity, ${current.humidity} percent`,
      icon: HumidityIcon,
    },
    {
      label: 'Rain',
      value: `${current.rainChance}%`,
      spoken: `Rain, ${current.rainChance} percent chance`,
      icon: 'light-rain',
    },
    {
      label: 'Feels like',
      value: `${feelsLike}°`,
      spoken: `Feels like, ${feelsLike} degrees`,
      icon: FeelsLikeIcon,
    },
    {
      // "7" with "UV · High". NWS has no UV: a dash, never a made-up value.
      label: uvLevel ? `UV · ${uvLevel}` : 'UV',
      value: uvIndex === null ? '–' : String(uvIndex),
      spoken: uvIndex === null ? 'UV index unavailable' : `UV index ${uvIndex}, ${uvLevel?.toLowerCase()}`,
      icon: 'clear',
    },
    {
      // 2.5" (one decimal), or 0" when none. NWS has no snowfall amounts.
      label: 'Snow today',
      value: snowToday === null ? '–' : `${formatInches(snowToday)}"`,
      spoken:
        snowToday === null
          ? 'Snowfall unavailable'
          : `Snow today, ${formatInches(snowToday)} ${snowToday === 1 ? 'inch' : 'inches'}`,
      icon: 'snow',
    },
    {
      // "42" with "Air · Good". Text stays the usual colors, not color-coded
      // by level, so it keeps its contrast and matches the other cards.
      label: aqiLevel ? `Air · ${aqiLevel.label}` : 'Air',
      value: airQuality ? String(airQuality.aqi) : '–',
      spoken: airQuality && aqiLevel
        ? `Air quality index ${airQuality.aqi}, ${aqiLevel.name.toLowerCase()}`
        : 'Air quality unavailable',
      icon: AirQualityIcon,
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
    // Icon, value, and label stacked on the left, like the frames.
    card: {
      alignItems: 'flex-start',
      gap: spacing.xs,
      padding: spacing.md,
    },
    value: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
    },
    label: {
      ...typography.caption,
      color: theme.colors.textSecondary,
    },
  });
}
