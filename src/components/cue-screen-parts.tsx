import { StyleSheet, Text } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { LARGE_TEXT_MAX_SCALE, typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { PrimaryButton } from './primary-button';

// Parts of the condition detail screen.

// The big condition name. Long single words ("Thunderstorm") shrink to fit
// rather than run off the screen.
export function ConditionName({ condition }: { condition: ConditionId }) {
  const styles = createStyles(useTheme());
  return (
    <Text
      style={styles.name}
      accessibilityRole="header"
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.5}
      maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}
    >
      {conditionProfiles[condition].label}
    </Text>
  );
}

// "Play all cues" ↔ "Stop cues": sound, vibration, and light together.
export function PlayAllButton({ playing, onPress }: { playing: boolean; onPress: () => void }) {
  return (
    <PrimaryButton
      label={playing ? 'Stop cues' : 'Play all cues'}
      icon={playing ? 'stop' : 'play'}
      onPress={onPress}
      accessibilityHint={playing ? undefined : 'Plays the sound, vibration, and light together'}
    />
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    name: {
      ...typography.display,
      color: theme.colors.textPrimary,
    },
  });
}
