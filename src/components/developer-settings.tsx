import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { sortByPriority } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { getTestWeatherOption } from '@/constants/test-weather';
import { spacing, type Theme } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { announceAlert } from '@/hooks/use-alert-sound';
import { useTheme } from '@/hooks/use-theme';
import { alertSound } from '@/services/alert-sound';
import { conditionPatterns, hapticPlayer } from '@/services/haptics';
import type { DevWeatherSource } from '@/services/preferences';

import { GlassCard } from './glass-card';
import { ActionRow, OptionGroup, SettingsSection, SwitchRow, ValueRow } from './settings-rows';

const SOURCE_OPTIONS: { value: DevWeatherSource; label: string; description: string }[] = [
  { value: 'test', label: 'Test weather', description: 'Filler data, no internet needed' },
  { value: 'open-meteo', label: 'Open-Meteo only', description: 'Live, with no fallback' },
  { value: 'nws', label: 'NWS only', description: 'Live, with no fallback' },
];

// Settings for testing and presenting: forces test weather, cycles through
// it, or tests one live provider on its own.
export function DeveloperSettings() {
  const styles = createStyles(useTheme());
  const { preferences, updatePreferences } = usePreferences();
  const reduceTransparency = useReduceTransparency();
  const { developerMode, devWeatherSource, testWeather, autoCycle, ambientSound } = preferences;
  const option = getTestWeatherOption(testWeather);

  return (
    <>
      <SettingsSection title="Developer">
        <GlassCard>
          <SwitchRow
            label="Developer mode"
            description="Shows test weather instead of live weather, for testing and presenting."
            value={developerMode}
            onValueChange={(value) => updatePreferences({ developerMode: value })}
          />
          {developerMode && devWeatherSource === 'test' && (
            <>
              <ValueRow label="Test weather" value={option.label} onPress={() => router.push('/test-weather')} divider />
              <SwitchRow
                label="Auto-cycle"
                description="Moves to the next test weather every 8 seconds."
                value={autoCycle}
                onValueChange={(value) => updatePreferences({ autoCycle: value })}
                divider
              />
            </>
          )}
          {developerMode && (
            <ActionRow
              label="Replay alert"
              description="Plays the severe alert beeps, even with ambient sound off."
              accessibilityHint="Plays the severe weather alert sound three times"
              onPress={() => alertSound.play(() => option.alert && announceAlert(option.alert))}
              divider
            />
          )}
          {developerMode && devWeatherSource === 'test' && (
            <ActionRow
              label="Test vibration"
              description={`Plays the ${option.label.toLowerCase()} pattern, even with Vibration off.`}
              accessibilityHint="Vibrates the pattern for the current test weather"
              onPress={() => hapticPlayer.play(conditionPatterns(option.conditions))}
              divider
            />
          )}
        </GlassCard>
      </SettingsSection>

      {developerMode && (
        <SettingsSection title="Weather source">
          <OptionGroup
            options={SOURCE_OPTIONS}
            selected={devWeatherSource}
            onSelect={(value) => updatePreferences({ devWeatherSource: value })}
          />
          <Text style={styles.info}>
            {devWeatherSource === 'test'
              ? `${option.id} · sound: ${soundStatus(option.conditions, ambientSound)}${option.alert ? ' · alert: severe-alert.m4a' : ''}`
              : 'Live weather, no test data'}
          </Text>
          <Text style={styles.info}>Reduce Transparency: {reduceTransparency ? 'on' : 'off'}</Text>
        </SettingsSection>
      )}
    </>
  );
}

// "thunderstorm.m4a + heavy-rain.m4a" (files are named after their
// condition) or "none yet".
function soundStatus(conditions: ConditionId[], ambientSound: boolean) {
  const files = sortByPriority(conditions)
    .filter((id) => conditionProfiles[id].sound)
    .map((id) => `${id}.m4a`);
  const status = files.length ? files.join(' + ') : 'none yet';
  return ambientSound ? status : `${status} (ambient sound is off)`;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    info: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginLeft: spacing.xs,
      fontVariant: ['tabular-nums'],
    },
  });
}
