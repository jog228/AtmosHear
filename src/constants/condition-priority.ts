import type { ConditionId } from './conditions';

// When conditions overlap (e.g. rain + wind), the one listed first here is
// the most significant: its icon is shown and its name comes first.
// Reorder this list to change which condition wins.
export const CONDITION_PRIORITY: ConditionId[] = [
  'severe-alert',
  // Above thunderstorm, so thunderstorm + hail shows the hail icon.
  'hail',
  'thunderstorm',
  'heavy-rain',
  'snow',
  'sleet',
  'extreme-heat',
  'extreme-cold',
  'light-rain',
  'fog',
  'wind',
  'overcast',
  'partly-cloudy',
  'clear',
];

// Most significant first: ['wind', 'light-rain'] -> ['light-rain', 'wind'].
export function sortByPriority(ids: ConditionId[]): ConditionId[] {
  return [...ids].sort((a, b) => CONDITION_PRIORITY.indexOf(a) - CONDITION_PRIORITY.indexOf(b));
}

export function mostSignificant(ids: ConditionId[]): ConditionId {
  return sortByPriority(ids)[0] ?? 'overcast';
}
