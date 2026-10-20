import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';

import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';

import { useBreathing } from './brand';

type Props = {
  conditions: ConditionId[];
  size: number;
  // False while another tab is showing: stops the breathing.
  visible: boolean;
};

// The Weather screen illustration: the most significant condition's PNG
// (`image` in the condition profiles), breathing slowly, and holding still
// with Reduce Motion. Decorative: the condition name and temperature are
// shown as text.
export function WeatherHero({ conditions, size, visible }: Props) {
  const breathe = useBreathing(visible);
  return (
    <Animated.View style={[{ width: size, height: size }, breathe]} pointerEvents="none">
      <ConditionImage condition={mostSignificant(conditions)} size={size} />
    </Animated.View>
  );
}

// One condition's PNG, hidden from screen readers.
export function ConditionImage({ condition, size }: { condition: ConditionId; size: number }) {
  return (
    <Image
      source={conditionProfiles[condition].image}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
