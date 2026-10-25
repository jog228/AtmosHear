import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ConditionIcon } from '@/components/weather-icon';
import { FONT_FAMILY, spacing, typography, type Theme } from '@/constants/theme';
import { NAME_MAX_LENGTH } from '@/features/preferences/opening-storage';
import { useOpeningPreferences } from '@/features/preferences/use-opening-preferences';
import { useTheme } from '@/hooks/use-theme';
import { getGreeting } from '@/services/greeting';

import { OnboardingPage } from './onboarding-page';

// Screen 4 of 5: an optional name for the greeting, prefilled with any saved
// one, with a live preview of the home screen's greeting. Continue (or the
// keyboard's return key) saves it, trimmed, to the same preference the
// Preferences Name field uses.
export function NameScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const { name: savedName, update, now } = useOpeningPreferences();
  const [name, setName] = useState(savedName);

  // The home screen's greeting (no sunset known here, so its usual
  // fallback), laid out the same way: "Good morning," / "Jolie!".
  const greeting = getGreeting(now(), null, name);
  const [first, ...rest] = greeting.split(', ');
  const display = [first, ...rest].join(',\n');

  const next = () => {
    update({ name: name.trim() });
    router.push('/onboarding/location');
  };

  return (
    <OnboardingPage
      step={4}
      textPosition="top"
      title={'What should\nwe call you?'}
      titleSize={52}
      body="Optional. We'll use it to greet you each morning."
      button={{ label: 'Continue', onPress: next }}
    >
      <View style={styles.field}>
        <View style={styles.labelRow}>
          <Text style={styles.fieldLabel} nativeID="onboarding-name-label">
            Name
          </Text>
          <Text style={styles.counter} accessibilityLabel={`${name.length} of ${NAME_MAX_LENGTH} characters`}>
            {name.length}/{NAME_MAX_LENGTH}
          </Text>
        </View>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={NAME_MAX_LENGTH}
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          autoComplete="given-name"
          returnKeyType="next"
          onSubmitEditing={next}
          accessibilityLabel="Name"
          accessibilityHint="Optional. Up to 15 characters."
          accessibilityLabelledBy="onboarding-name-label"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Preview</Text>
        <View style={styles.card} accessible accessibilityLabel={`Preview: ${greeting}`}>
          <Text style={styles.greeting}>{display}</Text>
          <ConditionIcon id="clear" size={40} />
        </View>
      </View>
    </OnboardingPage>
  );
}

function createStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    field: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    fieldLabel: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      fontWeight: '700',
      color: colors.buttonBackground,
    },
    counter: {
      fontFamily: FONT_FAMILY,
      fontSize: 15,
      fontVariant: ['tabular-nums'],
      color: colors.textSecondary,
    },
    input: {
      minHeight: 60,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.buttonBackground,
      backgroundColor: colors.card,
      paddingHorizontal: spacing.md,
      fontFamily: FONT_FAMILY,
      fontSize: 19,
      color: colors.textPrimary,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: spacing.lg,
    },
    greeting: {
      ...typography.h2,
      flexShrink: 1,
      color: colors.textPrimary,
    },
  });
}
