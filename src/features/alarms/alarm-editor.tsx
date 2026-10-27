import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LARGE_TEXT_MAX_SCALE, radius, spacing } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useTheme } from '@/hooks/use-theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { repeatSummary, timeText, untilText } from './alarm-format';
import { BigButton, DayChips, SunRings } from './alarm-parts';
import { nextOccurrence, nextRing } from './alarm-schedule';
import { ALARM_TONES, DEFAULT_TONE, TONE_IDS, type AlarmTone } from './alarm-tones';
import { DEFAULT_LABEL, type Alarm, type AlarmDraft } from './alarm-types';
import { DeleteSheet } from './delete-sheet';
import { useTonePreview } from './tone-preview';

type Props = {
  visible: boolean;
  // The alarm being edited, or null to add a new one.
  alarm: Alarm | null;
  uses24Hour: boolean;
  // Returns an error message (e.g. a duplicate) to keep the sheet open, or
  // null when saved.
  onSave: (draft: AlarmDraft) => string | null;
  onDelete: () => void;
  onClose: () => void;
};

// The New alarm / Edit alarm sheet (design/frames/16 Create alarm.png and
// 17 Edit alarm.png): Cancel, the title, and Delete (when editing); the
// clock-face sun showing the chosen time and how long until it rings; the
// scroll-wheel time picker; the repeat days; Label and Sound; and Save
// alarm along the bottom. Sound opens the tone list inside the sheet, and
// Delete asks first (delete-sheet.tsx). Give it a new `key` each time it
// opens so it starts fresh.
export function AlarmEditor({ visible, alarm, uses24Hour, onSave, onDelete, onClose }: Props) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<AlarmDraft>(() => startingDraft(alarm));
  const [page, setPage] = useState<'main' | 'sound'>('main');
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const now = useMinuteClock(visible);

  const change = (changes: Partial<AlarmDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setMessage(null);
  };

  const save = () => {
    const error = onSave(draft);
    setMessage(error);
    if (error) AccessibilityInfo.announceForAccessibility(error);
  };

  const toggleDay = (day: number) =>
    change({
      repeatDays: draft.repeatDays.includes(day)
        ? draft.repeatDays.filter((d) => d !== day)
        : [...draft.repeatDays, day],
    });

  // Saving switches the alarm on, so this is when it would ring.
  const until = untilText(
    nextRing(
      { ...draft, id: '', enabled: true, createdAt: 0, onceAt: nextOccurrence(draft.hour, draft.minute, now) },
      now,
    ) - now,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => (confirmDelete ? setConfirmDelete(false) : page === 'sound' ? setPage('main') : onClose())}
    >
      <View style={styles.sheet}>
        {page === 'main' ? (
          <SheetHeader
            colors={colors}
            left={{ label: 'Cancel', onPress: onClose }}
            title={alarm ? 'Edit alarm' : 'New alarm'}
            right={alarm ? { label: 'Delete', onPress: () => setConfirmDelete(true) } : undefined}
          />
        ) : (
          <SheetHeader colors={colors} left={{ label: 'Back', onPress: () => setPage('main'), back: true }} title="Sound" />
        )}

        <ScrollView
          contentContainerStyle={[styles.content, page === 'sound' && { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          {page === 'main' ? (
            <>
              <View style={styles.summary} accessible accessibilityLabel={`${until.spoken} until it rings`}>
                <SunRings size={112} clock={{ hour: draft.hour, minute: draft.minute }} />
                <View style={styles.summaryText}>
                  <Text style={styles.until} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
                    {until.short}
                  </Text>
                  <Text style={styles.untilCaption}>until it rings</Text>
                </View>
              </View>

              <TimePicker
                hour={draft.hour}
                minute={draft.minute}
                uses24Hour={uses24Hour}
                onChange={(hour, minute) => change({ hour, minute })}
              />

              <View style={styles.repeat}>
                <Text style={styles.caption} accessibilityRole="header">
                  Repeat
                </Text>
                <DayChips days={draft.repeatDays} onToggle={toggleDay} />
                <Text style={styles.repeatSummary}>{repeatSummary(draft.repeatDays)}</Text>
              </View>

              <View style={styles.rows}>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.caption} importantForAccessibility="no" accessibilityElementsHidden>
                      Label
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={draft.label}
                      onChangeText={(label) => change({ label })}
                      placeholder={DEFAULT_LABEL}
                      placeholderTextColor={colors.secondaryText}
                      selectionColor={colors.accent}
                      returnKeyType="done"
                      clearButtonMode="while-editing"
                      accessibilityLabel="Label"
                    />
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.row, styles.divider, pressed && styles.pressed]}
                  onPress={() => setPage('sound')}
                  accessibilityRole="button"
                  accessibilityLabel={`Sound, ${ALARM_TONES[draft.tone].label}`}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.caption}>Sound</Text>
                    <Text style={styles.value} numberOfLines={1}>
                      {ALARM_TONES[draft.tone].label}
                    </Text>
                  </View>
                  <Chevron colors={colors} />
                </Pressable>
              </View>

              {message && (
                <Text style={styles.message} accessibilityLiveRegion="polite">
                  {message}
                </Text>
              )}
            </>
          ) : (
            <ToneList selected={draft.tone} onSelect={(tone) => change({ tone })} />
          )}
        </ScrollView>

        {page === 'main' && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <BigButton label="Save alarm" onPress={save} />
          </View>
        )}

        {alarm && confirmDelete && (
          <DeleteSheet
            alarm={alarm}
            uses24Hour={uses24Hour}
            onDelete={() => {
              setConfirmDelete(false);
              onDelete();
            }}
            onKeep={() => setConfirmDelete(false)}
          />
        )}
      </View>
    </Modal>
  );
}

function Chevron({ colors }: { colors: AlarmColors }) {
  return (
    <SymbolView
      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
      size={18}
      weight="semibold"
      tintColor={colors.text}
      accessible={false}
    />
  );
}

type HeaderButton = { label: string; onPress: () => void; back?: boolean };

function SheetHeader({
  colors,
  left,
  title,
  right,
}: {
  colors: AlarmColors;
  left: HeaderButton;
  title: string;
  right?: HeaderButton;
}) {
  const styles = createStyles(colors);
  const button = (item: HeaderButton | undefined, align: 'left' | 'right') => (
    <View style={[styles.headerSide, align === 'right' && styles.headerRight]}>
      {item && (
        <Pressable
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          onPress={item.onPress}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          {item.back && (
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={17}
              weight="semibold"
              tintColor={colors.text}
              accessible={false}
            />
          )}
          <Text style={styles.headerButtonText}>{item.label}</Text>
        </Pressable>
      )}
    </View>
  );
  return (
    <View style={styles.header}>
      {button(left, 'left')}
      <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      {button(right, 'right')}
    </View>
  );
}

// iOS: the scroll wheel, inline. Android only has the wheel as a dialog,
// so it shows the time and opens the dialog on tap.
function TimePicker({
  hour,
  minute,
  uses24Hour,
  onChange,
}: {
  hour: number;
  minute: number;
  uses24Hour: boolean;
  onChange: (hour: number, minute: number) => void;
}) {
  const colors = useAlarmColors();
  const theme = useTheme();
  const styles = createStyles(colors);
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  const handle = (_event: unknown, date: Date) => onChange(date.getHours(), date.getMinutes());

  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        value={value}
        mode="time"
        display="spinner"
        onValueChange={handle}
        textColor={colors.text}
        themeVariant={theme.name === 'light' ? 'light' : 'dark'}
        style={styles.picker}
        accessibilityLabel="Alarm time"
      />
    );
  }

  return (
    <Pressable
      style={styles.androidTime}
      onPress={() =>
        DateTimePickerAndroid.open({ value, mode: 'time', display: 'spinner', is24Hour: uses24Hour, onValueChange: handle })
      }
      accessibilityRole="button"
      accessibilityLabel={`Alarm time, ${timeText(hour, minute, uses24Hour)}`}
      accessibilityHint="Opens the time picker"
    >
      <Text style={styles.androidTimeText} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
        {timeText(hour, minute, uses24Hour)}
      </Text>
    </Pressable>
  );
}

// The tones as bare rows between lines: name and description, a check on
// the chosen one, and a round play button that previews it. One preview
// at a time; it stops when this list closes (Back, Save, or Cancel).
function ToneList({ selected, onSelect }: { selected: AlarmTone; onSelect: (tone: AlarmTone) => void }) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const preview = useTonePreview();

  return (
    <View style={styles.rows} accessibilityRole="radiogroup">
      {TONE_IDS.map((tone, i) => {
        const { label, description } = ALARM_TONES[tone];
        const checked = tone === selected;
        const playing = preview.playing === tone;
        return (
          <View key={tone} style={[styles.toneRow, i > 0 && styles.divider]}>
            <Pressable
              style={styles.toneMain}
              onPress={() => onSelect(tone)}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              accessibilityLabel={`${label}, ${description}`}
            >
              <View style={styles.toneCheck}>
                {checked && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={18}
                    weight="bold"
                    tintColor={colors.accent}
                    accessible={false}
                  />
                )}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.value}>{label}</Text>
                <Text style={styles.toneDescription}>{description}</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
              onPress={() => preview.toggle(tone)}
              accessibilityRole="button"
              accessibilityLabel={`${playing ? 'Stop' : 'Play'} ${label}`}
            >
              <SymbolView
                name={
                  playing
                    ? { ios: 'stop.fill', android: 'stop', web: 'stop' }
                    : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                }
                size={18}
                tintColor={colors.onAccent}
                accessible={false}
              />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// A new alarm starts at the next whole hour, labeled "Alarm", not
// repeating, with the default tone.
function startingDraft(alarm: Alarm | null): AlarmDraft {
  if (alarm) {
    return { hour: alarm.hour, minute: alarm.minute, repeatDays: alarm.repeatDays, label: alarm.label, tone: alarm.tone };
  }
  return { hour: (new Date().getHours() + 1) % 24, minute: 0, repeatDays: [], label: DEFAULT_LABEL, tone: DEFAULT_TONE };
}

const PLAY_SIZE = 48;

function createStyles(colors: AlarmColors) {
  const line = colors.cardBorderWidth || StyleSheet.hairlineWidth * 2;
  return StyleSheet.create({
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      minHeight: 56,
    },
    headerSide: {
      flex: 1,
      alignItems: 'flex-start',
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    headerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: spacing.sm,
    },
    headerButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    summaryText: {
      flex: 1,
    },
    until: {
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '800',
      letterSpacing: -1,
      color: colors.text,
    },
    untilCaption: {
      fontSize: 17,
      color: colors.secondaryText,
    },
    picker: {
      alignSelf: 'center',
      height: 216,
    },
    androidTime: {
      alignSelf: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    androidTimeText: {
      fontSize: 56,
      fontWeight: '700',
      color: colors.text,
    },
    repeat: {
      gap: spacing.sm,
    },
    caption: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    repeatSummary: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    rows: {
      borderTopWidth: line,
      borderBottomWidth: line,
      borderColor: colors.separator,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 72,
      paddingVertical: spacing.sm,
    },
    divider: {
      borderTopWidth: line,
      borderTopColor: colors.separator,
    },
    rowText: {
      flex: 1,
    },
    value: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    input: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      minHeight: 44,
      paddingVertical: 0,
    },
    message: {
      fontSize: 15,
      color: colors.notice,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
    },
    toneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    toneMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: PLAY_SIZE,
    },
    toneCheck: {
      width: 20,
      alignItems: 'center',
    },
    toneDescription: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    playButton: {
      width: PLAY_SIZE,
      height: PLAY_SIZE,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
