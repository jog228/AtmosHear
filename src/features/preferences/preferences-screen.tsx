import { useCalendars } from 'expo-localization';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatClockTime, isAm, type ClockTime } from './opening-time';
import { TimePickerSheet } from './time-picker-sheet';
import { useOpeningPreferences } from './use-opening-preferences';

const TAB_NAMES = { weather: 'Weather', alarms: 'Alarms' };

type Editing = 'morning' | 'evening' | null;

// The Preferences tab: which screen AtmosHear opens to by time of day.
// Always on; the user only picks the two switch-over times.
export function PreferencesScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Preferences
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Opening screen
          </Text>
          <Text style={styles.explanation}>Morning opens to Weather. Evening opens to Alarms.</Text>

          <View style={styles.group}>
            {rows.map((row, i) => {
              const value = formatClockTime(row.time, uses24Hour);
              return (
                <Pressable
                  key={row.id}
                  style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
                  onPress={() => open(row.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${row.name}, ${value}`}
                  accessibilityHint="Opens a time picker"
                >
                  <Text style={styles.rowLabel}>{row.name}</Text>
                  <Text style={styles.rowValue}>{value}</Text>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={14}
                    tintColor={theme.colors.textSecondary}
                    accessible={false}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.status} accessibilityLiveRegion="polite">
            Right now, AtmosHear opens to: <Text style={styles.destination}>{opensTo}</Text>
          </Text>
          {simulatedTime && (
            <Text style={styles.explanation}>
              Using a simulated time of {formatClockTime(simulatedTime, uses24Hour)} (Settings › Developer).
            </Text>
          )}
        </View>
      </ScrollView>

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
    </View>
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
      gap: spacing.lg,
    },
    title: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.heading,
      marginLeft: spacing.xs,
    },
    explanation: {
      fontSize: 15,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    group: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: theme.cardBorderWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    pressed: {
      opacity: 0.6,
    },
    rowLabel: {
      flex: 1,
      fontSize: 17,
      color: colors.textPrimary,
    },
    rowValue: {
      fontSize: 17,
      color: colors.textSecondary,
    },
    status: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      marginLeft: spacing.xs,
      marginTop: spacing.sm,
    },
    // Deep blue in light mode, yellow in dark, the high-contrast accent
    // (sun) in high contrast. All pass 4.5:1 on the page background.
    destination: {
      color: colors.buttonBackground,
    },
  });
}
