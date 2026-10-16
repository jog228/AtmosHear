import { cueColors, type CueColor } from './theme';

// WCAG 2.x contrast ratio between two 6-digit hex colors, from 1 (same)
// to 21 (black on white). AA needs 4.5 for text, 3 for large text and icons.
export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export type ContrastPair = { fg: CueColor; bg: CueColor };

// "Amber on navy", its colors, and the ratio, computed (never typed in).
export function describeContrastPair({ fg, bg }: ContrastPair) {
  const ratio = contrastRatio(cueColors[fg], cueColors[bg]);
  return {
    fg: cueColors[fg],
    bg: cueColors[bg],
    ratio,
    // One decimal, rounded down, so 4.49 never shows as passing "4.5".
    ratioText: `${(Math.floor(ratio * 10) / 10).toFixed(1)} : 1`,
    spokenRatio: `${(Math.floor(ratio * 10) / 10).toFixed(1)} to 1`,
    label: `${colorName(fg)} on ${colorName(bg).toLowerCase()}`,
  };
}

// 'iceBlue' -> "Ice blue".
export function colorName(color: CueColor): string {
  const words = color.replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
