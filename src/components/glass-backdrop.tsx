import { BlurTargetView } from 'expo-blur';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewInstance, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { ConditionId } from '@/constants/conditions';
import { withAlpha } from '@/constants/theme';
import { useReduceTransparency } from '@/hooks/use-reduce-transparency';
import { useConditionColor, useTheme } from '@/hooks/use-theme';

type Backdrop = {
  // The view that glass cards blur (Android needs a ref to it).
  target: RefObject<ViewInstance | null>;
  // The condition behind the cards, so each card can pick its opacity.
  condition?: ConditionId;
};

const BackdropContext = createContext<Backdrop | null>(null);

export function useGlassBackdrop() {
  return useContext(BackdropContext);
}

type Props = {
  // Tints the blobs. Without it there are no blobs (e.g. on Preferences).
  condition?: ConditionId;
  // How far blobs may spread past the cards: sideways to the screen edges,
  // and up only under something opaque (never under page text).
  bleed?: { top: number; sides: number };
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

// Wraps glass cards. Draws soft condition-colored blobs behind them for the
// glass to pick up. Only cards go inside, never page text: the blobs are too
// strong for text to sit directly on them.
export function GlassBackdrop({ condition, bleed = { top: 0, sides: 0 }, style, children }: Props) {
  const target = useRef<ViewInstance | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <BackdropContext.Provider value={{ target, condition }}>
      {/* zIndex -1 keeps the blobs behind anything they spread under. */}
      <View style={[styles.container, style]} onLayout={onLayout}>
        <BlurTargetView
          ref={target}
          // Android clips blobs to this view, so it covers the full bleed area.
          style={[
            styles.target,
            { top: -bleed.top, bottom: -blobRadius(size.width), left: -bleed.sides, right: -bleed.sides },
          ]}
          pointerEvents="none"
        >
          {condition && size.width > 0 && <Blobs condition={condition} offset={bleed} {...size} />}
        </BlurTargetView>
        {children}
      </View>
    </BackdropContext.Provider>
  );
}

const FADE_MS = 900;
const DRIFT_MS = 24_000;
// How far the blobs drift each way, in points.
const DRIFT_X = 14;
const DRIFT_Y = 10;

type BlobsProps = {
  condition: ConditionId;
  width: number;
  height: number;
  // Where the cards' top-left corner is inside the blur target.
  offset: { top: number; sides: number };
};

function Blobs({ condition, width, height, offset }: BlobsProps) {
  const theme = useTheme();
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReducedMotion();
  const color = useConditionColor(condition);

  // Very slow drift of the whole layer (so blobs never move closer together).
  const drift = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    drift.value = withRepeat(withTiming(1, { duration: DRIFT_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift, reduceMotion]);
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (drift.value - 0.5) * DRIFT_X * 2 }, { translateY: (drift.value - 0.5) * DRIFT_Y * 2 }],
  }));

  if (!theme.glass || reduceTransparency) return null;

  // Each blob fades from the condition color at its center to transparent
  // at its edge.
  const glow = `radial-gradient(circle closest-side, ${withAlpha(color, theme.glass.blobOpacity)}, ${withAlpha(color, 0)})`;

  return (
    // Keyed by color: when the condition changes, old blobs fade out while
    // new ones fade in.
    <Animated.View key={color} entering={FadeIn.duration(FADE_MS)} exiting={FadeOut.duration(FADE_MS)} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
        {blobLayout(width, height).map((blob, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: offset.sides + blob.x - blob.r,
              top: offset.top + blob.y - blob.r,
              width: blob.r * 2,
              height: blob.r * 2,
              experimental_backgroundImage: glow,
            }}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

type Blob = { x: number; y: number; r: number };

// Capped so the blobs stay soft accents on the widest phones.
function blobRadius(width: number) {
  return Math.min(width * 0.42, 170);
}

// Up to three blobs, top-left, middle-right, and bottom-left, sitting
// partly behind the cards. Blob centers are always at least one radius
// apart, so overlapping edges never add up to more than `blobOpacity`
// (the readability checks in theme.ts rely on that).
export function blobLayout(width: number, height: number): Blob[] {
  const r = blobRadius(width);
  const candidates = [
    // Low enough that the blob (plus drift) never reaches above the cards,
    // where page text is.
    { x: width * 0.12, y: r + DRIFT_Y, r },
    { x: width * 0.88, y: height * 0.5, r },
    { x: width * 0.3, y: height - r * 0.3, r },
  ];
  const blobs: Blob[] = [];
  for (const blob of candidates) {
    if (blobs.every((other) => Math.hypot(blob.x - other.x, blob.y - other.y) >= r)) blobs.push(blob);
  }
  return blobs;
}

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
  },
  target: {
    position: 'absolute',
  },
});
