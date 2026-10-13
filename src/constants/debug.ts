import type { ConditionId } from './conditions';

// Development-only switches for testing. Change one and reload the app
// (press "r" in the terminal running Expo). They have no effect in a
// production build.

// Pretend a weather source is down, to test the fallback chain.
export const simulateOutage = {
  openMeteo: false,
  nws: false,
};

// Skip live weather and show demo data with these current conditions.
// The default shows the severe alert icon on top and the other 12
// conditions in the hourly row, so all 13 icons are on one screen.
export const forceDemo = false;
export const demoConditions: ConditionId[] = ['severe-alert'];
