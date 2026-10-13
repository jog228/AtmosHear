import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { cardShadow, radius, spacing, type Theme } from '@/constants/theme';
import { useThemeSettings } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const { theme, highContrast, setHighContrast } = useThemeSettings();
  const styles = createStyles(theme);

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <Pressable
        style={styles.row}
        onPress={() => setHighContrast(!highContrast)}
        accessibilityRole="switch"
        accessibilityState={{ checked: highContrast }}
        accessibilityLabel="High contrast"
        accessibilityHint="Uses light text on a dark background with yellow accents"
      >
        <View style={styles.text}>
          <Text style={styles.label}>High contrast</Text>
          <Text style={styles.description}>
            Light text on a dark background with yellow accents.
          </Text>
        </View>
        <Switch
          value={highContrast}
          onValueChange={setHighContrast}
          trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
          ios_backgroundColor={theme.colors.border}
          thumbColor={theme.colors.card}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
      </Pressable>
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 64,
      padding: spacing.md,
      borderRadius: radius.md,
      ...cardShadow(theme),
    },
    text: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });
}
