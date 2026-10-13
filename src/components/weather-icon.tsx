import { SymbolView } from 'expo-symbols';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { useConditionColors } from '@/hooks/use-theme';

type Props = {
  condition: ConditionId;
  isDay?: boolean;
  size: number;
};

// Decorative: the condition name is always shown or spoken next to it.
export function WeatherIcon({ condition, isDay = true, size }: Props) {
  const profile = conditionProfiles[condition];
  const { primary, secondary } = useConditionColors(condition);
  const name = !isDay && profile.nightIcon ? profile.nightIcon : profile.icon;

  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={primary}
      // Two-color icons on iOS: the cloud layer comes first, then the sun/moon.
      type={secondary ? 'palette' : 'monochrome'}
      colors={secondary ? [secondary, primary] : undefined}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
