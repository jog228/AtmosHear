@AGENTS.md

# Project context

**AtmosHear** — Weather you can hear and feel.

Always write the name as "AtmosHear" (capital A, capital H). The slug, scheme, and package name stay `immersive-weather` / `immersiveweather` so the Expo project link doesn't break.

Multi-sensory weather app for a DES 156 class project, due 10/29/2026. This is the author's first mobile app: build in small steps and briefly explain each one.

## Concept

Each weather condition has its own sound, vibration pattern, and color so users can understand the forecast without looking at the screen. Accessibility for vision-impaired users is the core goal. A teammate is sourcing sounds and another is finalizing visual style, so keep sounds and colors easy to swap.

## Stack

- Expo + TypeScript + Expo Router (routes in `src/app`).
- Weather: Open-Meteo first, then the NWS API as backup, then the last saved forecast, then demo data (`src/services/weather.ts`). Every provider in `src/services/providers/` returns the shared `WeatherData` type (`src/services/weather-data.ts`); the rest of the app only uses that type. NWS requests must send a User-Agent header. Severe alerts from the NWS API later.
- `expo-location`, `expo-audio`, `@react-native-async-storage/async-storage`.
- Custom haptics come later via `react-native-haptic-feedback`, which needs a dev build. Until then, everything must run in Expo Go.

## Conditions

clear, partly cloudy, overcast, light rain, heavy rain, thunderstorm, snow, sleet, fog, wind, extreme heat, extreme cold, severe alert.

Conditions can overlap (e.g. rain + wind). A single condition profile file maps each condition to its sound file, haptic pattern, color, and light animation.

## Must-haves

- Live weather by location with a Bethlehem, PA fallback.
- Demo mode to force any condition.
- Sound-only / vibration-only / light-only modes.
- High-contrast theme.

## Design direction

Use `design/reference.png` for layout and mood, not as an exact copy:

- Pale blue-gray background, white rounded cards with soft shadows.
- Centered header with location subtitle.
- Large condition illustration, condition name, large temperature.
- A row of detail cards and a horizontal hourly forecast.
- All text must meet WCAG AA contrast (4.5:1).
- Light, dark, and high-contrast themes live in `src/constants/theme.ts`. Components only use token names, never hex codes. Dark follows the phone's setting unless overridden in Settings; high contrast overrides both. In dark mode, royalBlue is a fill only, never text.
- The accent color comes from the current condition, defined in one theme file.

## Code organization

Keep files small: screens in `src/app/`, UI in `src/components/`, API calls and data logic in `src/services/`, static mappings and theme in `src/constants/`.
