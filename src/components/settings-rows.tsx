import { SymbolView } from 'expo-symbols';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { cardShadow, radius, spacing, typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Building blocks for the Preferences tab, so every row looks and reads the
// same to screen readers. Styled after design/frames/12_Preferences.png:
// rows sit on the page background between thin lines, with a bold title,
// an optional subtitle, and a control on the right. Only uses the theme, so
// src/features/preferences can use it too.

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = createStyles(useTheme());
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

// A run of rows with a line above, below, and between them (give every row
// after the first `divider`).
export function RowGroup({ style, ...rest }: ViewProps) {
  const styles = createStyles(useTheme());
  return <View style={[styles.group, style]} {...rest} />;
}

type SwitchRowProps = {
  label: string;
  description?: string;
  // What screen readers say, if different from the visible label.
  accessibilityLabel?: string;
  accessibilityHint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  divider?: boolean;
};

// The whole row is the switch, so it's a big target and reads as one item.
export function SwitchRow({ label, description, accessibilityLabel, accessibilityHint, value, onValueChange, divider }: SwitchRowProps) {
  const styles = createStyles(useTheme());
  return (
    <Pressable
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
    >
      <RowText label={label} description={description} />
      <Toggle on={value} />
    </Pressable>
  );
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB = 24;
const BORDER = 2;
const TRAVEL = TRACK_WIDTH - THUMB - (TRACK_HEIGHT - THUMB);

// The frame's toggle: a filled track with an amber thumb when on, an
// outlined track with a gray thumb when off. Drawn, since the native Switch
// can't be outlined. Decorative: the row is the switch for screen readers.
function Toggle({ on }: { on: boolean }) {
  const styles = createStyles(useTheme());
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

type Option<T extends string> = { value: T; label: string; description?: string };

// Rows of radio options, one selected.
export function OptionGroup<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <RowGroup accessibilityRole="radiogroup">
      {options.map((option, i) => (
        <Pressable
          key={option.value}
          style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
          onPress={() => onSelect(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ checked: option.value === selected }}
          accessibilityLabel={option.label}
          accessibilityHint={option.description}
        >
          <RowText label={option.label} description={option.description} />
          {option.value === selected && <Checkmark color={theme.colors.accent} />}
        </Pressable>
      ))}
    </RowGroup>
  );
}

// A segmented control: one choice from a few short options, side by side,
// as rounded white buttons like the frame's − and + buttons. Screen readers
// hear each segment as a radio button, "System, selected".
export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel,
  accessibilityHint,
}: {
  // `spoken` replaces the label for screen readers, e.g. "Celsius" for "°C".
  options: { value: T; label: string; spoken?: string }[];
  selected: T;
  onSelect: (value: T) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [styles.segment, isSelected && styles.segmentSelected, pressed && styles.pressed]}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.spoken ?? option.label}
            accessibilityHint={accessibilityHint}
          >
            {/* One line each: shrinks a little rather than wrap when four
                options share the row. */}
            <Text
              style={[styles.segmentText, isSelected && styles.segmentTextSelected]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A titled row with a segmented control under it (and an optional note),
// e.g. Appearance › Bedside mode.
export function SegmentedRow<T extends string>({
  label,
  description,
  note,
  divider,
  ...control
}: {
  label: string;
  description?: string;
  note?: string;
  divider?: boolean;
} & Parameters<typeof SegmentedControl<T>>[0]) {
  const styles = createStyles(useTheme());
  return (
    <View style={[styles.stackedRow, divider && styles.divider]}>
      <RowText label={label} description={description} />
      <SegmentedControl {...control} />
      {note && <Text style={styles.description}>{note}</Text>}
    </View>
  );
}

// A row that opens something, with the current value as its subtitle (like
// the frame's "Location / New York, NY"). Screen readers hear
// "<label>, <value>, button".
export function ValueRow({
  label,
  value,
  accessibilityHint,
  onPress,
  divider,
}: {
  label: string;
  value: string;
  accessibilityHint?: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
      accessibilityHint={accessibilityHint}
    >
      <RowText label={label} description={value} />
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        weight="semibold"
        tintColor={theme.colors.textPrimary}
        accessible={false}
      />
    </Pressable>
  );
}

// A row that does something right away, like a button.
export function ActionRow({
  label,
  description,
  accessibilityHint,
  onPress,
  divider,
}: {
  label: string;
  description?: string;
  accessibilityHint?: string;
  onPress: () => void;
  divider?: boolean;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <RowText label={label} description={description} />
      <SymbolView
        name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }}
        size={18}
        tintColor={theme.colors.textPrimary}
        accessible={false}
      />
    </Pressable>
  );
}

function RowText({ label, description }: { label: string; description?: string }) {
  const styles = createStyles(useTheme());
  return (
    <View style={styles.text}>
      <Text style={styles.label}>{label}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

function Checkmark({ color }: { color: string }) {
  return <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={22} tintColor={color} accessible={false} />;
}

function createStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    section: {
      gap: spacing.md,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    group: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 64,
      paddingVertical: spacing.sm + 4,
    },
    pressed: {
      opacity: 0.6,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.title,
      color: colors.textPrimary,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
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
    segments: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    segment: {
      ...cardShadow(theme),
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      borderRadius: radius.button,
    },
    segmentSelected: {
      backgroundColor: colors.buttonBackground,
      borderColor: colors.buttonBackground,
    },
    segmentText: {
      ...typography.title,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    stackedRow: {
      gap: spacing.sm,
      paddingVertical: spacing.sm + 4,
    },
    segmentTextSelected: {
      color: colors.buttonText,
    },
  });
}
