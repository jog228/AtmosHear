import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { RippleLoader } from './brand';

// A ripple of dots instead of a spinner (still with Reduce Motion).
export function LoadingState() {
  const styles = createStyles(useTheme());

  return (
    <View style={styles.container} accessible accessibilityLabel="Loading the weather">
      <RippleLoader size={160} />
      <Text style={styles.message}>Checking the sky…</Text>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const styles = createStyles(useTheme());

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        We couldn’t get the weather
      </Text>
      <Text style={styles.message}>
        Check your internet connection and try again.
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.heading,
      textAlign: 'center',
    },
    message: {
      fontSize: 17,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    button: {
      minHeight: 56,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.buttonBackground,
    },
    pressed: {
      opacity: 0.85,
    },
    buttonLabel: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.buttonText,
    },
  });
}
