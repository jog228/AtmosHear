import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { cardShadow, radius, spacing, type Theme } from '@/constants/theme';
import { useThemeSettings } from '@/hooks/use-theme';
import type { Appearance } from '@/services/preferences';

const APPEARANCE_OPTIONS: { value: Appearance; label: string; description?: string }[] = [
  { value: 'system', label: 'System', description: 'Matches your phone’s light or dark mode' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { theme, appearance, setAppearance, highContrast, setHighContrast } = useThemeSettings();
  const styles = createStyles(theme);

  return (
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Appearance
        </Text>
        <View style={styles.card} accessibilityRole="radiogroup">
          {APPEARANCE_OPTIONS.map((option, i) => {
            const selected = appearance === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.row, i > 0 && styles.divider]}
                onPress={() => setAppearance(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={option.label}
                accessibilityHint={option.description}
              >
                <View style={styles.text}>
                  <Text style={styles.label}>{option.label}</Text>
                  {option.description && <Text style={styles.description}>{option.description}</Text>}
                </View>
                {selected && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={22}
                    tintColor={theme.colors.accent}
                    accessible={false}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        {highContrast && (
          <Text style={styles.note}>High contrast is on, so it’s used instead of this setting.</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Accessibility
        </Text>
        <Pressable
          style={[styles.card, styles.row]}
          onPress={() => setHighContrast(!highContrast)}
          accessibilityRole="switch"
          accessibilityState={{ checked: highContrast }}
          accessibilityLabel="High contrast"
          accessibilityHint="Uses light text on a dark background with yellow accents, in light or dark mode"
        >
          <View style={styles.text}>
            <Text style={styles.label}>High contrast</Text>
            <Text style={styles.description}>
              Light text on a dark background with yellow accents. Overrides Appearance.
            </Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            trackColor={{ false: theme.colors.switchTrackOff, true: theme.colors.switchTrackOn }}
            ios_backgroundColor={theme.colors.switchTrackOff}
            thumbColor={theme.colors.switchThumb}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      gap: spacing.lg,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.heading,
      marginLeft: spacing.xs,
    },
    card: {
      borderRadius: radius.md,
      ...cardShadow(theme),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      padding: spacing.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
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
    note: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: spacing.xs,
    },
  });
}
