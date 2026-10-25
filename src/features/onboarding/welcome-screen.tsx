import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { OnboardingPage } from './onboarding-page';

const ICON_SIZE = 240;

// Screen 1 of 5: the app icon, "Atmos / Hear", and Get started. No Back or
// Skip; back gestures are blocked (onboarding/_layout.tsx), and so is
// Android's back button here.
export function WelcomeScreen() {
  const router = useRouter();
  const { illustration } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, []),
  );

  return (
    <OnboardingPage
      step={1}
      showNav={false}
      hero={
        <Image
          source={require('../../../assets/images/app-icon.png')}
          style={{ width: ICON_SIZE, height: ICON_SIZE, borderRadius: 54 }}
          accessible={false}
        />
      }
      title={
        <>
          Atmos{'\n'}
          {/* Periwinkle on mist is 3.7:1, enough for text this large. */}
          <Text style={{ color: illustration.dots }}>Hear</Text>
        </>
      }
      titleLabel="AtmosHear"
      titleSize={64}
      body="Hear the weather. Feel the day."
      button={{ label: 'Get started', onPress: () => router.push('/onboarding/senses') }}
    />
  );
}
