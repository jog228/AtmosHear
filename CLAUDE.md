@AGENTS.md

# Project context

**AtmosHear** — Weather you can hear and feel.

Always write the name as "AtmosHear" (capital A, capital H). The slug, scheme, and package name stay `immersive-weather` / `immersiveweather` so the Expo project link doesn't break.

Multi-sensory weather app for a DES 156 class project, due 10/29/2026. This is the author's first mobile app: build in small steps and briefly explain each one.

## Concept

Each weather condition has its own sound, vibration pattern, and color so users can understand the forecast without looking at the screen. Accessibility for vision-impaired users is the core goal. A teammate is sourcing sounds and another is finalizing visual style, so keep sounds and colors easy to swap.

## Stack

- Expo + TypeScript + Expo Router (routes in `src/app`).
- Weather: Open-Meteo first, then the NWS API as backup, then the last saved forecast, then demo data (`src/services/weather.ts`). Every provider in `src/services/providers/` returns the shared `WeatherData` type (`src/services/weather-data.ts`); the rest of the app only uses that type. NWS requests must send a User-Agent header. Air quality (US AQI) is a separate Open-Meteo Air Quality request made alongside whichever provider answers (`src/services/air-quality.ts`, levels in `src/constants/air-quality.ts`); `WeatherData.airQuality` is null when it fails, and the last good value is saved separately for offline use. Severe alerts from the NWS API later.
- `expo-location`, `expo-audio`, `@react-native-async-storage/async-storage`.
- Vibration uses `expo-haptics` (works in Expo Go). Some patterns move to Core Haptics (AHAP) later in a dev build; until then, everything must run in Expo Go.

## Conditions

clear, partly cloudy, overcast, light rain, heavy rain, thunderstorm, snow, sleet, fog, wind, extreme heat, extreme cold, severe alert.

Conditions can overlap (e.g. rain + wind). A single condition profile file maps each condition to its sound file, haptic pattern, color, and light animation.

## Adding a condition sound

Every sound follows one pattern, so adding one is a one-line change:

1. Put the file at `assets/sounds/<condition-id>.m4a`, named exactly after the condition ID in `src/constants/conditions.ts` (e.g. `heavy-rain.m4a`, `partly-cloudy.m4a`, `severe-alert.m4a`).
2. In `src/constants/condition-profiles.ts`, replace that condition's `// TODO: awaiting sound from teammate.` and `sound: null` with `sound: require('../../assets/sounds/<condition-id>.m4a'),`. It must be a static `require()` so Expo bundles it.

File requirements: a short loop (about 4 seconds) with fades at both ends so the loop point doesn't click, loudness-matched to `clear.m4a` (about -27 LUFS integrated). If a file comes in louder, either ask for a re-export or add `soundVolume` (0-1) to that profile as a correction: `10 ** (-differenceInLU / 20)`. `sleet.m4a` currently uses `soundVolume: 0.48` because it measures 6.3 LU louder. `heavy-rain.m4a` uses `soundVolume: 0.7` to sit between clear and thunderstorm (the file measures -21.1 LUFS). Some files are intentionally softer: `snow.m4a` (-28.3 LUFS) is meant to feel hushed, so don't normalize it up. `light-rain.m4a` (-33.5 LUFS) is intentionally a step softer than heavy rain, so don't normalize it either. `overcast.m4a` (-29.1 LUFS) is an intentionally soft hum; don't normalize it up. `wind.m4a` (-30.4 LUFS) is a gusty recording that plays uncorrected. `extreme-cold.m4a` (-28.0 LUFS) is a rhythmic ice crack once per second, so it must stay exactly 4.000 seconds (expo-audio loops without a gap). Some are intentionally louder: `thunderstorm.m4a` (-21.2 LUFS) is meant to feel intense, so don't normalize it down.

Playback (looping, crossfades, layering overlapping conditions, background pause, VoiceOver ducking, the Settings toggle and the home screen mute button, which share one `ambientSound` setting) is handled by `src/services/ambient-sound.ts` for every condition; nothing else needs to change. When conditions overlap, every one with a sound plays as its own layer, each at `1/√layers` volume (about 71% for two) so the mix isn't louder than one sound; conditions without a file are skipped. Background sounds set `supportingVolume` in their profile to sit under other sounds (overcast: 60%; wind: 50%, or 30% under snow and 25% under light rain via `supportingVolumeWith`) and play at full level when they're the only sound.

## Vibration

Each condition's `haptic` field in `src/constants/condition-profiles.ts` is a pattern of timed taps (`{ at, style }`, helpers in `src/constants/haptics.ts`); patterns differ mainly by rhythm. `src/services/haptics.ts` plays them (one sequence at a time, never looped, a no-op on web), and `src/hooks/use-condition-haptics.ts` decides when: once when weather loads, when the conditions change, and when the weather icon is tapped. Combinations play the most significant pattern, then the next after 400 ms. The Settings "Vibration" toggle turns condition patterns off; the severe alert pattern plays with each alert beep regardless, and a condition pattern can't interrupt it.

## Severe alert sound

Alerts are separate from the ambient condition sounds. `assets/sounds/severe-alert.m4a` (a beep plus a short pause, set in `src/constants/alert-sound.ts` with the repeat count and duck level) plays 3 times back to back at full volume when a new alert appears or the app opens with one, while the ambient sounds duck to 20%. Then the conditions underneath keep playing; `severe-alert` itself has no ambient loop. It ignores the "Ambient sound" toggle and VoiceOver ducking, beeps once per alert ID per session, and announces "Severe weather alert: <name>" after the beeps. Tapping the weather icon during an alert replays it. Logic: `src/services/alert-sound.ts` and `src/hooks/use-alert-sound.ts`. Alerts come in as `WeatherData.alert` (`{ id, name }`); only test weather sets it until NWS alert fetching is built. When it is, the alert ID must stay stable across refreshes, and think about whether a saved (cached) forecast should keep its alert.

## Must-haves

- Live weather by location with a Bethlehem, PA fallback.
- Demo mode to force any condition.
- Sound-only / vibration-only / light-only modes.
- High-contrast theme.
- °F / °C setting (Settings › Temperature: Auto, °F, °C). Auto (default) uses the usual unit in the country of the last live location (`src/constants/temperature-units.ts`, country saved as `locationCountry`), or the phone region's before the first one. Weather data stays in °F; components convert for display with `useTemperature()`.

## Developer mode

Settings › Developer replaces live weather with filler data for testing and presenting (no API calls), or forces one live provider (Open-Meteo or NWS, no fallback). All filler values and the list of test conditions and combinations live in `src/constants/test-weather.ts`; `src/services/providers/demo.ts` turns them into a 12-hour forecast. The same filler is the last-resort fallback when no live or saved weather exists. A "Developer mode" pill always shows on the home screen while it's on. The "Severe alert" test weather comes with a test alert over thunderstorm + heavy rain, beeping each time it's picked; "Replay alert" in the Developer section plays the beeps on demand.

## Design direction

Use `design/reference.png` for layout and mood, not as an exact copy:

- Pale blue-gray background, white rounded cards with soft shadows.
- Centered header (title and greeting); the location sits under the temperature, above the detail cards.
- Large condition illustration, condition name, large temperature.
- A row of detail cards, a horizontal hourly forecast, and a 3-day forecast (`WeatherData.daily`: today and the next two days; NWS builds it by grouping its hourly forecast by day).
- All text must meet WCAG AA contrast (4.5:1).
- Light, dark, and high-contrast themes live in `src/constants/theme.ts`. Components only use token names, never hex codes. Dark follows the phone's setting unless overridden in Settings; high contrast overrides both. In dark mode, royalBlue is a fill only, never text.
- The accent color comes from the current condition, defined in one theme file.

## Code organization

Keep files small: screens in `src/app/`, UI in `src/components/`, API calls and data logic in `src/services/`, static mappings and theme in `src/constants/`.

## Alarms

The app has three native tabs (`src/app/(tabs)/`): Weather (`weather.tsx`), Alarms (`alarms.tsx`), and Preferences (`preferences.tsx`). Settings and the test-weather sheet stay on the root stack above the tabs. The Alarms tab is an Apple Clock-style alarm list; alarms don't ring yet (no notifications). All alarm code lives in `src/features/alarms/` and must not import weather code: it only uses the base palette (`palette`/`darkPalette` via `alarm-colors.ts`, no condition colors) and `useTheme`. Alarms are saved in AsyncStorage under `alarms.list`. The weather screen passes no conditions to its sound and haptics hooks while another tab is showing, so ambient sound fades out there and back in on return.

## Preferences (opening screen)

The Preferences tab picks which tab the app opens to: Weather from the morning time (AM, default 9:00 AM) until the evening time (PM, default 7:00 PM), Alarms otherwise. The rule is the pure `getStartTab(now, morning, evening)` in `src/features/preferences/opening-time.ts`. `src/app/index.tsx` redirects to the right tab on cold launch (before any tab mounts, so a night launch never starts the weather sound), and `useStartTabOnReturn` in the tab layout does the same after 5+ minutes in the background. Saved in AsyncStorage under `openingPreferences`. Its name field (optional, up to 15 characters, saved in the same store) personalizes the Weather greeting ("Good morning, Jolie!"). Settings › Developer › "Simulate time" overrides the time for this logic and the Weather screen greeting (`getGreeting` in `src/services/greeting.ts`), while Developer mode is on. `src/features/preferences/` must not import weather or alarm code.
