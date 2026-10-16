import { useState } from 'react';
import type { TextLayoutEvent, TextStyle } from 'react-native';

type Trim = { top: number; bottom: number };

// Text boxes include empty space above capital letters and below the
// baseline, which makes big numbers look like they float. This measures the
// rendered font and returns negative margins that trim the box to the top
// of the capitals and to the baseline, so other text can line up with them.
// Works for any font and text size. Use with a style that has no lineHeight
// (the font's natural one), so the measurements match the box.
export function useTextTrim({ top = true, bottom = true }: { top?: boolean; bottom?: boolean } = {}) {
  const [trim, setTrim] = useState<Trim>({ top: 0, bottom: 0 });

  const onTextLayout = (event: TextLayoutEvent) => {
    const { lines } = event.nativeEvent;
    const first = lines[0];
    const last = lines[lines.length - 1];
    // Not every platform reports font metrics (e.g. web).
    if (!first?.ascender || !last?.ascender) return;
    const next = {
      top: top ? Math.max(0, Math.abs(first.ascender) - first.capHeight) : 0,
      bottom: bottom ? Math.max(0, last.height - Math.abs(last.ascender)) : 0,
    };
    // Trimming doesn't change the text's layout, so this settles at once.
    if (Math.abs(next.top - trim.top) > 0.5 || Math.abs(next.bottom - trim.bottom) > 0.5) setTrim(next);
  };

  const style: TextStyle = { marginTop: -trim.top, marginBottom: -trim.bottom };
  return { style, onTextLayout };
}
