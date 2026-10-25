import { StyleSheet, Text } from 'react-native';

import { typography, type Theme } from '@/constants/theme';
import { BEDSIDE_APPEARANCES, type BedsideAppearance } from '@/features/alarms/bedside-palette';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme, useThemeSettings } from '@/hooks/use-theme';
import { useTemperature } from '@/hooks/use-temperature';
import type { Appearance, TemperatureSetting } from '@/services/preferences';

import { RowGroup, SegmentedControl, SegmentedRow, SettingsSection, SwitchRow } from './settings-rows';

// The app-wide sections of the Preferences tab (formerly the Settings
// screen). They live here, not in src/features/preferences, because they
// use weather settings; src/app/(tabs)/preferences.tsx puts them in order.

const APPEARANCE_OPTIONS: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const BEDSIDE_LABELS: Record<BedsideAppearance, string> = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};
// VoiceOver: "Bedside mode appearance, Auto".
const BEDSIDE_OPTIONS = BEDSIDE_APPEARANCES.map((value) => ({
  value,
  label: BEDSIDE_LABELS[value],
  spoken: `Bedside mode appearance, ${BEDSIDE_LABELS[value]}`,
}));

const TEMPERATURE_OPTIONS: { value: TemperatureSetting; label: string; spoken: string }[] = [
  { value: 'auto', label: 'Auto', spoken: 'Automatic' },
  { value: 'fahrenheit', label: '°F', spoken: 'Fahrenheit' },
  { value: 'celsius', label: '°C', spoken: 'Celsius' },
];

export function AppearanceSettings() {
  const { theme, appearance, setAppearance, highContrast } = useThemeSettings();
  const { preferences, updatePreferences } = usePreferences();
  const styles = createStyles(theme);
  return (
    <SettingsSection title="Appearance">
      <SegmentedControl
        options={APPEARANCE_OPTIONS}
        selected={appearance}
        onSelect={setAppearance}
        accessibilityLabel="Appearance"
        accessibilityHint="System matches your phone’s light or dark mode"
      />
      {highContrast && <Text style={styles.note}>High contrast is on, so it’s used instead of this setting.</Text>}
      {/* Bedside mode's own colors (src/features/alarms/bedside-palette.ts). */}
      <SegmentedRow
        label="Bedside mode"
        description="Auto is light from sunrise and dark from sunset."
        options={BEDSIDE_OPTIONS}
        selected={preferences.bedsideAppearance}
        onSelect={(value) => updatePreferences({ bedsideAppearance: value })}
        accessibilityLabel="Bedside mode appearance"
        note={highContrast ? 'High contrast is on, so bedside mode uses it too.' : undefined}
        divider
      />
    </SettingsSection>
  );
}

export function TemperatureSettings() {
  const styles = createStyles(useTheme());
  const { preferences, updatePreferences } = usePreferences();
  const temperature = useTemperature();
  return (
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
  );
}

export function SoundSettings() {
  const styles = createStyles(useTheme());
  const { preferences, updatePreferences } = usePreferences();
  return (
    <SettingsSection title="Sound and vibration">
      <RowGroup>
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
      </RowGroup>
      <Text style={styles.note}>Severe alerts always play.</Text>
    </SettingsSection>
  );
}

export function AccessibilitySettings() {
  const { highContrast, setHighContrast } = useThemeSettings();
  return (
    <SettingsSection title="Accessibility">
      <RowGroup>
        <SwitchRow
          label="High contrast"
          accessibilityHint="Uses light text on a dark background with yellow accents. Overrides Appearance."
          value={highContrast}
          onValueChange={setHighContrast}
        />
      </RowGroup>
    </SettingsSection>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    note: {
      ...typography.caption,
      color: theme.colors.textSecondary,
    },
    // Same color as "opens to: Weather" in the Opening screen section
    // (passes 4.5:1 in every theme).
    highlight: {
      fontWeight: '600',
      color: theme.colors.buttonBackground,
    },
  });
}
