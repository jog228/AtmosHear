import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
  type Theme as NavigationTheme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LightOverlay } from '@/components/light-overlay';
import { AlarmHost } from '@/features/alarms/alarm-host';
import { lockPortrait } from '@/features/alarms/bedside-orientation';
import { BedsideSlotsProvider } from '@/features/alarms/bedside-slots';
import { OpeningPreferencesProvider } from '@/features/preferences/use-opening-preferences';
import { useBedsideWeather } from '@/hooks/use-bedside-weather';
import { PreferencesProvider, usePreferences } from '@/hooks/use-preferences';
import type { Theme } from '@/constants/theme';
import { ThemeProvider, useTheme } from '@/hooks/use-theme';
import { registerWakeWeather } from '@/services/wake-weather';

// ThemeProvider hides the splash screen once the saved settings have loaded.
SplashScreen.preventAutoHideAsync();
// Portrait everywhere; bedside mode turns to landscape while it's open.
lockPortrait();

export default function RootLayout() {
  return (
    // Gesture root for swipe-to-delete on the Alarms tab.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <OpeningPreferences>
          <ThemeProvider>
            <BedsideWeather>
              <ThemedStack />
            </BedsideWeather>
            {/* Rings alarms (and opens the ringing screen) on any tab. */}
            <AlarmHost />
            {/* Plays the weather under a ringing alarm. */}
            <WakeWeather />
            {/* Above every screen; never takes taps or VoiceOver focus. */}
            <LightOverlay />
          </ThemeProvider>
        </OpeningPreferences>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

// Opening-screen preferences, loaded before anything shows (the splash
// screen stays up). The simulated time only counts in Developer mode.
function OpeningPreferences({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  return (
    <OpeningPreferencesProvider allowSimulatedTime={preferences.developerMode}>{children}</OpeningPreferencesProvider>
  );
}

// Fills bedside mode's weather and sky slots from the weather side, since
// alarm code can't import weather code.
function BedsideWeather({ children }: { children: ReactNode }) {
  return <BedsideSlotsProvider value={useBedsideWeather()}>{children}</BedsideSlotsProvider>;
}

// Registers the weather on wake once, reading the latest preferences when
// an alarm rings (for Developer test weather).
function WakeWeather() {
  const { preferences } = usePreferences();
  const latest = useRef(preferences);
  useEffect(() => {
    latest.current = preferences;
  });
  useEffect(() => registerWakeWeather(() => latest.current), []);
  return null;
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
        {/* Picks the starting tab on launch, then gets out of the way. */}
        <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
        {/* Weather, Alarms, and Preferences tabs. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        {/* Cue screens: the native back button only (chevron), since each
            screen has its own big headline. */}
        <Stack.Screen name="sounds" options={{ title: 'Sounds', headerTitle: '', headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen name="condition/[id]" options={{ title: 'Condition', headerTitle: '', headerBackButtonDisplayMode: 'minimal' }} />
        {/* Alarms: full screen, no header. The ringing screen can't be
            swiped away; it closes itself when the alarm stops. */}
        <Stack.Screen
          name="alarm-ringing"
          options={{ presentation: 'fullScreenModal', animation: 'fade', headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="bedside" options={{ presentation: 'fullScreenModal', animation: 'fade', headerShown: false }} />
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
