// The severe weather alert: a one-off attention signal, separate from the
// looping condition sounds in condition-profiles.ts. Swap the file here.

// About 2 seconds: a warning beep, then a short pause. Must be a static
// require() so Expo bundles the file.
export const ALERT_SOUND = require('../../assets/sounds/severe-alert.m4a');

// How many times it plays back to back for each new alert.
export const ALERT_REPEATS = 3;

// Ambient condition sounds drop to this share of their level (0-1) while
// the alert plays.
export const ALERT_DUCK_VOLUME = 0.2;
