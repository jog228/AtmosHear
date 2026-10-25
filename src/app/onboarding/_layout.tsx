import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// First-run onboarding (src/features/onboarding/): five screens on their own
// stack, no tab bar. Swipe back works between screens, but not on Welcome
// (and the root stack blocks swiping onboarding away). "+6 More" opens the
// Sound library here as a modal.
export default function OnboardingLayout() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
      <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
      <Stack.Screen name="senses" />
      <Stack.Screen name="night" />
      <Stack.Screen name="name" />
      <Stack.Screen name="location" />
      <Stack.Screen
        name="sounds"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.colors.background },
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={{ fontSize: 17, fontWeight: '700', color: theme.colors.buttonBackground }}>Done</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  );
}
