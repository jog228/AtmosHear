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
- Vibration uses `expo-haptics` (works in Expo Go). Some patterns move to Core Haptics (AHAP) later in a dev build; until then, everything must run in Expo Go.

## Conditions

clear, partly cloudy, overcast, light rain, heavy rain, thunderstorm, snow, sleet, fog, wind, extreme heat, extreme cold, severe alert.

Conditions can overlap (e.g. rain + wind). A single condition profile file maps each condition to its sound file, haptic pattern, color, icon, and light animation.

## Condition sounds

To add or replace a sound file, use the `add-condition-sound` skill (`.claude/skills/add-condition-sound/SKILL.md`): file naming, the one-line profile change, and per-file loudness rules (several files are intentionally softer or louder and must not be normalized).

Playback (looping, crossfades, layering overlapping conditions, background pause, VoiceOver ducking, the Preferences toggle and the home screen mute button, which share one `ambientSound` setting) is handled by `src/services/ambient-sound.ts` for every condition; nothing else needs to change. When conditions overlap, every one with a sound plays as its own layer, each at `1/√layers` volume (about 71% for two) so the mix isn't louder than one sound; conditions without a file are skipped. Background sounds set `supportingVolume` in their profile to sit under other sounds (overcast: 60%; wind: 50%, or 30% under snow and 25% under light rain via `supportingVolumeWith`) and play at full level when they're the only sound.

## Vibration

Each condition's `haptic` field in `src/constants/condition-profiles.ts` is a pattern of timed taps (`{ at, style }`, helpers in `src/constants/haptics.ts`); patterns differ mainly by rhythm. `src/services/haptics.ts` plays them (one sequence at a time, never looped, a no-op on web), and `src/hooks/use-condition-haptics.ts` decides when: once when weather loads, when the conditions change, and when the weather icon is tapped. Combinations play the most significant pattern, then the next after 400 ms. The Preferences "Vibration" toggle turns condition patterns off; the severe alert pattern plays with each alert beep regardless, and a condition pattern can't interrupt it.

## Severe alert sound

Alerts are separate from the ambient condition sounds. `assets/sounds/severe-alert.m4a` (a beep plus a short pause, set in `src/constants/alert-sound.ts` with the repeat count and duck level) plays 3 times back to back at full volume when a new alert appears or the app opens with one, while the ambient sounds duck to 20%. Then the conditions underneath keep playing; `severe-alert` itself has no ambient loop. It ignores the "Ambient sound" toggle and VoiceOver ducking, beeps once per alert ID per session, and announces "Severe weather alert: <name>" after the beeps. Tapping the weather icon during an alert replays it. Logic: `src/services/alert-sound.ts` and `src/hooks/use-alert-sound.ts`. Alerts come in as `WeatherData.alert` (`{ id, name }`); only test weather sets it until NWS alert fetching is built. When it is, the alert ID must stay stable across refreshes, and think about whether a saved (cached) forecast should keep its alert.

## Cue screens

Three root-stack screens show and preview each condition's cues: Feel & hear (`src/app/feel-and-hear.tsx`, the current most significant condition, opened from the Feel & hear square button at the top of the Weather screen), the Sound library (`src/app/sounds.tsx`, all 13), and condition detail (`src/app/condition/[id].tsx`, from a library row). The copy comes from each profile's `soundDescription`, `vibrationDescription`, `vibrationDetail`, and `lightDescription`, which must describe what actually plays: update them when a sound file or haptic pattern changes. Each profile's `contrastPair` names two `cueColors` (`src/constants/theme.ts`); the ratio is computed by `contrastRatio` (`src/constants/contrast.ts`), never typed in. A development check logs any pair under 4.5:1 or any light cue over the flash limit.

- Light cues (`light` in each profile, helpers in `src/constants/light-cues.ts`) play as a full-screen color overlay (`src/components/light-overlay.tsx`, mounted in the root layout) that never takes taps or VoiceOver focus. Never more than 3 flashes per second (WCAG 2.3.1): `safeLightCue` swaps an unsafe cue, or any cue when Reduce Motion is on, for a gentle fade.
- Previews (`src/services/cue-preview.ts`, `useCuePreview`) play sound, vibration, and light together, one condition at a time, for at least 8 seconds. Sound goes through `ambientSound.setPreview`, which pauses the Weather loop and crossfades back after; previews play even with "Ambient sound" off. Vibration follows the Vibration setting (the rows say when it's off), also for the severe alert preview, whose beeps come from `alertSound`. Previews stop when their screen closes or the app goes to the background.

## Must-haves

- Live weather by location with a Bethlehem, PA fallback.
- Demo mode to force any condition.
- Sound-only / vibration-only / light-only modes.
- High-contrast theme.
- °F / °C setting (Preferences › Temperature: Auto, °F, °C). Auto (default) uses the usual unit in the country of the last live location (`src/constants/temperature-units.ts`, country saved as `locationCountry`), or the phone region's before the first one. Weather data stays in °F; components convert for display with `useTemperature()`.

## Developer mode

Preferences › Developer replaces live weather with filler data for testing and presenting (no API calls), or forces one live provider (Open-Meteo or NWS, no fallback). All filler values and the list of test conditions and combinations live in `src/constants/test-weather.ts`; `src/services/providers/demo.ts` turns them into a 12-hour forecast. The same filler is the last-resort fallback when no live or saved weather exists. A "Developer mode" pill always shows on the home screen while it's on. The "Severe alert" test weather comes with a test alert over thunderstorm + heavy rain, beeping each time it's picked; "Replay alert" in the Developer section plays the beeps on demand.

## Design direction

The teammate's frames in `design/frames/` (06 Weather home through 12 Preferences) are the source of truth for layout and style:

- Flat white cards on a pale blue background (`palette.mist`, #EDF5FD); solid navyCard cards in dark. No glass and no blobs in any theme (`glass: null`; the Glass code is kept, unused).
- Big, bold, left-aligned headlines. Text sizes come from the `typography` tokens in `src/constants/theme.ts` (display, h1, h2, title, body, caption); every token uses `FONT_FAMILY`, so the design font is a one-line swap. Dynamic Type stays on; display and h1 cap their growth with `LARGE_TEXT_MAX_SCALE`.
- Navy primary buttons with white bold labels, plus a right arrow when the button advances a flow.
- Amber (`sun`) as the highlight color.
- Dotted, halftone illustrations and icons, drawn with `react-native-svg` from circles only, in one color. Condition icons (one per condition, set as `icon` in the condition profiles) and the detail/sun card icons live in `src/components/icons/`; small icons use the `accent` token. Illustration colors are `theme.illustration` (dots, sun, sunFace, hands, cloud). The old PNGs in `assets/icons/weather-icons/` are unused but kept until the team confirms.
- The Weather hero (`src/components/weather-hero.tsx`, scenes in `src/components/hero/scene.ts`): a dot field around an amber clock-face sun showing the real time. The weather is the field's pattern and color, never glyphs stacked on top: radial amber burst (clear, extreme heat), streaks under the cloud (rain), soft round flakes (snow), streaks and pellets (sleet), faint bands (fog), oval dashes (wind), tight dark-centered rings with a dotted amber bolt (thunderstorm), a six-point crystal (extreme cold), alternating dark and light rings on amber (severe alert), and a dimmed sun outline behind clouds (overcast). The cloud is about 55% of the field's width, lower left, with no outline, and never covers the clock hands. Field marks of different colors never touch (no navy dots on periwinkle). Colors are `theme.illustration` tokens. After changing a scene, run `node scripts/render-hero-sheet.mjs`: it fails on covered hands or touching colors, and redraws the contact sheet `design/previews/hero-variants.png`. The whole group breathes slowly (never single dots) and holds still with Reduce Motion. Tapping it replays the sound and vibration.
- Weather screen: location top left with Feel & hear (white, dotted `FeelAndHearIcon`, label "Feel and hear") and the quick mute (deepBlue) as 56pt rounded square buttons (`SquareButton`) top right; there is no Settings button; the greeting as the headline; the hero right under it; condition name and big temperature left-aligned with today's High/Low on the right, on the number's baseline (`useTextTrim`). Then the sun card with a dotted arc and a sun marker at the current time, and the hourly and 3-day forecasts with their headlines above the cards (`WeatherData.daily`: today and the next two days; NWS builds it by grouping its hourly forecast by day).
- Tabs stay native (`NativeTabs`), tinted deepBlue in light mode; no custom tab bar.
- All text must meet WCAG AA contrast (4.5:1).
- Light, dark, and high-contrast themes live in `src/constants/theme.ts`. Components only use token names, never hex codes. Dark follows the phone's setting unless overridden in Preferences; high contrast overrides both. In dark mode, royalBlue is a fill only, never text.
- The accent color comes from the current condition, defined in one theme file.

## Code organization

Keep files small: screens in `src/app/`, UI in `src/components/`, API calls and data logic in `src/services/`, static mappings and theme in `src/constants/`.

## Alarms

The app has three native tabs (`src/app/(tabs)/`): Weather (`weather.tsx`), Alarms (`alarms.tsx`), and Preferences (`preferences.tsx`). The cue screens and the test-weather sheet stay on the root stack above the tabs; there is no separate Settings screen. The Alarms tab is an Apple Clock-style alarm list; alarms don't ring yet (no notifications). All alarm code lives in `src/features/alarms/` and must not import weather code: it only uses the base palette (`palette`/`darkPalette` via `alarm-colors.ts`, no condition colors) and `useTheme`. Alarms are saved in AsyncStorage under `alarms.list`. The weather screen passes no conditions to its sound and haptics hooks while another tab is showing, so ambient sound fades out there and back in on return. A root-stack screen keeps the tab it was opened from (Feel & hear keeps the sound; the test-weather sheet, opened from Preferences, stays quiet).

## Preferences

The Preferences tab holds every setting, in this order: Name, Appearance, Opening screen, Temperature, Sound and vibration, Accessibility, Developer. `src/app/(tabs)/preferences.tsx` composes them: `PreferencesPage`, `NameSection`, and `OpeningScreenSection` come from `src/features/preferences/preferences-screen.tsx`; the weather-dependent sections come from `src/components/app-settings.tsx` and `src/components/developer-settings.tsx`. Rows (`src/components/settings-rows.tsx`, theme-only so the feature can use them) follow `design/frames/12_Preferences.png`: bare rows between thin lines, bold title with a subtitle, and a drawn toggle (`switch*` tokens).

The opening screen setting picks which tab the app opens to: Weather from the morning time (AM, default 9:00 AM) until the evening time (PM, default 7:00 PM), Alarms otherwise. The rule is the pure `getStartTab(now, morning, evening)` in `src/features/preferences/opening-time.ts`. `src/app/index.tsx` redirects to the right tab on cold launch (before any tab mounts, so a night launch never starts the weather sound), and `useStartTabOnReturn` in the tab layout does the same after 5+ minutes in the background. Saved in AsyncStorage under `openingPreferences`. Its name field (optional, up to 15 characters, saved in the same store) personalizes the Weather greeting ("Good morning, Jolie!"). Preferences › Developer › "Simulate time" overrides the time for this logic and the Weather screen greeting (`getGreeting` in `src/services/greeting.ts`), while Developer mode is on. `src/features/preferences/` must not import weather or alarm code.
