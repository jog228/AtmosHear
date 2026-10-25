// Tests for which bedside palette shows (src/features/alarms/bedside-palette.ts).
// Run: npm test

import assert from 'node:assert/strict';
import { test } from 'node:test';

const { BEDSIDE_APPEARANCES, bedsideAppearanceOrAuto, guessDaytime, pickBedsidePalette } = await import(
  '../src/features/alarms/bedside-palette.ts'
);

const pick = (setting, { appHighContrast = false, isDaytime = true, systemDark = false } = {}) =>
  pickBedsidePalette({ setting, appHighContrast, isDaytime, systemDark });

test('the control shows Auto, System, Light, Dark, in that order', () => {
  assert.deepEqual(BEDSIDE_APPEARANCES, ['auto', 'system', 'light', 'dark']);
});

test('the app-wide High contrast switch overrides all four', () => {
  for (const setting of BEDSIDE_APPEARANCES) {
    for (const isDaytime of [true, false]) {
      for (const systemDark of [true, false]) {
        assert.equal(pick(setting, { appHighContrast: true, isDaytime, systemDark }), 'highContrast', setting);
      }
    }
  }
});

test('System follows the phone, day or night', () => {
  for (const isDaytime of [true, false]) {
    assert.equal(pick('system', { isDaytime, systemDark: false }), 'light');
    assert.equal(pick('system', { isDaytime, systemDark: true }), 'dark');
  }
});

test('Light and Dark stay put, whatever the time or the phone', () => {
  for (const isDaytime of [true, false]) {
    for (const systemDark of [true, false]) {
      assert.equal(pick('light', { isDaytime, systemDark }), 'light');
      assert.equal(pick('dark', { isDaytime, systemDark }), 'dark');
    }
  }
});

test('Auto is light from sunrise and dark from sunset, whatever the phone', () => {
  for (const systemDark of [true, false]) {
    assert.equal(pick('auto', { isDaytime: true, systemDark }), 'light');
    assert.equal(pick('auto', { isDaytime: false, systemDark }), 'dark');
  }
});

test('saved values: each option loads as itself; "highContrast" or anything unknown loads as Auto', () => {
  for (const setting of BEDSIDE_APPEARANCES) assert.equal(bedsideAppearanceOrAuto(setting), setting);
  assert.equal(bedsideAppearanceOrAuto('highContrast'), 'auto');
  assert.equal(bedsideAppearanceOrAuto('sepia'), 'auto');
  assert.equal(bedsideAppearanceOrAuto(null), 'auto');
});

test('without sun times, 7 AM to 7 PM counts as daytime', () => {
  const at = (hour, minute = 0) => new Date(2026, 9, 25, hour, minute);
  assert.equal(guessDaytime(at(6, 59)), false);
  assert.equal(guessDaytime(at(7)), true);
  assert.equal(guessDaytime(at(18, 59)), true);
  assert.equal(guessDaytime(at(19)), false);
});
