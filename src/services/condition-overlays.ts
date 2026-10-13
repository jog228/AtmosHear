import type { ConditionId } from '@/constants/conditions';

// Thresholds for conditions that come from numbers rather than the forecast
// description. Easy to tune.
const WINDY_MPH = 20;
const EXTREME_HEAT_FEELS_LIKE_F = 100;
const EXTREME_COLD_FEELS_LIKE_F = 0;

// Adds wind / extreme heat / extreme cold on top of the sky or precipitation
// condition, so e.g. light rain at 25 mph becomes ['light-rain', 'wind'].
export function addOverlays(
  conditions: ConditionId[],
  { windSpeed, feelsLike }: { windSpeed: number; feelsLike: number },
): ConditionId[] {
  const result = [...conditions];
  const add = (id: ConditionId) => {
    if (!result.includes(id)) result.push(id);
  };

  if (windSpeed >= WINDY_MPH) add('wind');
  if (feelsLike >= EXTREME_HEAT_FEELS_LIKE_F) add('extreme-heat');
  if (feelsLike <= EXTREME_COLD_FEELS_LIKE_F) add('extreme-cold');
  return result;
}
