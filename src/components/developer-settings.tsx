import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { sortByPriority } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { getTestWeatherOption } from '@/constants/test-weather';
import { type Theme } from '@/constants/theme';
import { testAlarmNow } from '@/features/alarms/test-alarm';
import { formatClockTime } from '@/features/preferences/opening-time';
import { TimePickerSheet } from '@/features/preferences/time-picker-sheet';
import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';
import { usePreferences } from '@/hooks/use-preferences';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { announceAlert } from '@/hooks/use-alert-sound';
import { useTheme } from '@/hooks/use-theme';
import { alertSound } from '@/services/alert-sound';
import { conditionPatterns } from '@/services/condition-haptics';
import { hapticPlayer } from '@/services/haptics';
import type { DevWeatherSource } from '@/services/preferences';

import { ActionRow, OptionGroup, RowGroup, SettingsSection, SwitchRow, ValueRow } from './settings-rows';

const SOURCE_OPTIONS: { value: DevWeatherSource; label: string; description: string }[] = [
  { value: 'test', label: 'Test weather', description: 'Filler data, no internet needed' },
  { value: 'open-meteo', label: 'Open-Meteo only', description: 'Live, with no fallback' },
  { value: 'nws', label: 'NWS only', description: 'Live, with no fallback' },
];

// The Developer section of the Preferences tab, for testing and presenting:
// forces test weather, cycles through it, or tests one live provider on its
// own.
export function DeveloperSettings() {
  const styles = createStyles(useTheme());
  const { preferences, updatePreferences } = usePreferences();
  const reduceTransparency = useReduceTransparency();
  const { developerMode, devWeatherSource, testWeather, autoCycle, ambientSound } = preferences;
  const option = getTestWeatherOption(testWeather);
  const opening = useOpeningPreferences();
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  // The "Simulate time" sheet; a new key each time it opens.
  const [simulating, setSimulating] = useState(false);
  const [sheetKey, setSheetKey] = useState(0);

  return (
    <>
      <SettingsSection title="Developer">
        <RowGroup>
          <SwitchRow
            label="Developer mode"
            accessibilityHint="Shows test weather instead of live weather, for testing and presenting"
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
          {developerMode && (
            <ActionRow
              label="Test alarm now"
              description="Rings right away with the first alarm’s sound (or Morning)."
              accessibilityHint="Opens the ringing alarm screen with sound and vibration"
              onPress={testAlarmNow}
              divider
            />
          )}
          {developerMode && (
            <ValueRow
              label="Simulate time"
              value={opening.simulatedTime ? formatClockTime(opening.simulatedTime, uses24Hour) : 'Off'}
              onPress={() => {
                setSheetKey((key) => key + 1);
                setSimulating(true);
              }}
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
        </RowGroup>
      </SettingsSection>

      <TimePickerSheet
        key={sheetKey}
        visible={simulating}
        title="Simulate time"
        initial={opening.simulatedTime ?? { hour: new Date().getHours(), minute: new Date().getMinutes() }}
        onSave={(time) => {
          opening.update({ simulatedTime: time });
          setSimulating(false);
        }}
        onClose={() => setSimulating(false)}
        extraAction={
          opening.simulatedTime
            ? {
                label: 'Use real time',
                onPress: () => {
                  opening.update({ simulatedTime: null });
                  setSimulating(false);
                },
              }
            : undefined
        }
      />

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
      fontVariant: ['tabular-nums'],
    },
  });
}
