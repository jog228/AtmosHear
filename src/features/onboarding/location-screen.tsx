import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { FONT_FAMILY, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getPlace } from '@/services/location';

import { LocationPinIllustration } from './illustrations';
import { OnboardingPage, useFinishOnboarding } from './onboarding-page';

// Asking can take a while (finding the position, then its name); onboarding
// finishes after this at most, whatever the answer.
const ASK_TIMEOUT_MS = 12_000;

// Screen 5 of 5: location. "Use my location" asks for permission through
// the location service (getPlace, which falls back to Bethlehem, PA when
// it's denied), then finishes either way. "Not now" finishes without
// asking, so the Bethlehem fallback applies. No notification prompt here.
export function LocationScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const finish = useFinishOnboarding();
  const [asking, setAsking] = useState(false);

  const askForLocation = async () => {
    setAsking(true);
    await Promise.race([getPlace().catch(() => null), new Promise((resolve) => setTimeout(resolve, ASK_TIMEOUT_MS))]);
    finish();
  };

  return (
    <OnboardingPage
      step={5}
      hero={<LocationPinIllustration />}
      title={'Where\nare you?'}
      titleSize={56}
      body="We use your location only to play your local weather. Without it, we'll start with Bethlehem, PA."
      button={{
        label: asking ? 'Finding you…' : 'Use my location',
        icon: 'pin',
        onPress: askForLocation,
        disabled: asking,
        accessibilityHint: 'Asks for your location, then opens the app',
      }}
      footer={
        <Pressable
          onPress={finish}
          disabled={asking}
          style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Not now"
          accessibilityHint="Opens the app with Bethlehem, PA weather"
        >
          <Text style={styles.notNowText}>Not now</Text>
        </Pressable>
      }
    />
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    notNow: {
      alignSelf: 'center',
      minHeight: 44,
      minWidth: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    notNowText: {
      fontFamily: FONT_FAMILY,
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.buttonBackground,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
