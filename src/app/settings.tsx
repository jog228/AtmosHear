import { ScrollView, StyleSheet, Text } from 'react-native';

import { DeveloperSettings } from '@/components/developer-settings';
import { GlassBackdrop } from '@/components/glass-backdrop';
import { GlassCard } from '@/components/glass-card';
import { OptionGroup, SettingsSection, SwitchRow } from '@/components/settings-rows';
import { spacing, type Theme } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
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
  const { preferences, updatePreferences } = usePreferences();

  return (
    <GlassBackdrop style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <SettingsSection title="Appearance">
          <OptionGroup options={APPEARANCE_OPTIONS} selected={appearance} onSelect={setAppearance} />
          {highContrast && (
            <Text style={styles.note}>High contrast is on, so it’s used instead of this setting.</Text>
          )}
        </SettingsSection>

        <SettingsSection title="Sound and vibration">
          <GlassCard>
            <SwitchRow
              label="Ambient sound"
              description="A quiet looping sound for the current weather. Adjust it with your volume buttons."
              accessibilityLabel="Ambient weather sound"
              accessibilityHint="Plays a quiet looping sound for the current weather while the app is open"
              value={preferences.ambientSound}
              onValueChange={(value) => updatePreferences({ ambientSound: value })}
            />
            <SwitchRow
              label="Vibration"
              description="A tap rhythm for the weather when it loads or changes, or when you tap the weather icon. Severe alerts always vibrate."
              accessibilityLabel="Weather vibration"
              accessibilityHint="Vibrates a pattern for the current weather. Severe alerts vibrate even when this is off"
              value={preferences.vibration}
              onValueChange={(value) => updatePreferences({ vibration: value })}
              divider
            />
          </GlassCard>
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <GlassCard>
            <SwitchRow
              label="High contrast"
              description="Light text on a dark background with yellow accents. Overrides Appearance."
              accessibilityHint="Uses light text on a dark background with yellow accents, in light or dark mode"
              value={highContrast}
              onValueChange={setHighContrast}
            />
          </GlassCard>
        </SettingsSection>

        <DeveloperSettings />
      </ScrollView>
    </GlassBackdrop>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      gap: spacing.lg,
    },
    note: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: spacing.xs,
    },
  });
}
