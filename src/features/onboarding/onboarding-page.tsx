import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT_FAMILY, spacing, type Theme } from '@/constants/theme';
import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';
import { useTheme } from '@/hooks/use-theme';

import { markOnboardingCompleted } from './onboarding-storage';

export const ONBOARDING_STEPS = 5;
// Big headlines can grow with Dynamic Type, but not without limit.
const TITLE_MAX_SCALE = 1.5;
const MIN_TOUCH = 44;

// Finishing or skipping: remember it, then go to the tab for the time of
// day. dismissTo replaces onboarding on a first launch, and returns to the
// tabs underneath when it was replayed from Developer settings.
export function useFinishOnboarding() {
  const router = useRouter();
  const { startTab } = useOpeningPreferences();
  return () => {
    markOnboardingCompleted();
    router.dismissTo(startTab() === 'alarms' ? '/alarms' : '/weather');
  };
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  // 'arrow' after the label (moves on); 'pin' before it, centered.
  icon?: 'arrow' | 'pin';
  disabled?: boolean;
  accessibilityHint?: string;
};

const ICONS: Record<'arrow' | 'pin', SymbolViewProps['name']> = {
  arrow: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  pin: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
};

type Props = {
  // 1-5, for the page dots and the "N of 5" label.
  step: number;
  // Back and Skip at the top, and the "N of 5" label (not on Welcome).
  showNav?: boolean;
  // 'bottom' (default): the hero fills the top, the text block sits at the
  // bottom. 'top': the label, title, and body (and children) at the top,
  // the dots and button at the bottom.
  textPosition?: 'bottom' | 'top';
  hero?: ReactNode;
  title: ReactNode;
  // Read by VoiceOver as the header, when the title isn't plain text.
  titleLabel?: string;
  titleSize: number;
  body: string;
  // Under the body (e.g. the name field), above the dots.
  children?: ReactNode;
  button: ButtonProps;
  // Under the button (e.g. "Not now").
  footer?: ReactNode;
};

// The shared onboarding layout (Version A): Back and Skip at the top, a
// hero, then a left-aligned block with "N of 5", a big headline, body
// text, five page dots, and a full-width navy button. Inside the safe
// area; scrolls when Dynamic Type makes it taller than the screen.
export function OnboardingPage({
  step,
  showNav = true,
  textPosition = 'bottom',
  hero,
  title,
  titleLabel,
  titleSize,
  body,
  children,
  button,
  footer,
}: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const finish = useFinishOnboarding();

  const label = showNav && (
    <Text style={styles.stepLabel}>
      {step} of {ONBOARDING_STEPS}
    </Text>
  );
  const heading = (
    <Text
      style={[styles.title, { fontSize: titleSize, lineHeight: Math.round(titleSize * 0.98) }]}
      accessibilityRole="header"
      accessibilityLabel={titleLabel}
      maxFontSizeMultiplier={TITLE_MAX_SCALE}
    >
      {title}
    </Text>
  );
  const bottom = (
    <View style={styles.bottomBlock}>
      <PageDots step={step} theme={theme} />
      <OnboardingButton {...button} />
      {footer}
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {showNav && (
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.touch, pressed && styles.pressed]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={22}
              weight="semibold"
              tintColor={theme.colors.buttonBackground}
              accessible={false}
            />
          </Pressable>
          <Pressable
            onPress={finish}
            style={({ pressed }) => [styles.touch, styles.skip, pressed && styles.pressed]}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Skip"
            accessibilityHint="Skips the introduction and opens the app"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.md }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {textPosition === 'bottom' ? (
          <>
            <View style={styles.hero}>{hero}</View>
            <View style={styles.textBlock}>
              {label}
              {heading}
              <Text style={styles.body}>{body}</Text>
              {children}
            </View>
            {bottom}
          </>
        ) : (
          <>
            <View style={styles.textBlock}>
              {label}
              {heading}
              <Text style={styles.body}>{body}</Text>
              {children}
            </View>
            <View style={styles.spacer} />
            {bottom}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Five dots: the current one bigger, in the button color. Decorative: the
// "N of 5" label says it in words.
function PageDots({ step, theme }: { step: number; theme: Theme }) {
  const styles = createStyles(theme);
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
        <View key={i} style={i + 1 === step ? styles.dotCurrent : styles.dot} />
      ))}
    </View>
  );
}

// The full-width navy button: 60pt, radius 22, white label on the left and
// an arrow on the right (or a centered pin and label).
export function OnboardingButton({ label, onPress, icon = 'arrow', disabled, accessibilityHint }: ButtonProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const symbol = (
    <SymbolView name={ICONS[icon]} size={20} weight="semibold" tintColor={theme.colors.buttonText} accessible={false} />
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        icon === 'pin' && styles.buttonCentered,
        (pressed || disabled) && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
    >
      {icon === 'pin' && symbol}
      <Text style={styles.buttonText}>{label}</Text>
      {icon === 'arrow' && symbol}
    </Pressable>
  );
}

export function createStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
    },
    touch: {
      minWidth: MIN_TOUCH,
      minHeight: MIN_TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skip: {
      paddingHorizontal: spacing.sm,
    },
    skipText: {
      fontFamily: FONT_FAMILY,
      fontSize: 17,
      fontWeight: '700',
      color: colors.buttonBackground,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    hero: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    spacer: {
      flexGrow: 1,
    },
    textBlock: {
      gap: spacing.sm + 2,
    },
    stepLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    title: {
      fontFamily: FONT_FAMILY,
      fontWeight: '800',
      letterSpacing: -1.5,
      color: colors.textPrimary,
    },
    body: {
      fontFamily: FONT_FAMILY,
      fontSize: 19,
      lineHeight: 26,
      color: colors.textSecondary,
    },
    bottomBlock: {
      gap: spacing.md,
    },
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    dotCurrent: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.buttonBackground,
    },
    button: {
      minHeight: 60,
      borderRadius: 22,
      backgroundColor: colors.buttonBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    buttonCentered: {
      justifyContent: 'center',
    },
    buttonText: {
      flexShrink: 1,
      fontFamily: FONT_FAMILY,
      fontSize: 19,
      fontWeight: '700',
      color: colors.buttonText,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
