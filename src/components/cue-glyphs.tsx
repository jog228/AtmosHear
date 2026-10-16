import Svg, { Circle, Rect } from 'react-native-svg';

import { contrastRatio, type ContrastPair } from '@/constants/contrast';
import type { HapticPattern, HapticStyle } from '@/constants/haptics';
import type { LightCue } from '@/constants/light-cues';
import { cueColors, type Theme } from '@/constants/theme';

// Small decorative glyphs on the right of each cue row, after
// design/frames/08 and 10. Hidden from screen readers: each row reads its
// cue as text.

const WIDTH = 96;
const HEIGHT = 28;
const MID = HEIGHT / 2;

const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;

// A row of dots, biggest in the middle, like a sound wave.
export function SoundGlyph({ theme }: { theme: Theme }) {
  const radii = [1.6, 2.2, 3, 3.8, 3, 2.2, 1.6];
  const step = (WIDTH - 8) / (radii.length - 1);
  return (
    <Svg width={WIDTH} height={HEIGHT} {...hidden}>
      {radii.map((r, i) => (
        <Circle key={i} cx={4 + i * step} cy={MID} r={r} fill={theme.colors.accent} />
      ))}
    </Svg>
  );
}

// Taps closer together than this read as one buzz, drawn as a bar.
const BUZZ_GAP_MS = 75;
const TAP_RADIUS: Record<HapticStyle, number> = { soft: 3, light: 3.5, medium: 4.5, heavy: 5.5, rigid: 5 };

// The real vibration pattern on a timeline: a dot per tap (bigger for
// stronger taps) and a bar for a fast run of taps.
export function VibrationGlyph({ pattern, theme }: { pattern: HapticPattern; theme: Theme }) {
  const taps = [...pattern].sort((a, b) => a.at - b.at);
  const end = taps[taps.length - 1]?.at || 1;
  const pad = 6;
  const x = (at: number) => pad + ((WIDTH - pad * 2) * at) / end;

  // Group taps into runs.
  const runs: HapticPattern[] = [];
  for (const tap of taps) {
    const run = runs[runs.length - 1];
    if (run && tap.at - run[run.length - 1].at <= BUZZ_GAP_MS) run.push(tap);
    else runs.push([tap]);
  }

  return (
    <Svg width={WIDTH} height={HEIGHT} {...hidden}>
      {runs.map((run, i) => {
        const r = Math.max(...run.map((tap) => TAP_RADIUS[tap.style]));
        if (run.length === 1) return <Circle key={i} cx={x(run[0].at)} cy={MID} r={r} fill={theme.colors.accent} />;
        const left = x(run[0].at) - r;
        const right = x(run[run.length - 1].at) + r;
        return <Rect key={i} x={left} y={MID - r} width={right - left} height={r * 2} rx={r} fill={theme.colors.accent} />;
      })}
    </Svg>
  );
}

// One color: three dots growing, like a pulse. Two colors (e.g. a white
// flash, then dark): the second as a ring around the first.
export function LightGlyph({ cue, theme }: { cue: LightCue; theme: Theme }) {
  const colors = [...new Set(cue.filter((step) => step.opacity > 0).map((step) => cueColors[step.color]))];
  if (colors.length === 0) return null;
  if (colors.length === 1) {
    return (
      <Svg width={WIDTH} height={HEIGHT} {...hidden}>
        <Circle cx={WIDTH - 52} cy={MID} r={2.5} fill={colors[0]} {...edge(colors[0], theme)} />
        <Circle cx={WIDTH - 40} cy={MID} r={4.5} fill={colors[0]} {...edge(colors[0], theme)} />
        <Circle cx={WIDTH - 14} cy={MID} r={12} fill={colors[0]} {...edge(colors[0], theme)} />
      </Svg>
    );
  }
  return (
    <Svg width={WIDTH} height={HEIGHT} {...hidden}>
      <Circle cx={WIDTH - 14} cy={MID} r={12.5} fill={colors[1]} {...edge(colors[1], theme)} />
      <Circle cx={WIDTH - 14} cy={MID} r={5} fill={colors[0]} />
    </Svg>
  );
}

// The two colors as overlapping swatches: background left, text color right.
export function ContrastGlyph({ pair, theme }: { pair: ContrastPair; theme: Theme }) {
  const [fg, bg] = [cueColors[pair.fg], cueColors[pair.bg]];
  return (
    <Svg width={WIDTH} height={HEIGHT} {...hidden}>
      <Circle cx={WIDTH - 34} cy={MID} r={12.5} fill={bg} {...edge(bg, theme)} />
      <Circle cx={WIDTH - 14} cy={MID} r={12.5} fill={fg} {...edge(fg, theme)} />
    </Svg>
  );
}

// A thin edge in the text color for swatches that would fade into the page
// (under 3:1 against it), e.g. white or mist in light mode.
function edge(color: string, theme: Theme) {
  if (contrastRatio(color, theme.colors.background) >= 3) return {};
  return { stroke: theme.colors.textPrimary, strokeWidth: 1.5 };
}
