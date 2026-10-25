import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { bedsidePalette, FONT_FAMILY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Onboarding's drawings, in the dotted brand style. Decorative: hidden from
// screen readers (the headline and body say the same).

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

// A phone on its side in bedside mode (Night screen), about 320x200: the
// dark screen, a dotted dome from sunset to sunrise with the amber sun
// marker, and the time. Always in bedside mode's dark colors. Its own
// simple copy: the real dome belongs to the alarm feature.
export function BedsideIllustration({ width = 320 }: { width?: number }) {
  const height = (width * 200) / 320;
  const c = bedsidePalette;
  const cx = 160;
  const cy = 156;
  const r = 104;
  const now = 0.68;
  const dots = Array.from({ length: 26 }, (_, i) => {
    const t = i / 25;
    const angle = Math.PI * (1 - t);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    const fill = t < now ? c.domePast : i >= 23 ? c.amber : c.domeAhead;
    return <Circle key={i} cx={x} cy={y} r={2 + 1.4 * t} fill={fill} />;
  });
  const sun = { x: cx + r * Math.cos(Math.PI * (1 - now)), y: cy - r * Math.sin(Math.PI * (1 - now)) };
  return (
    <Svg width={width} height={height} viewBox="0 0 320 200" {...hidden}>
      <Rect x={2} y={2} width={316} height={196} rx={30} fill={c.background} stroke={c.divider} strokeWidth={3} />
      {/* The camera, on the short side. */}
      <Circle cx={18} cy={100} r={4} fill={c.divider} />
      {dots}
      <Circle cx={sun.x} cy={sun.y} r={17} fill={c.background} />
      <Circle cx={sun.x} cy={sun.y} r={15} fill={c.amber} opacity={0.12} />
      <Circle cx={sun.x} cy={sun.y} r={11} fill={c.amber} opacity={0.22} />
      <Circle cx={sun.x} cy={sun.y} r={7} fill={c.amber} />
      <SvgText x={cx} y={128} fontFamily={FONT_FAMILY} fontSize={44} fontWeight="200" fill={c.mainText} textAnchor="middle">
        6:42
      </SvgText>
      <SvgText x={cx} y={150} fontFamily={FONT_FAMILY} fontSize={11} fill={c.mutedText} textAnchor="middle">
        38 min until sunrise
      </SvgText>
    </Svg>
  );
}

// The location pin (Location screen), 280pt: a pin in the accent color with
// an amber center, standing on two dotted periwinkle rings.
export function LocationPinIllustration({ size = 280 }: { size?: number }) {
  const { colors, illustration } = useTheme();
  const ring = (rx: number, ry: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return <Circle key={`${rx}-${i}`} cx={140 + rx * Math.cos(angle)} cy={228 + ry * Math.sin(angle)} r={2.6} fill={illustration.dots} />;
    });
  return (
    <Svg width={size} height={size} viewBox="0 0 280 280" {...hidden}>
      {ring(112, 28, 34)}
      {ring(70, 17, 22)}
      <Path
        d="M140 222 C 112 182, 78 150, 78 108 A 62 62 0 1 1 202 108 C 202 150, 168 182, 140 222 Z"
        fill={colors.accent}
      />
      <Circle cx={140} cy={106} r={24} fill={illustration.sun} />
    </Svg>
  );
}
