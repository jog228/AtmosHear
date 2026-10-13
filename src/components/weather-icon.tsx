import { Image } from 'expo-image';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';

type Props = {
  conditions: ConditionId[];
  size: number;
};

// Shows the most significant condition's icon. Decorative: the condition
// name is always shown as text next to it.
export function WeatherIcon({ conditions, size }: Props) {
  const { icon } = conditionProfiles[mostSignificant(conditions)];

  return (
    <Image
      source={icon}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
