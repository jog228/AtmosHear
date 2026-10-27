import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { repeatSummary, timeText } from './alarm-format';
import { BigButton } from './alarm-parts';
import { DEFAULT_LABEL, type Alarm } from './alarm-types';

type Props = {
  alarm: Alarm;
  uses24Hour: boolean;
  onDelete: () => void;
  onKeep: () => void;
};

// "Delete this alarm?" (design/frames/18 Delete alarm.png): a sheet over
// the editor with Delete alarm and Keep alarm. Tapping the dimmed editor
// behind keeps it too. VoiceOver stays inside the sheet. Reanimated skips
// the slide with Reduce Motion.
export function DeleteSheet({ alarm, uses24Hour, onDelete, onKeep }: Props) {
  const colors = useAlarmColors();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const description = deleteDescription(alarm, uses24Hour);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Delete this alarm? ${description}`);
  }, [description]);

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={onKeep}
          accessible={false}
          importantForAccessibility="no"
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(250)}
        style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <View style={styles.grabber} />
        <Text style={styles.title} accessibilityRole="header">
          Delete this alarm?
        </Text>
        <Text style={styles.body}>{description}</Text>
        <View style={styles.buttons}>
          <BigButton label="Delete alarm" variant="strong" onPress={onDelete} />
          <BigButton label="Keep alarm" variant="quiet" onPress={onKeep} />
        </View>
      </Animated.View>
    </View>
  );
}

// "6:30 AM, weekdays, will be removed." The label is named when it isn't
// the default "Alarm".
function deleteDescription(alarm: Alarm, uses24Hour: boolean): string {
  const summary = repeatSummary(alarm.repeatDays);
  const repeat = alarm.repeatDays.length === 0 ? 'one time' : ['Every day', 'Weekdays', 'Weekends'].includes(summary) ? summary.toLowerCase() : summary;
  const label = alarm.label !== DEFAULT_LABEL ? `“${alarm.label}”` : null;
  return [timeText(alarm.hour, alarm.minute, uses24Hour), label, repeat].filter(Boolean).join(', ') + ', will be removed.';
}

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    scrim: {
      backgroundColor: colors.scrim,
    },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.sheet,
      borderTopLeftRadius: radius.lg + 8,
      borderTopRightRadius: radius.lg + 8,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md + spacing.sm,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.chipBorder,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '800',
      letterSpacing: -0.5,
      color: colors.text,
    },
    body: {
      fontSize: 17,
      lineHeight: 24,
      color: colors.secondaryText,
    },
    buttons: {
      gap: spacing.sm + 4,
      marginTop: spacing.md,
    },
  });
}
