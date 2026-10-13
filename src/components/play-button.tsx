import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function PlayButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Play weather"
      accessibilityHint="Plays the sound and vibration for the current weather"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <SymbolView
        name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
        size={24}
        tintColor={theme.colors.buttonText}
        accessible={false}
      />
      <Text style={styles.label}>Play weather</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: 64,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
      alignSelf: 'stretch',
      backgroundColor: theme.colors.buttonBackground,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.buttonText,
    },
  });
}
