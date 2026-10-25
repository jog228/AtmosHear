// Tests for bedside mode's dome math (src/features/alarms/dome-position.ts).
// Run: npm test (Node 23.6+ loads the .ts file directly).

import assert from 'node:assert/strict';
import { test } from 'node:test';

const { domeFraction, domePosition, dotPassed, inDomeSpan } = await import('../src/features/alarms/dome-position.ts');

// Times of day on one date, in ms.
const at = (hour, minute) => new Date(2026, 9, 25, hour, minute).getTime();
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);

test('daytime: sunrise 7:23 AM, sunset 6:06 PM, now 4:07 PM', () => {
  const { f, x, y } = domePosition(at(16, 7), at(7, 23), at(18, 6), 260, 270, 230);
  near(f, 0.815, 0.001, 'f');
  near(x, 452, 1, 'x');
  near(y, 144, 1, 'y');
});

test('the ends and the top', () => {
  const start = at(7, 0);
  const end = at(19, 0);
  assert.deepEqual(domePosition(start, start, end, 0, 100, 50), { f: 0, x: -50, y: 100 });
  const top = domePosition(at(13, 0), start, end, 0, 100, 50);
  near(top.x, 0, 1e-9, 'top x');
  near(top.y, 50, 1e-9, 'top y');
  const right = domePosition(end, start, end, 0, 100, 50);
  near(right.x, 50, 1e-9, 'right x');
  near(right.y, 100, 1e-9, 'right y');
});

test('clamped to the span', () => {
  assert.equal(domeFraction(at(6, 0), at(7, 0), at(19, 0)), 0);
  assert.equal(domeFraction(at(20, 0), at(7, 0), at(19, 0)), 1);
});

test('night written as times of day crosses midnight', () => {
  // Sunset 6:06 PM to sunrise 7:23 AM (same date, so the end is earlier).
  const f = domeFraction(at(23, 42), at(18, 6), at(7, 23));
  near(f, (5 * 60 + 36) / (13 * 60 + 17), 1e-9, 'f at 11:42 PM');
  assert.ok(inDomeSpan(at(23, 42), at(18, 6), at(7, 23)));
});

test('dots before now are passed', () => {
  // 40 dots, now at f = 0.5: dots 0-19 passed, 20 onward not.
  assert.equal(dotPassed(19, 40, 0.5), true);
  assert.equal(dotPassed(20, 40, 0.5), false);
});
