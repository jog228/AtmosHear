import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { LARGE_TEXT_MAX_SCALE, spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { alarmSubtitle, spokenRepeat, timeText } from './alarm-format';
import { Toggle } from './alarm-parts';
import type { Alarm } from './alarm-types';

type Props = {
  alarm: Alarm;
  uses24Hour: boolean;
  onPress: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  divider: boolean;
};

const DELETE_WIDTH = 88;

// One alarm (design/frames/14 Alarm home.png): the big bold time, "Label,
// repeat" underneath, and the drawn toggle, between thin lines. Tap the
// time to edit; swipe left (or the VoiceOver action) for Delete.
export function AlarmRow({ alarm, uses24Hour, onPress, onToggle, onDelete, divider }: Props) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const swipeable = useRef<SwipeableMethods>(null);
  const spokenTime = timeText(alarm.hour, alarm.minute, uses24Hour);
  const deleteLabel = `Delete ${spokenTime} alarm`;
  const textColor = alarm.enabled ? colors.text : colors.dimmedText;
  const subtitleColor = alarm.enabled ? colors.secondaryText : colors.dimmedText;

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={DELETE_WIDTH / 2}
      overshootRight={false}
      childrenContainerStyle={{ backgroundColor: colors.background }}
      renderRightActions={() => (
        <Pressable
          style={styles.deleteAction}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </Pressable>
      )}
    >
      <View style={[styles.row, divider && styles.divider]}>
        <Pressable
          style={({ pressed }) => [styles.text, pressed && styles.pressed]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${spokenTime}, ${alarm.label}, ${spokenRepeat(alarm.repeatDays)}, ${alarm.enabled ? 'on' : 'off'}`}
          accessibilityHint="Opens the alarm to edit it"
          accessibilityActions={[{ name: 'delete', label: deleteLabel }]}
          onAccessibilityAction={(event) => event.nativeEvent.actionName === 'delete' && onDelete()}
        >
          <Text style={[styles.time, { color: textColor }]} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
            {spokenTime}
          </Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>{alarmSubtitle(alarm)}</Text>
        </Pressable>
        <Pressable
          style={styles.toggle}
          onPress={() => onToggle(!alarm.enabled)}
          accessibilityRole="switch"
          accessibilityState={{ checked: alarm.enabled }}
          accessibilityLabel={`${spokenTime} alarm`}
          hitSlop={spacing.sm}
        >
          <Toggle on={alarm.enabled} />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 88,
    },
    divider: {
      borderTopWidth: colors.cardBorderWidth || StyleSheet.hairlineWidth * 2,
      borderTopColor: colors.separator,
    },
    text: {
      flex: 1,
      paddingVertical: spacing.md,
    },
    pressed: {
      opacity: 0.6,
    },
    time: {
      fontSize: 34,
      lineHeight: 40,
      fontWeight: '700',
      letterSpacing: -0.5,
      fontVariant: ['tabular-nums'],
    },
    subtitle: {
      fontSize: 17,
      lineHeight: 22,
    },
    // 44pt or more, with the hit slop.
    toggle: {
      minHeight: 44,
      minWidth: 52,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteAction: {
      width: DELETE_WIDTH,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteActionText: {
      color: colors.onDanger,
      fontSize: 17,
      fontWeight: '600',
    },
  });
}
