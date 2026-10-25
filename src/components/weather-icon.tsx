import { mostSignificant } from '@/constants/condition-priority';
import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { useTheme } from '@/hooks/use-theme';

// The size for condition icons in lists (hourly, daily, the Sound library,
// the test weather list), so they look the same everywhere.
export const CONDITION_ICON_SIZE = 32;

type Props = {
  id: ConditionId;
  // Defaults to CONDITION_ICON_SIZE.
  size?: number;
  // Defaults to the theme accent (deepBlue in light mode); a screen with
  // its own palette (bedside mode) passes its color.
  color?: string;
};

// The only way to draw a condition's dotted icon (the Weather hero and the
// cue screens' PNGs aside): its profile's icon, from the dots in
// src/components/icons/condition-shapes.ts. The shape is always the same;
// only the size and color change. Decorative: the condition name is always
// shown as text next to it (DotIcon hides itself from screen readers).
export function ConditionIcon({ id, size = CONDITION_ICON_SIZE, color }: Props) {
  const theme = useTheme();
  const Icon = conditionProfiles[id].icon;
  return <Icon size={size} color={color ?? theme.colors.accent} />;
}

// The most significant condition's icon, for weather with several (e.g.
// light rain + wind shows light rain), like the test weather combinations.
export function WeatherIcon({ conditions, ...rest }: Omit<Props, 'id'> & { conditions: ConditionId[] }) {
  return <ConditionIcon id={mostSignificant(conditions)} {...rest} />;
}
