import Svg, { Circle, Line } from 'react-native-svg';

import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useTheme } from '@/hooks/use-theme';

import { clockSunShape, SUN_CENTER, SUN_VIEW } from './geometry';

type Props = {
  size: number;
  // An outline in the dot color with no amber face, e.g. for a
  // switched-off alarm. (Fading the amber turns it muddy on navy.)
  dimmed?: boolean;
} & (
  // The real time, updated every minute.
  | { live: true; hour?: never; minute?: never }
  // A fixed time: hour 0-23, minute 0-59.
  | { live?: false; hour: number; minute: number }
);

// The amber clock-face sun (design/frames/06_Weather_home.png). Decorative:
// whatever time it shows is also in text, so it's hidden from screen
// readers. Still, even with Reduce Motion off: only the hands move, once a
// minute.
export function ClockSun({ size, dimmed, ...time }: Props) {
  const { illustration } = useTheme();
  const now = new Date(useMinuteClock(!!time.live));
  const hour = time.live ? now.getHours() : time.hour;
  const minute = time.live ? now.getMinutes() : time.minute;
  const shape = clockSunShape(size, hour, minute);
  const c = SUN_CENTER;
  const face = dimmed ? 'none' : illustration.sunFace;
  const edge = dimmed ? illustration.dots : illustration.sun;
  const hands = dimmed ? illustration.dots : illustration.hands;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${SUN_VIEW} ${SUN_VIEW}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={c} cy={c} r={shape.r} fill={face} stroke={edge} strokeWidth={shape.edgeWidth} />
      {shape.ticks.map((tick, i) => (
        <Circle key={i} cx={tick.x} cy={tick.y} r={tick.r} fill={hands} />
      ))}
      <Line x1={c} y1={c} {...shape.hour} stroke={hands} strokeWidth={shape.handWidth} strokeLinecap="round" />
      <Line x1={c} y1={c} {...shape.minute} stroke={hands} strokeWidth={shape.handWidth} strokeLinecap="round" />
      <Circle cx={c} cy={c} r={shape.pin} fill={hands} />
    </Svg>
  );
}
