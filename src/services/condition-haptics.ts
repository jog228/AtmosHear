import { sortByPriority } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import type { HapticPattern } from '@/constants/haptics';

// The patterns for a set of conditions: the most significant one's (same
// order as the icon), then the next one's. ['wind', 'light-rain'] -> light
// rain, then wind.
export function conditionPatterns(ids: ConditionId[]): HapticPattern[] {
  return sortByPriority(ids)
    .slice(0, 2)
    .map((id) => conditionProfiles[id].haptic);
}
