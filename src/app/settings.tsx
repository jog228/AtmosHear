import { ScrollView, StyleSheet, Text } from 'react-native';

import { DeveloperSettings } from '@/components/developer-settings';
import { GlassBackdrop } from '@/components/glass-backdrop';
import { GlassCard } from '@/components/glass-card';
import { SegmentedControl, SettingsSection, SwitchRow } from '@/components/settings-rows';
import { spacing, type Theme } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useThemeSettings } from '@/hooks/use-theme';
import { useTemperature } from '@/hooks/use-temperature';
import type { Appearance, TemperatureSetting } from '@/services/preferences';

const APPEARANCE_OPTIONS: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TEMPERATURE_OPTIONS: { value: TemperatureSetting; label: string; spoken: string }[] = [
  { value: 'auto', label: 'Auto', spoken: 'Automatic' },
  { value: 'fahrenheit', label: '°F', spoken: 'Fahrenheit' },
  { value: 'celsius', label: '°C', spoken: 'Celsius' },
];

export default function SettingsScreen() {
  const { theme, appearance, setAppearance, highContrast, setHighContrast } = useThemeSettings();
  const styles = createStyles(theme);
  const { preferences, updatePreferences } = usePreferences();
  const temperature = useTemperature();

  return (
    <GlassBackdrop style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <SettingsSection title="Appearance">
          <SegmentedControl
            options={APPEARANCE_OPTIONS}
            selected={appearance}
            onSelect={setAppearance}
            accessibilityLabel="Appearance"
            accessibilityHint="System matches your phone’s light or dark mode"
          />
          {highContrast && (
            <Text style={styles.note}>High contrast is on, so it’s used instead of this setting.</Text>
          )}
        </SettingsSection>

        <SettingsSection title="Temperature">
          <SegmentedControl
            options={TEMPERATURE_OPTIONS}
            selected={preferences.temperatureUnit}
            onSelect={(value) => updatePreferences({ temperatureUnit: value })}
            accessibilityLabel="Temperature unit"
          />
          {preferences.temperatureUnit === 'auto' && (
            <Text style={styles.note}>
              Uses the usual unit where you are: <Text style={styles.highlight}>°{temperature.letter}</Text>
            </Text>
          )}
        </SettingsSection>

        <SettingsSection title="Sound and vibration">
          <GlassCard>
            <SwitchRow
              label="Ambient sound"
              accessibilityLabel="Ambient weather sound"
              accessibilityHint="Plays a quiet looping sound for the current weather while the app is open. Adjust it with your volume buttons."
              value={preferences.ambientSound}
              onValueChange={(value) => updatePreferences({ ambientSound: value })}
            />
            <SwitchRow
              label="Vibration"
              accessibilityLabel="Weather vibration"
              accessibilityHint="Plays a tap rhythm for the weather when it loads or changes, or when you tap the weather icon."
              value={preferences.vibration}
              onValueChange={(value) => updatePreferences({ vibration: value })}
              divider
            />
          </GlassCard>
          <Text style={styles.note}>Severe alerts always play.</Text>
        </SettingsSection>

        <SettingsSection title="Accessibility">
          <GlassCard>
            <SwitchRow
              label="High contrast"
              accessibilityHint="Uses light text on a dark background with yellow accents. Overrides Appearance."
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
    // Same color as "opens to: Weather" on the Preferences page (passes
    // 4.5:1 in every theme).
    highlight: {
      fontWeight: '600',
      color: theme.colors.buttonBackground,
    },
  });
}
