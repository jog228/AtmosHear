// Tests for which bedside palette shows (src/features/alarms/bedside-palette.ts).
// Run: npm test

import assert from 'node:assert/strict';
import { test } from 'node:test';

const { bedsideAppearanceOrAuto, guessDaytime, pickBedsidePalette } = await import(
  '../src/features/alarms/bedside-palette.ts'
);

const pick = (setting, appHighContrast, isDaytime) => pickBedsidePalette({ setting, appHighContrast, isDaytime });

test('the app-wide High contrast switch always wins', () => {
  for (const setting of ['auto', 'light', 'dark']) {
    for (const isDaytime of [true, false]) {
      assert.equal(pick(setting, true, isDaytime), 'highContrast', `${setting}, ${isDaytime ? 'day' : 'night'}`);
    }
  }
});

test('Light and Dark stay put day and night', () => {
  assert.equal(pick('light', false, true), 'light');
  assert.equal(pick('light', false, false), 'light');
  assert.equal(pick('dark', false, true), 'dark');
  assert.equal(pick('dark', false, false), 'dark');
});

test('Auto is light from sunrise and dark from sunset', () => {
  assert.equal(pick('auto', false, true), 'light');
  assert.equal(pick('auto', false, false), 'dark');
});

test('a saved "highContrast" (from before it was removed), or anything unknown, loads as Auto', () => {
  assert.equal(bedsideAppearanceOrAuto('highContrast'), 'auto');
  assert.equal(bedsideAppearanceOrAuto('sepia'), 'auto');
  assert.equal(bedsideAppearanceOrAuto(null), 'auto');
  assert.equal(bedsideAppearanceOrAuto('light'), 'light');
  assert.equal(bedsideAppearanceOrAuto('dark'), 'dark');
});

test('without sun times, 7 AM to 7 PM counts as daytime', () => {
  const at = (hour, minute = 0) => new Date(2026, 9, 25, hour, minute);
  assert.equal(guessDaytime(at(6, 59)), false);
  assert.equal(guessDaytime(at(7)), true);
  assert.equal(guessDaytime(at(18, 59)), true);
  assert.equal(guessDaytime(at(19)), false);
});
