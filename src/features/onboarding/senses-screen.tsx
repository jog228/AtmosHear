import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ConditionIcon } from '@/components/weather-icon';
import { conditionProfiles } from '@/constants/condition-profiles';
import { CONDITION_IDS, type ConditionId } from '@/constants/conditions';
import { cardShadow, FONT_FAMILY, palette, spacing, withAlpha, type Theme } from '@/constants/theme';
import { useCuePreview } from '@/hooks/use-cue-preview';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { cuePreview } from '@/services/cue-preview';

import { OnboardingPage } from './onboarding-page';

// The eight tiles; the rest are behind "+6 More".
const GRID: ConditionId[] = ['clear', 'partly-cloudy', 'overcast', 'light-rain', 'snow', 'hail', 'fog', 'wind'];
const MORE_COUNT = CONDITION_IDS.length - GRID.length;
const TILE = 78;
const GLOW = 6;

// Screen 2 of 5: tap a weather tile to play its sound, vibration, and light
// together, through the same preview player as the Sound library (one at a
// time, light cues kept flash-safe). "+6 More" opens the whole library as a
// modal. The chips show which senses a preview uses.
export function SensesScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const preview = useCuePreview();

  // Stop when this screen loses focus (going on, or opening the library).
  useFocusEffect(useCallback(() => () => cuePreview.stop(), []));

  return (
    <OnboardingPage
      step={2}
      hero={
        <View style={styles.hero}>
          <View style={styles.grid}>
            {GRID.map((id) => (
              <ConditionTile
                key={id}
                id={id}
                playing={preview.playing === id}
                onPress={() => preview.toggle(id)}
                theme={theme}
              />
            ))}
            <MoreTile
              theme={theme}
              onPress={() => {
                preview.stop();
                router.push('/onboarding/sounds');
              }}
            />
          </View>
          <SenseChips theme={theme} />
        </View>
      }
      title={'Hear it. Feel it.\nSee it.'}
      titleSize={44}
      body="Tap any weather to play its sound, vibration and light together."
      button={{ label: 'Continue', onPress: () => router.push('/onboarding/night') }}
    />
  );
}

function ConditionTile({ id, playing, onPress, theme }: { id: ConditionId; playing: boolean; onPress: () => void; theme: Theme }) {
  const styles = createStyles(theme);
  const label = conditionProfiles[id].label;
  return (
    <View style={styles.cell}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.tile, playing && styles.tilePlaying, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${playing ? 'Pause' : 'Play'} ${label.toLowerCase()}`}
      >
        {playing && <View style={styles.glow} />}
        <ConditionIcon id={id} size={44} color={playing ? theme.colors.buttonText : undefined} />
        {playing && (
          <View style={styles.badge}>
            <SymbolView
              name={{ ios: 'pause.fill', android: 'pause', web: 'pause' }}
              size={12}
              tintColor={theme.colors.onHighlight}
              accessible={false}
            />
          </View>
        )}
      </Pressable>
      <Text style={styles.tileLabel} numberOfLines={2} accessible={false}>
        {label}
      </Text>
    </View>
  );
}

function MoreTile({ onPress, theme }: { onPress: () => void; theme: Theme }) {
  const styles = createStyles(theme);
  return (
    <View style={styles.cell}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.tile, styles.moreTile, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${MORE_COUNT} more sounds`}
        accessibilityHint={`Opens the Sound library with all ${CONDITION_IDS.length} conditions`}
      >
        <Text style={styles.moreText} maxFontSizeMultiplier={1.4}>
          +{MORE_COUNT}
        </Text>
      </Pressable>
      <Text style={styles.tileLabel} accessible={false}>
        More
      </Text>
    </View>
  );
}

type Chip = { label: string; icon: SymbolViewProps['name'] };
const SOUND: Chip = { label: 'Sound', icon: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' } };
const VIBRATION: Chip = { label: 'Vibration', icon: { ios: 'iphone.radiowaves.left.and.right', android: 'vibration', web: 'vibration' } };
const LIGHT: Chip = { label: 'Light', icon: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' } };

// Which senses a preview uses. Vibration is the Preferences Vibration
// switch (previews follow it). Sound and Light always play in previews
// (the "Ambient sound" setting is the Weather loop, not previews), so
// those two only show it.
function SenseChips({ theme }: { theme: Theme }) {
  const { preferences, updatePreferences } = usePreferences();
  return (
    <View style={createStyles(theme).chips}>
      <SenseChip chip={SOUND} on theme={theme} />
      <SenseChip
        chip={VIBRATION}
        on={preferences.vibration}
        onToggle={() => updatePreferences({ vibration: !preferences.vibration })}
        theme={theme}
      />
      <SenseChip chip={LIGHT} on theme={theme} />
    </View>
  );
}

function SenseChip({ chip, on, onToggle, theme }: { chip: Chip; on: boolean; onToggle?: () => void; theme: Theme }) {
  const styles = createStyles(theme);
  const color = on ? theme.colors.buttonText : theme.colors.buttonBackground;
  const content = (
    <>
      <SymbolView name={chip.icon} size={16} tintColor={color} accessible={false} />
      <Text style={[styles.chipText, { color }]}>{chip.label}</Text>
    </>
  );
  if (!onToggle) {
    return (
      <View style={[styles.chip, styles.chipOn]} accessible accessibilityLabel={`${chip.label}, used in previews`}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.chip, on ? styles.chipOn : styles.chipOff, pressed && styles.pressed]}
      hitSlop={4}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={chip.label}
      accessibilityHint="Turns vibration on or off, here and in the app"
    >
      {content}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  const { colors } = theme;
  // Unselected chip border: the light line on mist, the theme border otherwise.
  const line = theme.name === 'light' ? palette.line : colors.border;
  return StyleSheet.create({
    hero: {
      alignSelf: 'stretch',
      gap: spacing.lg,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: spacing.md,
    },
    cell: {
      width: '33.333%',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    tile: {
      ...cardShadow(theme),
      width: TILE,
      height: TILE,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tilePlaying: {
      backgroundColor: colors.buttonBackground,
    },
    // A 6pt amber ring around the playing tile.
    glow: {
      position: 'absolute',
      top: -GLOW,
      left: -GLOW,
      width: TILE + 2 * GLOW,
      height: TILE + 2 * GLOW,
      borderRadius: 23 + GLOW,
      borderWidth: GLOW,
      borderColor: withAlpha(colors.highlight, 0.35),
    },
    badge: {
      position: 'absolute',
      top: -10,
      right: -10,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.highlight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreTile: {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.illustration.dots,
    },
    moreText: {
      fontFamily: FONT_FAMILY,
      fontSize: 24,
      fontWeight: '800',
      color: theme.illustration.dots,
    },
    tileLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 13,
      lineHeight: 17,
      textAlign: 'center',
      color: colors.textPrimary,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    chip: {
      minHeight: 38,
      borderRadius: 19,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md,
    },
    chipOn: {
      backgroundColor: colors.buttonBackground,
    },
    chipOff: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: line,
    },
    chipText: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      fontWeight: '700',
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
