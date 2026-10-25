import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConditionIcon } from '@/components/weather-icon';
import { sortByPriority } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import { CONDITION_IDS, type ConditionId } from '@/constants/conditions';
import { cardShadow, radius, spacing, typography, type Theme } from '@/constants/theme';
import { useCuePreview } from '@/hooks/use-cue-preview';
import { useTheme } from '@/hooks/use-theme';

// The Sound library (design/frames/09_Sound_library.png): every condition's
// sound, one at a time. Play previews the sound, vibration, and light
// together; tapping a row opens that condition's cues. Opened from the
// Weather screen with the current conditions (`current`, comma-separated),
// which come first under "Right now"; without them, only the full list.
export default function SoundsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const preview = useCuePreview();
  const { current: param } = useLocalSearchParams<{ current?: string }>();
  const current = sortByPriority(
    (param ?? '').split(',').filter((id): id is ConditionId => CONDITION_IDS.includes(id as ConditionId)),
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Sounds
        </Text>
        <Text style={styles.subtitle}>Tap play to hear each condition</Text>
      </View>
      {current.length > 0 && (
        <View>
          <Text style={styles.section} accessibilityRole="header">
            Right now
          </Text>
          <SoundList ids={current} playing={preview.playing} onToggle={preview.toggle} theme={theme} />
        </View>
      )}
      <View>
        {current.length > 0 && (
          <Text style={styles.section} accessibilityRole="header">
            All conditions
          </Text>
        )}
        <SoundList ids={CONDITION_IDS} playing={preview.playing} onToggle={preview.toggle} theme={theme} />
      </View>
    </ScrollView>
  );
}

// Rows with thin lines between them, except around the playing row (it's
// a card).
function SoundList({
  ids,
  playing,
  onToggle,
  theme,
}: {
  ids: readonly ConditionId[];
  playing: ConditionId | null;
  onToggle: (id: ConditionId) => void;
  theme: Theme;
}) {
  return ids.map((id, i) => (
    <SoundRow
      key={id}
      id={id}
      playing={playing === id}
      divider={i < ids.length - 1 && playing !== id && playing !== ids[i + 1]}
      onToggle={() => onToggle(id)}
      theme={theme}
    />
  ));
}

function SoundRow({
  id,
  playing,
  divider,
  onToggle,
  theme,
}: {
  id: ConditionId;
  playing: boolean;
  divider: boolean;
  onToggle: () => void;
  theme: Theme;
}) {
  const styles = createStyles(theme);
  const { label, soundDescription } = conditionProfiles[id];
  const name = label.toLowerCase();

  return (
    <View style={[styles.row, playing && styles.playingRow, divider && styles.divider]}>
      <Pressable
        style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
        onPress={() => router.push({ pathname: '/condition/[id]', params: { id } })}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${soundDescription}`}
        accessibilityHint="Shows its sound, vibration, and light"
      >
        <ConditionIcon id={id} />
        <View style={styles.rowText}>
          <Text style={styles.name}>{label}</Text>
          <Text style={styles.description}>{soundDescription}</Text>
        </View>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.playButton, playing && styles.pauseButton, pressed && styles.pressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${playing ? 'Pause' : 'Play'} ${name}`}
      >
        <SymbolView
          name={
            playing
              ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
              : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
          }
          size={20}
          tintColor={playing ? theme.colors.onHighlight : theme.colors.buttonText}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

const PLAY_SIZE = 52;

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      ...typography.h1,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      ...typography.body,
      color: theme.colors.textSecondary,
    },
    // "Right now" and "All conditions", like the forecast headlines.
    section: {
      ...typography.h2,
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    // The playing row: a card that reaches a little past the list's edges.
    playingRow: {
      ...cardShadow(theme),
      borderRadius: radius.md,
      marginHorizontal: -spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    rowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: PLAY_SIZE,
    },
    rowText: {
      flex: 1,
    },
    name: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      color: theme.colors.textPrimary,
    },
    description: {
      ...typography.body,
      color: theme.colors.textSecondary,
    },
    playButton: {
      width: PLAY_SIZE,
      height: PLAY_SIZE,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.buttonBackground,
    },
    pauseButton: {
      backgroundColor: theme.colors.highlight,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
