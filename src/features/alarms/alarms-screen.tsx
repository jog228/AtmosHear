import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClockSun, HalftoneField } from '@/components/brand';
import { radius, spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { AlarmEditor } from './alarm-editor';
import { alarmSubtitle, timeText } from './alarm-format';
import { askForNotificationsIfNeeded, rescheduleAlarmNotifications, useNotificationPermission } from './alarm-notifications';
import { alarmRinger } from './alarm-ringer';
import { AlarmRow } from './alarm-row';
import { alarmStore } from './alarm-store';
import type { Alarm, AlarmDraft } from './alarm-types';
import { useBedsideOpen } from './bedside-screen';
import { useAlarms } from './use-alarms';

// The Alarms tab, modeled on the Alarms section of Apple's Clock app, plus
// Bedside mode. Alarms ring through AlarmHost (alarm-host.tsx). Separate
// from the weather: only the base palette is shared.
export function AlarmsScreen() {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  // Follows the phone's 24-hour time setting.
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const { alarms, loaded, add, update, toggle, remove, findDuplicate } = useAlarms();
  const [editMode, setEditMode] = useState(false);
  // Nothing left to edit: edit mode ends.
  const editing = editMode && alarms.length > 0;
  // The sheet: closed, adding (null), or editing an alarm. A new key each
  // time it opens, so it starts fresh.
  const [sheet, setSheet] = useState<{ alarm: Alarm | null } | null>(null);
  const [sheetKey, setSheetKey] = useState(0);
  const openSheet = (alarm: Alarm | null) => {
    setSheetKey((key) => key + 1);
    setSheet({ alarm });
  };

  const permission = useNotificationPermission();
  const bedsideOpen = useBedsideOpen();
  // The first alarm switched on asks for notifications (once).
  const askOnce = () => askForNotificationsIfNeeded(() => rescheduleAlarmNotifications(alarmStore.list()));

  // A ringing alarm opens on top: close the sheet so it isn't left
  // covering the ringing screen.
  useEffect(() => alarmRinger.subscribe((ring) => ring && setSheet(null)), []);

  const deleteAlarm = (alarm: Alarm) => {
    remove(alarm.id);
    AccessibilityInfo.announceForAccessibility(`${timeText(alarm.hour, alarm.minute, uses24Hour)} alarm deleted`);
  };

  const save = (draft: AlarmDraft): string | null => {
    const existing = sheet?.alarm ?? null;
    const duplicate = findDuplicate(draft, existing?.id);
    if (duplicate) {
      return `You already have a ${timeText(draft.hour, draft.minute, uses24Hour)} alarm (${alarmSubtitle(duplicate)}). Try a different time or repeat days.`;
    }
    if (existing) update(existing.id, draft);
    else add(draft);
    setSheet(null);
    askOnce();
    return null;
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.toolbar}>
        {alarms.length > 0 ? (
          <Pressable
            style={styles.toolbarButton}
            onPress={() => setEditMode(!editing)}
            accessibilityRole="button"
            accessibilityLabel={editing ? 'Done' : 'Edit'}
            accessibilityHint={editing ? 'Stops editing alarms' : 'Shows delete controls for each alarm'}
          >
            <Text style={[styles.toolbarText, editing && styles.bold]}>{editing ? 'Done' : 'Edit'}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          style={styles.toolbarButton}
          onPress={() => openSheet(null)}
          accessibilityRole="button"
          accessibilityLabel="Add alarm"
        >
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={24}
            weight="medium"
            tintColor={colors.accent}
            accessible={false}
          />
        </Pressable>
      </View>

      {/* iOS keeps the list clear of the tab bar. */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {/* The title, with a clock-face sun showing the time over a dot
            field (decorative), like the Feel & hear heading. */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Alarms
          </Text>
          {alarms.length > 0 && (
            <HalftoneField size={HEADER_SIZE} pattern="rings" hole>
              <ClockSun size={HEADER_SIZE / 3} live />
            </HalftoneField>
          )}
        </View>

        {permission === 'denied' && (
          <View style={styles.notice} accessible accessibilityRole="text">
            <Text style={styles.noticeText}>
              Notifications are off, so alarms only ring while AtmosHear is open. Turn them on in Settings to be woken
              when it’s closed.
            </Text>
            <Pressable
              onPress={() => Linking.openSettings()}
              accessibilityRole="button"
              accessibilityLabel="Open Settings"
              style={styles.noticeButton}
            >
              <Text style={styles.noticeLink}>Open Settings</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.bedside}>
          <View style={styles.bedsideText}>
            <Text style={styles.bedsideTitle}>Bedside mode</Text>
            <Text style={styles.bedsideSubtitle}>Keeps the screen on, dimmed, so alarms ring with sound.</Text>
          </View>
          <Switch
            value={bedsideOpen}
            onValueChange={(on) => {
              if (on) router.push('/bedside');
            }}
            trackColor={{ false: colors.switchOff, true: colors.accent }}
            ios_backgroundColor={colors.switchOff}
            thumbColor={bedsideOpen ? colors.switchThumbOn : colors.switchThumbOff}
            accessibilityLabel="Bedside mode"
            accessibilityHint="Shows a dim clock and keeps the screen on. Tap anywhere to exit."
          />
        </View>

        {loaded && alarms.length === 0 && (
          <View style={styles.empty}>
            <ClockSun size={160} live />
            <Text style={styles.emptyTitle}>No alarms yet.</Text>
            <Text style={styles.emptyHint}>Tap + to add one.</Text>
          </View>
        )}

        {alarms.length > 0 && (
          <View style={styles.list}>
            {alarms.map((alarm, i) => (
              <AlarmRow
                key={alarm.id}
                alarm={alarm}
                uses24Hour={uses24Hour}
                editing={editing}
                onPress={() => openSheet(alarm)}
                onToggle={(enabled) => {
                  toggle(alarm.id, enabled);
                  if (enabled) askOnce();
                }}
                onDelete={() => deleteAlarm(alarm)}
                divider={i > 0}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AlarmEditor
        key={sheetKey}
        visible={sheet !== null}
        alarm={sheet?.alarm ?? null}
        uses24Hour={uses24Hour}
        onSave={save}
        onDelete={() => {
          if (sheet?.alarm) deleteAlarm(sheet.alarm);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const HEADER_SIZE = 132;

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    toolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      minHeight: 44,
    },
    toolbarButton: {
      minWidth: 44,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolbarText: {
      fontSize: 17,
      color: colors.accent,
    },
    bold: {
      fontWeight: '600',
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minHeight: HEADER_SIZE,
    },
    title: {
      flexShrink: 1,
      fontSize: 34,
      fontWeight: '700',
      color: colors.text,
    },
    empty: {
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    emptyHint: {
      fontSize: 17,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    notice: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    noticeText: {
      fontSize: 15,
      color: colors.text,
    },
    noticeButton: {
      minHeight: 44,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    noticeLink: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.accent,
    },
    bedside: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 64,
    },
    bedsideText: {
      flex: 1,
    },
    bedsideTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    bedsideSubtitle: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    list: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
  });
}
