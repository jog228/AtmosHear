---
name: add-condition-sound
description: Add or replace a weather condition's ambient sound file in AtmosHear (assets/sounds/*.m4a, condition-profiles.ts), including loudness matching and soundVolume corrections.
---

# Adding a condition sound

Every sound follows one pattern, so adding one is a one-line change:

1. Put the file at `assets/sounds/<condition-id>.m4a`, named exactly after the condition ID in `src/constants/conditions.ts` (e.g. `heavy-rain.m4a`, `partly-cloudy.m4a`, `severe-alert.m4a`). A replacement for an existing file may use a `new-` prefix (`new-<condition-id>.m4a`, e.g. `new-sleet.m4a`) so the old file can stay next to it for comparison; nothing else about the name changes.
2. In `src/constants/condition-profiles.ts`, point that condition's `sound` at the file: `sound: require('../../assets/sounds/<file>.m4a'),` (replacing `// TODO: awaiting sound from teammate.` and `sound: null` for a new one). It must be a static `require()` so Expo bundles it.

File requirements: a loop with fades at both ends so the loop point doesn't click, loudness-matched to `new-clear.m4a` (-27.3 LUFS integrated). The `new-` files are 10-second loops; the older files are about 4 seconds. If a file comes in louder, either ask for a re-export or add `soundVolume` (0-1) to that profile as a correction: `10 ** (-differenceInLU / 20)`. None of the `new-` files need one: they were exported at their targets.

Current files and their loudness (don't normalize the intentionally softer or louder ones):

| Condition | File | LUFS | Notes |
|---|---|---|---|
| clear | `new-clear.m4a` | -27.3 | The reference. 10 s. |
| extreme-heat | `new-extreme-heat.m4a` | -27.3 | Matched to clear. 10 s. |
| sleet | `new-sleet.m4a` | -27.3 | Matched to clear. 10 s. |
| snow | `new-snow.m4a` | -28.3 | Intentionally a bit softer, to feel hushed. 10 s. |
| light-rain | `new-light-rain.m4a` | -33.5 | Intentionally a step softer than heavy rain. 10 s. |
| heavy-rain | `new-heavy-rain.m4a` | -24.3 | Between clear and thunderstorm. 10 s. |
| wind | `new-wind.m4a` | -30.4 | Gusty; plays uncorrected. A supporting layer (`supportingVolume`). 10 s. |
| overcast | `overcast.m4a` | -29.1 | An intentionally soft hum. |
| fog | `fog.m4a` | not recorded | |
| thunderstorm | `thunderstorm.m4a` | -21.2 | Intentionally louder, to feel intense. |
| extreme-cold | `extreme-cold.m4a` | -28.0 | A rhythmic ice crack once per second, so it must stay exactly 4.000 seconds (expo-audio loops without a gap). |

The old `clear`, `heavy-rain`, `light-rain`, `sleet`, `snow`, and `wind` files are kept, unused, for comparison (old sleet measured -21.0 and old heavy rain -21.1, which is why they once had `soundVolume` 0.48 and 0.7).

After changing a sound, update that profile's `soundDescription` so the cue screens describe what actually plays.
