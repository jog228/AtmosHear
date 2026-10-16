---
name: add-condition-sound
description: Add or replace a weather condition's ambient sound file in AtmosHear (assets/sounds/*.m4a, condition-profiles.ts), including loudness matching and soundVolume corrections.
---

# Adding a condition sound

Every sound follows one pattern, so adding one is a one-line change:

1. Put the file at `assets/sounds/<condition-id>.m4a`, named exactly after the condition ID in `src/constants/conditions.ts` (e.g. `heavy-rain.m4a`, `partly-cloudy.m4a`, `severe-alert.m4a`).
2. In `src/constants/condition-profiles.ts`, replace that condition's `// TODO: awaiting sound from teammate.` and `sound: null` with `sound: require('../../assets/sounds/<condition-id>.m4a'),`. It must be a static `require()` so Expo bundles it.

File requirements: a short loop (about 4 seconds) with fades at both ends so the loop point doesn't click, loudness-matched to `clear.m4a` (about -27 LUFS integrated). If a file comes in louder, either ask for a re-export or add `soundVolume` (0-1) to that profile as a correction: `10 ** (-differenceInLU / 20)`. `sleet.m4a` currently uses `soundVolume: 0.48` because it measures 6.3 LU louder. `heavy-rain.m4a` uses `soundVolume: 0.7` to sit between clear and thunderstorm (the file measures -21.1 LUFS). Some files are intentionally softer: `snow.m4a` (-28.3 LUFS) is meant to feel hushed, so don't normalize it up. `light-rain.m4a` (-33.5 LUFS) is intentionally a step softer than heavy rain, so don't normalize it either. `overcast.m4a` (-29.1 LUFS) is an intentionally soft hum; don't normalize it up. `wind.m4a` (-30.4 LUFS) is a gusty recording that plays uncorrected. `extreme-cold.m4a` (-28.0 LUFS) is a rhythmic ice crack once per second, so it must stay exactly 4.000 seconds (expo-audio loops without a gap). Some are intentionally louder: `thunderstorm.m4a` (-21.2 LUFS) is meant to feel intense, so don't normalize it down.

After changing a sound, update that profile's `soundDescription` so the cue screens describe what actually plays.
