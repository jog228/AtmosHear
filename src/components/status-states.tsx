import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

export function LoadingState() {
  return (
    <View style={styles.container} accessible accessibilityLabel="Loading the weather">
      <ActivityIndicator size="large" color={colors.textMuted} />
      <Text style={styles.message}>Checking the sky…</Text>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
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

const styles = StyleSheet.create({
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
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    color: colors.textMuted,
    textAlign: 'center',
  },
  button: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.card,
  },
});
