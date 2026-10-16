import { useCalendars } from 'expo-localization';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RowGroup, SettingsSection, ValueRow } from '@/components/settings-rows';
import { LARGE_TEXT_MAX_SCALE, spacing, typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { NameField } from './name-field';
import { formatClockTime, isAm, type ClockTime } from './opening-time';
import { TimePickerSheet } from './time-picker-sheet';
import { useOpeningPreferences } from './use-opening-preferences';

const TAB_NAMES = { weather: 'Weather', alarms: 'Alarms' };

type Editing = 'morning' | 'evening' | null;

// The Preferences tab's page: the big title, then the sections passed in.
// src/app/(tabs)/preferences.tsx puts this feature's sections and the
// app-wide ones (src/components/app-settings.tsx) in order.
export function PreferencesPage({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        // Tapping outside the name field closes the keyboard (and saves).
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
          Preferences
        </Text>
        {children}
      </ScrollView>
    </View>
  );
}

// An optional name for the Weather greeting.
export function NameSection() {
  return (
    <SettingsSection title="Name">
      <NameField />
    </SettingsSection>
  );
}

// Which screen AtmosHear opens to by time of day. Always on; the user only
// picks the two switch-over times.
export function OpeningScreenSection() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const { morning, evening, simulatedTime, update, startTab } = useOpeningPreferences();
  const [editing, setEditing] = useState<Editing>(null);
  // A new key each time a sheet opens, so it starts fresh.
  const [sheetKey, setSheetKey] = useState(0);

  // Re-check every minute so the status line follows the clock.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const opensTo = TAB_NAMES[startTab()];
  const status = `Right now, AtmosHear opens to: ${opensTo}`;

  // Announce the status line when it changes (not when the page appears).
  const lastStatus = useRef(status);
  useEffect(() => {
    if (status === lastStatus.current) return;
    lastStatus.current = status;
    AccessibilityInfo.announceForAccessibility(status);
  }, [status]);

  const open = (which: Editing) => {
    setSheetKey((key) => key + 1);
    setEditing(which);
  };

  const rows: { id: 'morning' | 'evening'; name: string; time: ClockTime }[] = [
    { id: 'morning', name: 'Morning', time: morning },
    { id: 'evening', name: 'Evening', time: evening },
  ];

  return (
    <SettingsSection title="Opening screen">
      <Text style={styles.explanation}>Morning opens to Weather. Evening opens to Alarms.</Text>

      <RowGroup>
        {rows.map((row, i) => (
          <ValueRow
            key={row.id}
            label={row.name}
            value={formatClockTime(row.time, uses24Hour)}
            accessibilityHint="Opens a time picker"
            onPress={() => open(row.id)}
            divider={i > 0}
          />
        ))}
      </RowGroup>

      <Text style={styles.status} accessibilityLiveRegion="polite">
        Right now, AtmosHear opens to: <Text style={styles.destination}>{opensTo}</Text>
      </Text>
      {simulatedTime && (
        <Text style={styles.explanation}>
          Using a simulated time of {formatClockTime(simulatedTime, uses24Hour)} (Developer, below).
        </Text>
      )}

      <TimePickerSheet
        key={sheetKey}
        visible={editing !== null}
        title={editing === 'evening' ? 'Evening' : 'Morning'}
        initial={editing === 'evening' ? evening : morning}
        validate={(time) => {
          if (editing === 'morning' && !isAm(time)) return 'Pick a morning time, AM';
          if (editing === 'evening' && isAm(time)) return 'Pick an evening time, PM';
          return null;
        }}
        onSave={(time) => {
          if (editing) update({ [editing]: time });
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
    </SettingsSection>
  );
}

function createStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    explanation: {
      ...typography.body,
      color: colors.textSecondary,
    },
    status: {
      ...typography.body,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    // Deep blue in light mode, yellow in dark, the high-contrast accent
    // (sun) in high contrast. All pass 4.5:1 on the page background.
    destination: {
      color: colors.buttonBackground,
    },
  });
}
