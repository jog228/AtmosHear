import { useCalendars } from 'expo-localization';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { AlarmEditor } from './alarm-editor';
import { alarmSubtitle, timeText } from './alarm-format';
import { AlarmRow } from './alarm-row';
import type { Alarm, AlarmDraft } from './alarm-types';
import { useAlarms } from './use-alarms';

// The Alarms tab, modeled on the Alarms section of Apple's Clock app. Alarms
// don't ring yet. Separate from the weather: only the base palette is shared.
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
        <Text style={styles.title} accessibilityRole="header">
          Alarms
        </Text>

        {loaded && alarms.length === 0 && <Text style={styles.empty}>No alarms yet. Tap + to add one.</Text>}

        {alarms.length > 0 && (
          <View style={styles.list}>
            {alarms.map((alarm, i) => (
              <AlarmRow
                key={alarm.id}
                alarm={alarm}
                uses24Hour={uses24Hour}
                editing={editing}
                onPress={() => openSheet(alarm)}
                onToggle={(enabled) => toggle(alarm.id, enabled)}
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
    title: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.text,
    },
    empty: {
      fontSize: 17,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: spacing.xl,
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
