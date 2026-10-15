import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
  type Theme as NavigationTheme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PreferencesProvider } from '@/hooks/use-preferences';
import type { Theme } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';

// ThemeProvider hides the splash screen once the saved settings have loaded.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    // Gesture root for swipe-to-delete on the Alarms tab.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const theme = useTheme();

  return (
    // Our colors for the navigators, so they never paint React Navigation's
    // default light background behind a screen (e.g. inside the tabs).
    <NavigationThemeProvider value={navigationTheme(theme)}>
      <StatusBar style={theme.statusBarStyle} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.heading,
          headerShadowVisible: false,
        }}
      >
        {/* Weather and Alarms tabs; Settings opens above them. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen
          name="test-weather"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

// The app theme in React Navigation's format, for light, dark, and high
// contrast.
function navigationTheme(theme: Theme): NavigationTheme {
  const base = theme.name === 'light' ? DefaultTheme : DarkTheme;
  return {
    ...base,
    dark: theme.name !== 'light',
    colors: {
      ...base.colors,
      primary: theme.colors.buttonBackground,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
    },
  };
}
