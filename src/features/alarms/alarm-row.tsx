import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ClockSun } from '@/components/brand';
import { spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { alarmSubtitle, formatTime, spokenRepeat, timeText } from './alarm-format';
import type { Alarm } from './alarm-types';

type Props = {
  alarm: Alarm;
  uses24Hour: boolean;
  // Edit mode: a delete control on the left, no switch.
  editing: boolean;
  onPress: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  divider: boolean;
};

const DELETE_WIDTH = 88;

// One alarm, like Apple's Clock: a small clock-face sun showing its time,
// big time, "Label, repeat" underneath, and a switch. Swipe left (or tap the red control in edit mode) for Delete.
export function AlarmRow({ alarm, uses24Hour, editing, onPress, onToggle, onDelete, divider }: Props) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const swipeable = useRef<SwipeableMethods>(null);
  const { time, period } = formatTime(alarm.hour, alarm.minute, uses24Hour);
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
      childrenContainerStyle={{ backgroundColor: colors.card }}
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
        {editing && (
          <Pressable
            style={styles.deleteControl}
            onPress={() => swipeable.current?.openRight()}
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            accessibilityHint="Shows the Delete button"
          >
            <SymbolView
              name={{ ios: 'minus.circle.fill', android: 'do_not_disturb_on', web: 'do_not_disturb_on' }}
              size={24}
              tintColor={colors.danger}
              accessible={false}
            />
          </Pressable>
        )}
        <ClockSun size={44} hour={alarm.hour} minute={alarm.minute} dimmed={!alarm.enabled} />
        <Pressable
          style={styles.text}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${spokenTime}, ${alarm.label}, ${spokenRepeat(alarm.repeatDays)}, ${alarm.enabled ? 'on' : 'off'}`}
          accessibilityHint="Opens the alarm to edit it"
          accessibilityActions={[{ name: 'delete', label: deleteLabel }]}
          onAccessibilityAction={(event) => event.nativeEvent.actionName === 'delete' && onDelete()}
        >
          <View style={styles.timeLine}>
            <Text style={[styles.time, { color: textColor }]} maxFontSizeMultiplier={1.3}>
              {time}
            </Text>
            {period !== '' && (
              <Text style={[styles.period, { color: textColor }]} maxFontSizeMultiplier={1.3}>
                {period}
              </Text>
            )}
          </View>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>{alarmSubtitle(alarm)}</Text>
        </Pressable>
        {editing ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={16}
            tintColor={colors.secondaryText}
            accessible={false}
          />
        ) : (
          <Switch
            value={alarm.enabled}
            onValueChange={onToggle}
            trackColor={{ false: colors.switchOff, true: colors.accent }}
            ios_backgroundColor={colors.switchOff}
            thumbColor={alarm.enabled ? colors.switchThumbOn : colors.switchThumbOff}
            accessibilityLabel={`${spokenTime} alarm`}
          />
        )}
      </View>
    </ReanimatedSwipeable>
  );
}

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 88,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    deleteControl: {
      width: 44,
      height: 44,
      marginLeft: -spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      flex: 1,
      paddingVertical: spacing.xs,
    },
    timeLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 2,
    },
    time: {
      fontSize: 52,
      fontWeight: '300',
      fontVariant: ['tabular-nums'],
    },
    period: {
      fontSize: 26,
      fontWeight: '400',
    },
    subtitle: {
      fontSize: 15,
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
