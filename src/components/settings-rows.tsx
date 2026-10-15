import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { GlassCard } from './glass-card';

// Building blocks for the Settings screen, so every row looks and reads the
// same to screen readers.

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
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      style={[styles.row, divider && styles.divider]}
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
    >
      <RowText label={label} description={description} />
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.switchTrackOff, true: theme.colors.switchTrackOn }}
        ios_backgroundColor={theme.colors.switchTrackOff}
        thumbColor={theme.colors.switchThumb}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}

type Option<T extends string> = { value: T; label: string; description?: string };

// A card of radio options, one selected.
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
    <GlassCard accessibilityRole="radiogroup">
      {options.map((option, i) => (
        <Pressable
          key={option.value}
          style={[styles.row, i > 0 && styles.divider]}
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
    </GlassCard>
  );
}

// A segmented control: one choice from a few short options, side by side.
// Screen readers hear each segment as a radio button, "System, selected".
export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
  accessibilityLabel,
  accessibilityHint,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <GlassCard accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      <View style={styles.segments}>
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              style={[styles.segment, isSelected && styles.segmentSelected]}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={option.label}
              accessibilityHint={accessibilityHint}
            >
              <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

// A row that opens something, showing the current value on the right.
// Screen readers hear "<label>, <value>, button".
export function ValueRow({ label, value, onPress, divider }: { label: string; value: string; onPress: () => void; divider?: boolean }) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      style={[styles.row, divider && styles.divider]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}`}
    >
      <RowText label={label} />
      <Text style={styles.value}>{value}</Text>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        tintColor={theme.colors.textSecondary}
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
        size={16}
        tintColor={theme.colors.textSecondary}
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
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.heading,
      marginLeft: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      padding: spacing.md,
    },
    pressed: {
      opacity: 0.6,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    text: {
      flex: 1,
      gap: spacing.xs,
    },
    label: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    segments: {
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.xs,
    },
    segment: {
      flex: 1,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md - spacing.xs,
    },
    segmentSelected: {
      backgroundColor: theme.colors.buttonBackground,
    },
    segmentText: {
      fontSize: 17,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    segmentTextSelected: {
      color: theme.colors.buttonText,
    },
    value: {
      fontSize: 17,
      color: theme.colors.textSecondary,
      flexShrink: 1,
      textAlign: 'right',
    },
  });
}
