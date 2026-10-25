import type { ComponentType } from 'react';
import Svg, { Circle, G } from 'react-native-svg';

import type { Dot } from './shapes';

export type IconProps = {
  size: number;
  // One color for the whole icon; some dots are lighter through opacity.
  color: string;
};

export type DotIconComponent = ComponentType<IconProps>;

// The usual grid. An icon that reaches its edges (the All sounds ring)
// can pass a slightly larger one, so no dot is clipped.
const VIEW_BOX = '0 0 24 24';

// Draws a list of dots on a 24x24 grid. Decorative: hidden from screen
// readers, since the condition or label is always shown as text.
export function DotIcon({ dots, size, color, viewBox = VIEW_BOX }: IconProps & { dots: Dot[]; viewBox?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox={viewBox}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Opacity applies per group, not per dot, so overlapping dots (like
          a faded cloud) blend into one even shape. */}
      {groupByOpacity(dots).map((group, g) => (
        <G key={g} fill={color} opacity={group.opacity}>
          {group.dots.map(([cx, cy, r], i) => (
            <Circle key={i} cx={cx} cy={cy} r={r} />
          ))}
        </G>
      ))}
    </Svg>
  );
}

// Makes a named icon component from a fixed list of dots.
export function dotIcon(name: string, dots: Dot[], viewBox?: string): DotIconComponent {
  function Icon(props: IconProps) {
    return <DotIcon dots={dots} viewBox={viewBox} {...props} />;
  }
  Icon.displayName = name;
  return Icon;
}

// Splits dots into runs that share an opacity, in drawing order.
function groupByOpacity(dots: Dot[]): { opacity: number; dots: Dot[] }[] {
  const groups: { opacity: number; dots: Dot[] }[] = [];
  for (const dot of dots) {
    const opacity = dot[3] ?? 1;
    const last = groups[groups.length - 1];
    if (last && last.opacity === opacity) last.dots.push(dot);
    else groups.push({ opacity, dots: [dot] });
  }
  return groups;
}
