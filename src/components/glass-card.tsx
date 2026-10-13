import { BlurView } from 'expo-blur';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { cardShadow, radius, withAlpha } from '@/constants/theme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useTheme } from '@/hooks/use-theme';

import { useGlassBackdrop } from './glass-backdrop';

// A frosted glass card in light and dark mode. Falls back to a solid card
// in high contrast and when iOS Reduce Transparency is on.
export function GlassCard({ style, children, ...rest }: ViewProps) {
  const theme = useTheme();
  const reduceTransparency = useReduceTransparency();
  const backdrop = useGlassBackdrop();
  const { glass } = theme;

  if (!glass || reduceTransparency) {
    return (
      <View style={[styles.rounded, cardShadow(theme), style]} {...rest}>
        {children}
      </View>
    );
  }

  const condition = backdrop?.condition;
  const opacity = (condition && glass.tintOpacityByCondition[condition]) || glass.tintOpacity;

  return (
    <View style={[styles.rounded, { boxShadow: `0 4px 16px ${theme.colors.shadow}` }, style]} {...rest}>
      {/* Blur, tint, and edge are clipped to the rounded corners, behind the content. */}
      <View style={[StyleSheet.absoluteFill, styles.rounded, styles.clip]} pointerEvents="none">
        <BlurView
          intensity={glass.blurIntensity}
          tint={glass.blurTint}
          // Android blurs the GlassBackdrop; without one it shows a plain
          // translucent view.
          blurTarget={backdrop?.target}
          blurMethod={backdrop ? 'dimezisBlurViewSdk31Plus' : 'none'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.rounded,
            {
              backgroundColor: withAlpha(glass.tint, opacity),
              borderWidth: 1,
              borderColor: glass.border,
              borderTopColor: glass.borderTop,
            },
          ]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rounded: {
    borderRadius: radius.md,
  },
  clip: {
    overflow: 'hidden',
  },
});
