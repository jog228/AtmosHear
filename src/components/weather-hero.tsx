import { useEffect, useMemo } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';

import { mostSignificant } from '@/constants/condition-priority';
import type { ConditionId } from '@/constants/conditions';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { useTheme } from '@/hooks/use-theme';

import { buildHeroScene, HAND_STROKE, HERO_VIEW, HOUR_HAND, MINUTE_HAND, type Mark, type SunStyle } from './hero/scene';

type Props = {
  conditions: ConditionId[];
  size: number;
  // False while another tab is showing: stops the clock and the breathing.
  visible: boolean;
};

const BREATHE_MS = 3200;
const BREATHE_SCALE = 1.04;

// The Weather screen illustration: a halftone dot field around an amber
// clock-face sun whose hands show the real time. The weather is the field's
// pattern and color (rain streaks, snowflakes, fog bands, storm rings...),
// built in src/components/hero/scene.ts after design/frames/. Decorative:
// the condition name and temperature are shown as text. The whole group
// breathes slowly (never single dots), and holds still with Reduce Motion.
export function WeatherHero({ conditions, size, visible }: Props) {
  const theme = useTheme();
  const condition = mostSignificant(conditions);
  const scene = useMemo(
    () => buildHeroScene(condition, theme.illustration, theme.colors.background),
    [condition, theme],
  );

  const now = new Date(useMinuteClock(visible));
  const minutes = now.getMinutes();
  const hours = (now.getHours() % 12) + minutes / 60;

  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion || !visible) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(
      withTiming(BREATHE_SCALE, { duration: BREATHE_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(scale);
  }, [scale, reduceMotion, visible]);
  const breathe = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, breathe]} pointerEvents="none">
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${HERO_VIEW} ${HERO_VIEW}`}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Marks marks={scene.back} />
        <ClockSun sun={scene.sun} hours={hours} minutes={minutes} />
        <Marks marks={scene.front} />
      </Svg>
    </Animated.View>
  );
}

// Keep in step with drawScene in scripts/render-hero-sheet.mjs.
function Marks({ marks }: { marks: Mark[] }) {
  return (
    <G>
      {marks.map((mark, i) =>
        mark.kind === 'dot' ? (
          <Circle
            key={i}
            cx={mark.x}
            cy={mark.y}
            r={mark.r}
            fill={mark.color}
            stroke={mark.stroke}
            strokeWidth={mark.stroke ? 1.2 : undefined}
            opacity={mark.opacity}
          />
        ) : (
          <Rect
            key={i}
            x={mark.x - mark.w / 2}
            y={mark.y - mark.h / 2}
            width={mark.w}
            height={mark.h}
            rx={Math.min(mark.w, mark.h) / 2}
            fill={mark.color}
            opacity={mark.opacity}
          />
        ),
      )}
    </G>
  );
}

// Tick and hand sizes are drawn for a 38-wide sun and scale with it.
function ClockSun({ sun, hours, minutes }: { sun: SunStyle; hours: number; minutes: number }) {
  const { x, y, r } = sun;
  const k = r / 38;
  const hand = (turns: number, length: number) => {
    const angle = turns * 2 * Math.PI - Math.PI / 2;
    return { x2: x + length * Math.cos(angle), y2: y + length * Math.sin(angle) };
  };

  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={sun.face} />
      <Circle cx={x} cy={y} r={r} fill="none" stroke={sun.edge} strokeWidth={4 * k} opacity={sun.edgeOpacity} />
      {/* Tick dots, bigger at 12, 3, 6, and 9. */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 2 * Math.PI;
        return (
          <Circle
            key={i}
            cx={x + 30 * k * Math.cos(angle)}
            cy={y + 30 * k * Math.sin(angle)}
            r={(i % 3 === 0 ? 2 : 1.2) * k}
            fill={sun.ticks}
            opacity={sun.tickOpacity}
          />
        );
      })}
      <Line x1={x} y1={y} {...hand(hours / 12, r * HOUR_HAND)} stroke={sun.hands} strokeWidth={r * HAND_STROKE} strokeLinecap="round" />
      <Line x1={x} y1={y} {...hand(minutes / 60, r * MINUTE_HAND)} stroke={sun.hands} strokeWidth={r * HAND_STROKE} strokeLinecap="round" />
      <Circle cx={x} cy={y} r={3.5 * k} fill={sun.hands} />
    </G>
  );
}
