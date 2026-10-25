// Which bedside palette shows. Plain logic (no imports), tested in
// scripts/bedside-palette.test.mjs.

export type BedsidePaletteName = 'light' | 'dark' | 'highContrast';

// The Preferences › Appearance › Bedside mode setting, in the order the
// control shows them. High contrast isn't one of them: it comes only from
// the app-wide Accessibility switch.
export type BedsideAppearance = 'auto' | 'system' | 'light' | 'dark';
export const BEDSIDE_APPEARANCES: BedsideAppearance[] = ['auto', 'system', 'light', 'dark'];

// A saved value as a setting: anything else (including 'highContrast',
// saved before it was removed) is Auto.
export function bedsideAppearanceOrAuto(value: unknown): BedsideAppearance {
  return typeof value === 'string' && (BEDSIDE_APPEARANCES as string[]).includes(value) ? (value as BedsideAppearance) : 'auto';
}

// The app-wide High contrast switch always wins. Light and Dark stay put
// day and night. System follows the phone's light or dark mode. Auto is
// light from sunrise until sunset and dark from sunset until the next
// sunrise, so it never glows next to someone sleeping.
export function pickBedsidePalette({
  setting,
  appHighContrast,
  isDaytime,
  systemDark,
}: {
  setting: BedsideAppearance;
  appHighContrast: boolean;
  isDaytime: boolean;
  // The phone is in dark mode (useColorScheme).
  systemDark: boolean;
}): BedsidePaletteName {
  if (appHighContrast) return 'highContrast';
  if (setting === 'light' || setting === 'dark') return setting;
  if (setting === 'system') return systemDark ? 'dark' : 'light';
  return isDaytime ? 'light' : 'dark';
}

// Without sun times (no weather on hand), a plain guess: 7 AM to 7 PM.
export function guessDaytime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 7 && hour < 19;
}
