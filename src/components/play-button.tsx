import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

type Props = {
  color: string;
  onPress: () => void;
};

export function PlayButton({ color, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Play weather"
      accessibilityHint="Plays the sound and vibration for the current weather"
      style={({ pressed }) => [styles.button, { backgroundColor: color, opacity: pressed ? 0.85 : 1 }]}
    >
      <SymbolView
        name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
        size={24}
        tintColor={colors.onAccent}
        accessible={false}
      />
      <Text style={styles.label}>Play weather</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.onAccent,
  },
});
