import { SymbolView } from 'expo-symbols';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';

type Props = {
  condition: ConditionId;
  isDay?: boolean;
  size: number;
  color: string;
};

// Decorative: the condition name is always shown or spoken next to it.
export function WeatherIcon({ condition, isDay = true, size, color }: Props) {
  const profile = conditionProfiles[condition];
  const name = !isDay && profile.nightIcon ? profile.nightIcon : profile.icon;

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      type="monochrome"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
