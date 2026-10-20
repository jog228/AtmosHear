import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { DAY_NAMES, repeatSummary, timeText } from './alarm-format';
import { ALARM_TONES, DEFAULT_TONE, TONE_IDS, type AlarmTone } from './alarm-tones';
import { DEFAULT_LABEL, type Alarm, type AlarmDraft } from './alarm-types';
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

// The Add Alarm / Edit Alarm sheet, like Apple's Clock: Cancel, title, Save,
// a scroll-wheel time picker, then Repeat, Label, and Sound. Repeat and
// Sound open lists inside the sheet. Give it a new `key` each time it opens so it
// starts fresh.
export function AlarmEditor({ visible, alarm, uses24Hour, onSave, onDelete, onClose }: Props) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<AlarmDraft>(() => startingDraft(alarm));
  const [page, setPage] = useState<'main' | 'repeat' | 'sound'>('main');
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        {page === 'main' ? (
          <SheetHeader
            colors={colors}
            left={{ label: 'Cancel', onPress: onClose }}
            title={alarm ? 'Edit Alarm' : 'Add Alarm'}
            right={{ label: 'Save', onPress: save, bold: true }}
          />
        ) : (
          <SheetHeader
            colors={colors}
            left={{ label: 'Back', onPress: () => setPage('main'), back: true }}
            title={page === 'repeat' ? 'Repeat' : 'Sound'}
          />
        )}

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
        >
          {page === 'main' ? (
            <>
              <TimePicker
                hour={draft.hour}
                minute={draft.minute}
                uses24Hour={uses24Hour}
                onChange={(hour, minute) => change({ hour, minute })}
              />

              <View style={styles.group}>
                <Pressable
                  style={styles.row}
                  onPress={() => setPage('repeat')}
                  accessibilityRole="button"
                  accessibilityLabel={`Repeat, ${repeatSummary(draft.repeatDays)}`}
                >
                  <Text style={styles.rowLabel}>Repeat</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {repeatSummary(draft.repeatDays)}
                  </Text>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={14}
                    tintColor={colors.secondaryText}
                    accessible={false}
                  />
                </Pressable>
                <View style={[styles.row, styles.divider]}>
                  <Text style={styles.rowLabel} importantForAccessibility="no" accessibilityElementsHidden>
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
                <Pressable
                  style={[styles.row, styles.divider]}
                  onPress={() => setPage('sound')}
                  accessibilityRole="button"
                  accessibilityLabel={`Sound, ${ALARM_TONES[draft.tone].label}`}
                >
                  <Text style={styles.rowLabel}>Sound</Text>
                  <Text style={styles.rowValue} numberOfLines={1}>
                    {ALARM_TONES[draft.tone].label}
                  </Text>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={14}
                    tintColor={colors.secondaryText}
                    accessible={false}
                  />
                </Pressable>
              </View>

              {message && (
                <Text style={styles.message} accessibilityLiveRegion="polite">
                  {message}
                </Text>
              )}

              {alarm && (
                <Pressable
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                  onPress={onDelete}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${timeText(alarm.hour, alarm.minute, uses24Hour)} alarm`}
                >
                  <Text style={styles.deleteText}>Delete Alarm</Text>
                </Pressable>
              )}
            </>
          ) : page === 'sound' ? (
            <ToneList selected={draft.tone} onSelect={(tone) => change({ tone })} />
          ) : (
            <View style={styles.group}>
              {DAY_NAMES.map((name, day) => {
                const checked = draft.repeatDays.includes(day);
                return (
                  <Pressable
                    key={name}
                    style={[styles.row, day > 0 && styles.divider]}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`Every ${name}`}
                  >
                    <Text style={styles.rowLabel}>Every {name}</Text>
                    {checked && (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={18}
                        tintColor={colors.accent}
                        accessible={false}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

type HeaderButton = { label: string; onPress: () => void; bold?: boolean; back?: boolean };

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
        <Pressable style={styles.headerButton} onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.label}>
          {item.back && (
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={17}
              tintColor={colors.accent}
              accessible={false}
            />
          )}
          <Text style={[styles.headerButtonText, item.bold && styles.bold]}>{item.label}</Text>
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
      <Text style={styles.androidTimeText}>{timeText(hour, minute, uses24Hour)}</Text>
    </Pressable>
  );
}

// The tones, like the Sound library's rows: name and description, a check
// on the chosen one, and a round play button that previews it. One preview
// at a time; it stops when this list closes (Back, Save, or Cancel).
function ToneList({ selected, onSelect }: { selected: AlarmTone; onSelect: (tone: AlarmTone) => void }) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const preview = useTonePreview();

  return (
    <View style={styles.group}>
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
                    tintColor={colors.accent}
                    accessible={false}
                  />
                )}
              </View>
              <View style={styles.toneText}>
                <Text style={styles.toneName}>{label}</Text>
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
      fontSize: 17,
      color: colors.accent,
    },
    bold: {
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    content: {
      padding: spacing.md,
      gap: spacing.lg,
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
      fontWeight: '300',
      color: colors.text,
    },
    group: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.md,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowLabel: {
      flex: 1,
      fontSize: 17,
      color: colors.text,
    },
    rowValue: {
      fontSize: 17,
      color: colors.secondaryText,
      flexShrink: 1,
    },
    input: {
      flex: 2,
      fontSize: 17,
      color: colors.text,
      textAlign: 'right',
      minHeight: 44,
    },
    message: {
      fontSize: 15,
      color: colors.notice,
      textAlign: 'center',
    },
    deleteButton: {
      backgroundColor: colors.danger,
      borderRadius: radius.md,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.onDanger,
    },
    toneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
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
    toneText: {
      flex: 1,
    },
    toneName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    toneDescription: {
      fontSize: 15,
      color: colors.secondaryText,
    },
    playButton: {
      width: PLAY_SIZE,
      height: PLAY_SIZE,
      borderRadius: PLAY_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
