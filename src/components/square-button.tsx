import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { cardShadow, radius, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 56pt: well over the 44pt minimum touch target.
export const SQUARE_BUTTON_SIZE = 56;
export const SQUARE_BUTTON_ICON = 26;

type Props = Omit<PressableProps, 'style' | 'children'> & {
  // 'card': white (navyCard in dark), with an accent icon.
  // 'primary': deepBlue (yellow in dark, sun in high contrast), with a
  // buttonText icon.
  variant: 'card' | 'primary';
  children: ReactNode;
};

// The rounded square buttons at the top of the Weather screen, after
// design/frames/06_Weather_home.png.
export function SquareButton({ variant, children, ...rest }: Props) {
  const styles = createStyles(useTheme());
  return (
    <Pressable style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed]} {...rest}>
      {children}
    </Pressable>
  );
}

// The icon color for each variant.
export function squareButtonIconColor(theme: Theme, variant: Props['variant']): string {
  return variant === 'card' ? theme.colors.accent : theme.colors.buttonText;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      width: SQUARE_BUTTON_SIZE,
      height: SQUARE_BUTTON_SIZE,
      borderRadius: radius.button,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: cardShadow(theme),
    primary: {
      backgroundColor: theme.colors.buttonBackground,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
