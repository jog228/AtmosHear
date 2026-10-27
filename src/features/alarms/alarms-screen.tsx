import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LARGE_TEXT_MAX_SCALE, radius, spacing } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { AlarmEditor } from './alarm-editor';
import { alarmSubtitle, timeText, untilText } from './alarm-format';
import { askForNotificationsIfNeeded, rescheduleAlarmNotifications, useNotificationPermission } from './alarm-notifications';
import { BedsideIcon, BigButton, SquareButton, SunRings } from './alarm-parts';
import { alarmRinger } from './alarm-ringer';
import { AlarmRow } from './alarm-row';
import { nextOccurrence, nextRing } from './alarm-schedule';
import { alarmStore } from './alarm-store';
import type { Alarm, AlarmDraft } from './alarm-types';
import { SavedToast, type Toast } from './saved-toast';
import { useAlarms } from './use-alarms';

const BEDSIDE_HINT = 'Shows a dim clock and keeps the screen on, so alarms ring with sound. Tap anywhere to exit.';

// The Alarms tab, in Sofia's style (design/frames/13 Alarms, empty.png and
// 14 Alarm home.png): "Alarms" with the bedside and + buttons, then either
// a big "No alarms" with an Add alarm button and the clock-face sun in
// its rings, or the time now, when the next alarm rings, and the alarms.
// Tapping one opens the editor; saving shows the "Alarm set" toast. Alarms
// ring through AlarmHost (alarm-host.tsx). Separate from the weather:
// only the base palette is shared.
export function AlarmsScreen() {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Follows the phone's 24-hour time setting.
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const now = useMinuteClock(true);
  const { alarms, loaded, add, update, toggle, remove, findDuplicate } = useAlarms();
  // The sheet: closed, adding (null), or editing an alarm. A new key each
  // time it opens, so it starts fresh.
  const [sheet, setSheet] = useState<{ alarm: Alarm | null } | null>(null);
  const [sheetKey, setSheetKey] = useState(0);
  const openSheet = (alarm: Alarm | null) => {
    setSheetKey((key) => key + 1);
    setSheet({ alarm });
  };
  const [toast, setToast] = useState<Toast | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const permission = useNotificationPermission();
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
    // Saving always switches it on, so it rings next at:
    const at = Date.now();
    const rings = nextRing(
      { ...draft, id: '', enabled: true, createdAt: 0, onceAt: nextOccurrence(draft.hour, draft.minute, at) },
      at,
    );
    const time = timeText(draft.hour, draft.minute, uses24Hour);
    const until = untilText(rings - at);
    setToast({
      id: at,
      title: `Alarm set for ${time}`,
      subtitle: `Rings in ${until.short}`,
      spoken: `Alarm set for ${time}. Rings in ${until.spoken}.`,
    });
    return null;
  };

  // The soonest ring among the switched-on alarms.
  const next = alarms
    .filter((alarm) => alarm.enabled)
    .reduce<number | null>((soonest, alarm) => {
      const at = nextRing(alarm, now);
      return soonest === null || at < soonest ? at : soonest;
    }, null);
  const nextUntil = next === null ? null : untilText(next - now);
  const nowText = timeText(new Date(now).getHours(), new Date(now).getMinutes(), uses24Hour);
  const empty = loaded && alarms.length === 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* iOS keeps the list clear of the tab bar. */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
            Alarms
          </Text>
          <View style={styles.headerButtons}>
            <SquareButton
              variant="card"
              onPress={() => router.push('/bedside')}
              accessibilityLabel="Bedside mode"
              accessibilityHint={BEDSIDE_HINT}
            >
              <BedsideIcon color={colors.accent} />
            </SquareButton>
            <SquareButton variant="primary" onPress={() => openSheet(null)} accessibilityLabel="Add alarm">
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={24}
                weight="semibold"
                tintColor={colors.onAccent}
                accessible={false}
              />
            </SquareButton>
          </View>
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

        {empty && (
          <View style={styles.empty}>
            <Text
              style={styles.emptyTitle}
              accessibilityRole="header"
              maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {'No\nalarms'}
            </Text>
            <Text style={styles.body}>Add one and wake up to the weather.</Text>
            <BigButton label="Add alarm" plus width="fit" onPress={() => openSheet(null)} />
            <View style={styles.emptyArt}>
              <SunRings size={Math.min(300, width - spacing.md * 2)} clock="live" />
            </View>
          </View>
        )}

        {alarms.length > 0 && (
          <>
            <View accessible accessibilityRole="header">
              <Text style={styles.now}>Now {nowText}</Text>
              <Text style={styles.headline} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
                {nextUntil ? `Next alarm in ${nextUntil.short}` : 'All alarms are off'}
              </Text>
            </View>
            <Text style={styles.hint}>Tap an alarm to change it. Use the switch to turn it on or off.</Text>

            <View style={styles.list}>
              {alarms.map((alarm, i) => (
                <AlarmRow
                  key={alarm.id}
                  alarm={alarm}
                  uses24Hour={uses24Hour}
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

            {/* Where frame 14 has its options row. */}
            <Pressable
              style={({ pressed }) => [styles.bedsideRow, pressed && styles.pressed]}
              onPress={() => router.push('/bedside')}
              accessibilityRole="button"
              accessibilityLabel="Bedside mode"
              accessibilityHint={BEDSIDE_HINT}
            >
              <View style={styles.bedsideText}>
                <Text style={styles.bedsideTitle}>Bedside mode</Text>
                <Text style={styles.bedsideSubtitle}>Keeps the screen on, so alarms ring with sound.</Text>
              </View>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={18}
                weight="semibold"
                tintColor={colors.text}
                accessible={false}
              />
            </Pressable>
          </>
        )}
      </ScrollView>

      <SavedToast toast={toast} onHide={hideToast} />

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
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    empty: {
      gap: spacing.lg,
      marginTop: spacing.sm,
    },
    // Huge and tight, like the frame.
    emptyTitle: {
      fontSize: 96,
      lineHeight: 92,
      fontWeight: '800',
      letterSpacing: -3,
      color: colors.text,
    },
    body: {
      fontSize: 20,
      lineHeight: 26,
      color: colors.secondaryText,
    },
    emptyArt: {
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    now: {
      fontSize: 17,
      color: colors.secondaryText,
    },
    headline: {
      fontSize: 36,
      lineHeight: 40,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.text,
      marginTop: spacing.xs,
    },
    hint: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.secondaryText,
    },
    list: {
      borderBottomWidth: colors.cardBorderWidth || StyleSheet.hairlineWidth * 2,
      borderBottomColor: colors.separator,
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
    bedsideRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 64,
    },
    bedsideText: {
      flex: 1,
    },
    bedsideTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    bedsideSubtitle: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
