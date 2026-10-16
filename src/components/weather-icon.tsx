import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  conditions: ConditionId[];
  size: number;
  // Defaults to the theme accent (deepBlue in light mode), like the frames.
  color?: string;
};

// Shows the most significant condition's dotted icon. Decorative: the
// condition name is always shown as text next to it (DotIcon hides itself
// from screen readers).
export function WeatherIcon({ conditions, size, color }: Props) {
  const theme = useTheme();
  const Icon = conditionProfiles[mostSignificant(conditions)].icon;
  return <Icon size={size} color={color ?? theme.colors.accent} />;
}
