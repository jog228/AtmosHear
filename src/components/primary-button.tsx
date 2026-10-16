import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { radius, spacing, typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICONS: Record<'play' | 'stop' | 'arrow', SymbolViewProps['name']> = {
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  stop: { ios: 'stop.fill', android: 'stop', web: 'stop' },
  arrow: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
};

type Props = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  // play/stop sit before the label; arrow (for a button that moves to the
  // next screen) after it.
  icon?: keyof typeof ICONS;
  // 'large': full width (e.g. "Play all cues"). 'pill': fits its label.
  size?: 'large' | 'pill';
};

// The navy primary button from design/frames/: white bold label (yellow
// with navy text in dark mode, sun with ink in high contrast).
export function PrimaryButton({ label, icon, size = 'large', ...rest }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const symbol = icon && (
    <SymbolView name={ICONS[icon]} size={size === 'large' ? 20 : 17} tintColor={theme.colors.buttonText} accessible={false} />
  );
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, styles[size], pressed && styles.pressed]}
      {...rest}
    >
      {icon !== 'arrow' && symbol}
      <Text style={[styles.label, size === 'pill' && styles.pillLabel]}>{label}</Text>
      {icon === 'arrow' && symbol}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm + 2,
      backgroundColor: theme.colors.buttonBackground,
    },
    large: {
      alignSelf: 'stretch',
      minHeight: 60,
      borderRadius: radius.button,
      paddingHorizontal: spacing.lg,
    },
    pill: {
      alignSelf: 'flex-start',
      minHeight: 48,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg - 4,
    },
    pressed: {
      opacity: 0.7,
    },
    label: {
      ...typography.title,
      color: theme.colors.buttonText,
    },
    pillLabel: {
      fontSize: 17,
    },
  });
}
