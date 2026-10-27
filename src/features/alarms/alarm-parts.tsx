import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ClockSun, DotRings, type PulseSource } from '@/components/brand';
import { LARGE_TEXT_MAX_SCALE, radius, spacing } from '@/constants/theme';

import { useAlarmColors, type AlarmColors } from './alarm-colors';
import { DAY_NAMES } from './alarm-format';

// Small pieces shared by the alarm screens, in Sofia's style
// (design/frames/13 Alarms, empty.png through 27 Snoozed.png). Colors come
// from AlarmColors only: the app theme's accent follows the weather.

// 56pt: well over the 44pt minimum touch target.
const SQUARE_SIZE = 56;

type SquareProps = Omit<PressableProps, 'style' | 'children'> & {
  // 'card': white, accent icon. 'primary': accent fill, onAccent icon.
  variant: 'card' | 'primary';
  children: ReactNode;
};

// The rounded square buttons at the top of the Alarms tab (bedside, +).
export function SquareButton({ variant, children, ...rest }: SquareProps) {
  const styles = createStyles(useAlarmColors());
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.square, styles[variant], pressed && styles.pressed]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  // primary: navy. card: white. strong: ink (Delete alarm). quiet: mist.
  variant?: 'primary' | 'card' | 'strong' | 'quiet';
  // A + before the label ("Add alarm").
  plus?: boolean;
  // 'fill' stretches to the row's width; 'fit' hugs the label.
  width?: 'fill' | 'fit' | 'flex';
  height?: number;
  // Instead of the Alarms tab's colors (the ringing screen over bedside).
  colors?: AlarmColors;
};

// The big rounded buttons: Add alarm, Save alarm, Snooze and Stop, Delete
// and Keep. Labels grow with Dynamic Type; the button grows with them.
export function BigButton({ label, variant = 'primary', plus, width = 'fill', height = 60, colors: override, ...rest }: ButtonProps) {
  const tabColors = useAlarmColors();
  const colors = override ?? tabColors;
  const styles = createStyles(colors);
  const textColor = {
    primary: colors.onAccent,
    card: colors.text,
    strong: colors.onStrongButton,
    quiet: colors.text,
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        width === 'fill' && styles.fill,
        width === 'fit' && styles.fit,
        width === 'flex' && styles.flex,
        { minHeight: height },
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      {plus && (
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={20} weight="semibold" tintColor={textColor} accessible={false} />
      )}
      <Text style={[styles.buttonLabel, { color: textColor }]} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
        {label}
      </Text>
    </Pressable>
  );
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB = 24;
const BORDER = 2;
const TRAVEL = TRACK_WIDTH - THUMB - (TRACK_HEIGHT - THUMB);

// The frame's toggle, drawn (the native Switch can't be outlined).
// Decorative: whatever holds it is the switch for screen readers.
export function Toggle({ on }: { on: boolean }) {
  const styles = createStyles(useAlarmColors());
  const reduceMotion = useReducedMotion();
  const position = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    position.value = reduceMotion ? (on ? 1 : 0) : withTiming(on ? 1 : 0, { duration: 150 });
  }, [on, reduceMotion, position]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * TRAVEL }] }));

  return (
    <View style={[styles.track, on ? styles.trackOn : styles.trackOff]} accessible={false} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.thumb, on ? styles.thumbOn : styles.thumbOff, thumbStyle]} />
    </View>
  );
}

// Monday first, like the frames.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

// The seven day circles: filled when the alarm repeats that day. Each is
// a checkbox ("Monday, checked").
export function DayChips({ days, onToggle }: { days: number[]; onToggle: (day: number) => void }) {
  const styles = createStyles(useAlarmColors());
  return (
    <View style={styles.days}>
      {WEEK.map((day) => {
        const on = days.includes(day);
        return (
          <Pressable
            key={day}
            style={({ pressed }) => [styles.day, on ? styles.dayOn : styles.dayOff, pressed && styles.pressed]}
            onPress={() => onToggle(day)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={DAY_NAMES[day]}
          >
            <Text style={[styles.dayLetter, on && styles.dayLetterOn]} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
              {DAY_NAMES[day][0]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type SunRingsProps = {
  size: number;
  // The time on the clock face, or the real time.
  clock: { hour: number; minute: number } | 'live';
  pulses?: PulseSource;
};

// The clock-face sun inside rings of dots, warm inside and cool outside
// (frames 13, 26, 27). Decorative.
export function SunRings({ size, clock, pulses }: SunRingsProps) {
  const colors = useAlarmColors();
  const sun = Math.round(size * 0.36);
  return (
    <DotRings
      size={size}
      rings={6}
      colors={[colors.ringsWarm, colors.ringsWarm, colors.ringsWarm, colors.ringsCool, colors.ringsCool, colors.ringsCool]}
      pulses={pulses}
    >
      {clock === 'live' ? <ClockSun size={sun} live /> : <ClockSun size={sun} hour={clock.hour} minute={clock.minute} />}
    </DotRings>
  );
}

// The bedside button's icon: a dot rising inside an arc of small dots,
// like the bedside dome. Drawn from circles, like the app's other icons.
export function BedsideIcon({ size = 26, color }: { size?: number; color: string }) {
  const arc = [-70, -35, 0, 35, 70].map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: 9 + 8 * Math.sin(rad), y: 13 - 8 * Math.cos(rad) * 0.9 };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={6} cy={13} r={3} fill={color} />
      {arc.map((dot, i) => (
        <Circle key={i} cx={dot.x + 6} cy={dot.y + 3} r={1.4} fill={color} />
      ))}
    </Svg>
  );
}

const DAY_GAP = 6;

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    square: {
      width: SQUARE_SIZE,
      height: SQUARE_SIZE,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.card,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
    },
    primary: {
      backgroundColor: colors.accent,
    },
    pressed: {
      opacity: 0.7,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm + 2,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    button_primary: {
      backgroundColor: colors.accent,
    },
    button_card: {
      backgroundColor: colors.card,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
    },
    button_strong: {
      backgroundColor: colors.strongButton,
    },
    button_quiet: {
      backgroundColor: colors.quietButton,
      borderWidth: colors.cardBorderWidth,
      borderColor: colors.separator,
    },
    fill: {
      alignSelf: 'stretch',
    },
    fit: {
      alignSelf: 'flex-start',
    },
    flex: {
      flex: 1,
    },
    buttonLabel: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      borderWidth: BORDER,
      justifyContent: 'center',
      paddingHorizontal: (TRACK_HEIGHT - THUMB) / 2 - BORDER,
    },
    trackOn: {
      backgroundColor: colors.switchTrackOn,
      borderColor: colors.switchTrackOn,
    },
    trackOff: {
      backgroundColor: colors.switchTrackOff,
      borderColor: colors.switchBorderOff,
    },
    thumb: {
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
    },
    thumbOn: {
      backgroundColor: colors.switchThumbOn,
    },
    thumbOff: {
      backgroundColor: colors.switchThumbOff,
    },
    days: {
      flexDirection: 'row',
      gap: DAY_GAP,
    },
    // Shares the row; on the narrowest phones (320pt) still 40pt wide, but
    // 44pt tall, and the row has no other targets beside it.
    day: {
      flex: 1,
      aspectRatio: 1,
      minHeight: 44,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayOn: {
      backgroundColor: colors.accent,
    },
    dayOff: {
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.chipBorder,
    },
    dayLetter: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    dayLetterOn: {
      color: colors.onAccent,
    },
  });
}
