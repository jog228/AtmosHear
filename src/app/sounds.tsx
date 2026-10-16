import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import { CONDITION_IDS, type ConditionId } from '@/constants/conditions';
import { cardShadow, radius, spacing, typography, type Theme } from '@/constants/theme';
import { useCuePreview } from '@/hooks/use-cue-preview';
import { useTheme } from '@/hooks/use-theme';

// The Sound library (design/frames/09_Sound_library.png): every condition's
// sound, one at a time. Play previews the sound, vibration, and light
// together; tapping a row opens that condition's cues.
export default function SoundsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const preview = useCuePreview();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Sounds
        </Text>
        <Text style={styles.subtitle}>Tap play to hear each condition</Text>
      </View>
      <View>
        {CONDITION_IDS.map((id, i) => (
          <SoundRow
            key={id}
            id={id}
            playing={preview.playing === id}
            divider={i < CONDITION_IDS.length - 1 && preview.playing !== id && preview.playing !== CONDITION_IDS[i + 1]}
            onToggle={() => preview.toggle(id)}
            theme={theme}
          />
        ))}
      </View>
    </ScrollView>
  );
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
  const { label, soundDescription, icon: Icon } = conditionProfiles[id];
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
        <Icon size={32} color={theme.colors.accent} />
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
