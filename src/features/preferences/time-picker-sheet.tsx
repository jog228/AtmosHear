import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useCalendars } from 'expo-localization';
import { useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { formatClockTime, todayAt, type ClockTime } from './opening-time';

type Props = {
  visible: boolean;
  title: string;
  initial: ClockTime;
  // Returns a gentle message to keep the sheet open (e.g. "Pick a morning
  // time, AM"), or null if the time is fine.
  validate?: (time: ClockTime) => string | null;
  onSave: (time: ClockTime) => void;
  onClose: () => void;
  // An extra button under the picker, e.g. "Use real time".
  extraAction?: { label: string; onPress: () => void };
};

// A sheet with Cancel, a title, Save, and a scroll-wheel time picker, like
// the alarm editor. Give it a new `key` each time it opens so it starts
// fresh.
export function TimePickerSheet({ visible, title, initial, validate, onSave, onClose, extraAction }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const [time, setTime] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);

  const change = (date: Date) => {
    setTime({ hour: date.getHours(), minute: date.getMinutes() });
    setMessage(null);
  };

  const save = () => {
    const error = validate?.(time) ?? null;
    setMessage(error);
    if (error) {
      AccessibilityInfo.announceForAccessibility(error);
      return;
    }
    onSave(time);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <HeaderButton label="Cancel" onPress={onClose} theme={theme} />
          <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          <HeaderButton label="Save" onPress={save} theme={theme} bold alignRight />
        </View>

        <View style={styles.content}>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={todayAt(time)}
              mode="time"
              display="spinner"
              onValueChange={(_event, date) => change(date)}
              textColor={theme.colors.textPrimary}
              themeVariant={theme.name === 'light' ? 'light' : 'dark'}
              style={styles.picker}
              accessibilityLabel={title}
            />
          ) : (
            // Android only has the wheel as a dialog.
            <Pressable
              style={styles.androidTime}
              onPress={() =>
                DateTimePickerAndroid.open({
                  value: todayAt(time),
                  mode: 'time',
                  display: 'spinner',
                  is24Hour: uses24Hour,
                  onValueChange: (_event, date) => change(date),
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${title}, ${formatClockTime(time, uses24Hour)}`}
              accessibilityHint="Opens the time picker"
            >
              <Text style={styles.androidTimeText}>{formatClockTime(time, uses24Hour)}</Text>
            </Pressable>
          )}

          {message && <Text style={styles.message}>{message}</Text>}

          {extraAction && (
            <Pressable
              style={({ pressed }) => [styles.extraButton, pressed && styles.pressed]}
              onPress={extraAction.onPress}
              accessibilityRole="button"
            >
              <Text style={styles.extraText}>{extraAction.label}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function HeaderButton({
  label,
  onPress,
  theme,
  bold,
  alignRight,
}: {
  label: string;
  onPress: () => void;
  theme: Theme;
  bold?: boolean;
  alignRight?: boolean;
}) {
  const styles = createStyles(theme);
  return (
    <View style={[styles.headerSide, alignRight && styles.headerRight]}>
      <Pressable style={styles.headerButton} onPress={onPress} accessibilityRole="button">
        <Text style={[styles.headerButtonText, bold && styles.bold]}>{label}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors } = theme;
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
      minHeight: 44,
      minWidth: 44,
      paddingHorizontal: spacing.sm,
      justifyContent: 'center',
    },
    headerButtonText: {
      fontSize: 17,
      color: colors.buttonBackground,
    },
    bold: {
      fontWeight: '600',
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
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
      color: colors.textPrimary,
    },
    message: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    extraButton: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: theme.cardBorderWidth,
      borderColor: colors.border,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    extraText: {
      fontSize: 17,
      color: colors.buttonBackground,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
