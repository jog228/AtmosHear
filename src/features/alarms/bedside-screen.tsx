import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { FONT_FAMILY } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';

import { BEDSIDE_COLORS as COLORS } from './alarm-colors';
import { formatTime, repeatSummary, timeText } from './alarm-format';
import { nextRing } from './alarm-schedule';
import type { Alarm } from './alarm-types';
import { BedsideDome } from './bedside-dome';
import { bedsideLayout, sideInset, type BedsideLayout } from './bedside-layout';
import { enterLandscape, flipLandscape, lockPortrait } from './bedside-orientation';
import { useBedsideSlots } from './bedside-slots';
import { domePoint } from './dome-position';
import { useAlarms } from './use-alarms';

// Whether bedside mode is showing, for the Alarms tab's switch and the
// weather side (which only loads bedside weather while it's open).
let open = false;
const listeners = new Set<() => void>();
function setOpen(value: boolean) {
  open = value;
  listeners.forEach((listener) => listener());
}
export function useBedsideOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
  );
}

const MAX_ALARMS = 3;
// Bedside text grows with Dynamic Type only a little: landscape has no room.
const MAX_SCALE = 1.2;
// A touch target, so it doesn't scale down.
const FLIP_SIZE = 44;
const LABEL_WIDTH = 220;

// Bedside mode (route /bedside, from the Alarms tab), after
// design/frames/9 · Centered dome@2x.png: landscape either way up, dark and
// dim in every theme, and kept awake so alarms ring with sound. The clock
// sits in a dotted dome from sunset to sunrise (sunrise to sunset in the
// daytime), with the weather on the left and the next alarms on the right.
// Everything, the Flip button included, stays inside the safe area plus a
// margin and is scaled to fit it (bedside-layout.ts), so nothing is ever
// under the Dynamic Island, whichever way up. The weather and the sky come
// from slots the weather side fills (bedside-slots.tsx); without them it's
// the clock, a plain arc, and the alarms. Tap empty space to leave. An
// alarm rings on top, in landscape too, and comes back here.
//
// It's a fullScreenModal: a separate native screen over the app. The app's
// root SafeAreaProvider measures the screen underneath, which doesn't
// rotate with this one, so its insets can stay portrait (left and right 0).
// So this screen has its own provider, measured where it's drawn, and is
// sized from its own layout rather than the window.
export function BedsideScreen() {
  // The root provider's insets, only for the Developer readout.
  const rootInsets = useSafeAreaInsets();
  return (
    <SafeAreaProvider>
      <Bedside rootInsets={rootInsets} />
    </SafeAreaProvider>
  );
}

function Bedside({ rootInsets }: { rootInsets: EdgeInsets }) {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // The screen's own measured size (falls back to the window's at first).
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);
  const size = measured ?? window;
  // Re-render when the rotation finishes, so nothing keeps portrait values.
  const [orientation, setOrientation] = useState(ScreenOrientation.Orientation.UNKNOWN);
  useEffect(() => {
    ScreenOrientation.getOrientationAsync().then(setOrientation, () => {});
    const subscription = ScreenOrientation.addOrientationChangeListener((event) =>
      setOrientation(event.orientationInfo.orientation),
    );
    return () => subscription.remove();
  }, []);
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const now = useMinuteClock(true);
  const { alarms } = useAlarms();
  const slots = useBedsideSlots();

  useEffect(() => {
    setOpen(true);
    enterLandscape();
    return () => {
      setOpen(false);
      lockPortrait();
    };
  }, []);

  const layout = bedsideLayout(size.width, size.height, insets);
  const { dome, padding, scale } = layout;
  const styles = createStyles(layout);

  const date = new Date(now);
  const { time, period } = formatTime(date.getHours(), date.getMinutes(), uses24Hour);
  const sky = slots.sky?.(now) ?? null;
  const ranked = rankAlarms(alarms, now);
  const next = ranked.find(({ alarm }) => alarm.enabled);

  // One summary for VoiceOver, e.g. "11:42 PM. 7 hours 39 minutes until
  // sunrise. 54 degrees, light rain, feels like 51. Next alarm 7:00 AM."
  const nextSpoken = next
    ? `Next alarm ${timeText(next.alarm.hour, next.alarm.minute, uses24Hour)}`
    : 'No alarms on';
  const summary = [timeText(date.getHours(), date.getMinutes(), uses24Hour), sky?.untilSpoken, slots.weatherSpoken, nextSpoken]
    .filter(Boolean)
    .join('. ');

  return (
    <View
      style={styles.screen}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setMeasured((old) => (old && old.width === width && old.height === height ? old : { width, height }));
      }}
    >
      <StatusBar hidden />
      {/* Empty space exits. It carries the screen's one VoiceOver summary. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint="Exits bedside mode"
      />
      <View
        style={[
          styles.content,
          { paddingLeft: padding.left, paddingRight: padding.right, paddingTop: padding.top, paddingBottom: padding.bottom },
        ]}
        pointerEvents="box-none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {/* Weather, just inside the safe area's left edge. */}
        <View style={styles.side} pointerEvents="none">
          {slots.renderWeatherColumn?.(scale)}
        </View>

        {/* The dome and clock, centered between the columns. */}
        <View style={styles.middle} pointerEvents="none">
          <View style={styles.domeBox}>
            <BedsideDome geometry={dome} colors={COLORS} scale={scale} span={sky} now={now} alarmAt={next?.at ?? null} />
            <View style={[styles.clock, { top: dome.cy - dome.radius * 0.66 }]}>
              <View style={styles.timeLine}>
                <Text style={styles.time} maxFontSizeMultiplier={1}>
                  {time}
                </Text>
                {period !== '' && (
                  <Text style={styles.period} maxFontSizeMultiplier={1}>
                    {period}
                  </Text>
                )}
              </View>
              {sky && (
                <Text style={styles.until} maxFontSizeMultiplier={MAX_SCALE}>
                  {sky.untilText}
                </Text>
              )}
            </View>
            {/* Sunset and sunrise (or sunrise and sunset), under the ends. */}
            {sky && dome.radius > 0 && (
              <>
                <Text
                  style={[styles.endLabel, { left: domePoint(0, dome.cx, dome.cy, dome.radius).x - (LABEL_WIDTH * scale) / 2 }]}
                  maxFontSizeMultiplier={MAX_SCALE}
                >
                  {sky.startLabel}
                </Text>
                <Text
                  style={[styles.endLabel, styles.warm, { left: domePoint(1, dome.cx, dome.cy, dome.radius).x - (LABEL_WIDTH * scale) / 2 }]}
                  maxFontSizeMultiplier={MAX_SCALE}
                >
                  {sky.endLabel}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Alarms, just inside the safe area's right edge. They catch their
            own taps, so tapping one doesn't exit. */}
        <View style={[styles.side, styles.alarms]} onStartShouldSetResponder={() => true}>
          <Text style={styles.alarmsTitle} maxFontSizeMultiplier={MAX_SCALE}>
            Alarms
          </Text>
          {ranked.length === 0 && (
            <View style={styles.alarmRow}>
              <Text style={styles.alarmDetail} maxFontSizeMultiplier={MAX_SCALE}>
                No alarms
              </Text>
            </View>
          )}
          {ranked.slice(0, MAX_ALARMS).map(({ alarm }) => (
            <AlarmLine
              key={alarm.id}
              alarm={alarm}
              isNext={alarm.id === next?.alarm.id}
              uses24Hour={uses24Hour}
              styles={styles}
            />
          ))}
          {ranked.length > MAX_ALARMS && (
            <Text style={styles.more} maxFontSizeMultiplier={MAX_SCALE}>
              +{ranked.length - MAX_ALARMS} more
            </Text>
          )}
        </View>
      </View>

      {slots.debug && (
        <DebugReadout
          window={window}
          size={size}
          insets={insets}
          rootInsets={rootInsets}
          orientation={orientation}
          layout={layout}
        />
      )}

      {/* Inside the safe area too, so it's never under the island. */}
      <Pressable
        style={({ pressed }) => [styles.flip, { top: padding.top, right: padding.right }, pressed && styles.pressed]}
        onPress={() => flipLandscape()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Flip screen"
        accessibilityHint="Turns the screen the other way up"
      >
        <SymbolView
          name={{ ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' }}
          size={20}
          tintColor={COLORS.mainText}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

// TEMPORARY (Dynamic Island fix): what the layout was given and what it
// worked out, in Developer mode only. Bottom center, under everything that
// takes taps; hidden from VoiceOver.
function DebugReadout({
  window,
  size,
  insets,
  rootInsets,
  orientation,
  layout,
}: {
  window: { width: number; height: number };
  size: { width: number; height: number };
  insets: EdgeInsets;
  rootInsets: EdgeInsets;
  orientation: ScreenOrientation.Orientation;
  layout: BedsideLayout;
}) {
  const r = Math.round;
  const edges = (i: EdgeInsets) => `t${r(i.top)} r${r(i.right)} b${r(i.bottom)} l${r(i.left)}`;
  const leftColumn = [layout.padding.left, layout.padding.left + layout.sideWidth];
  const rightColumn = [size.width - layout.padding.right - layout.sideWidth, size.width - layout.padding.right];
  const lines = [
    `window ${r(window.width)}x${r(window.height)}  screen ${r(size.width)}x${r(size.height)}  orientation ${ScreenOrientation.Orientation[orientation]}`,
    `insets ${edges(insets)}  (root ${edges(rootInsets)})  side used ${sideInset(size.width, size.height, insets)}`,
    `scale ${layout.scale.toFixed(3)}  left col x ${leftColumn.map(r).join('-')}  right col x ${rightColumn.map(r).join('-')}`,
  ];
  return (
    <View style={debugStyles.box} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {lines.map((line) => (
        <Text key={line} style={debugStyles.text} maxFontSizeMultiplier={1}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const debugStyles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 2,
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    lineHeight: 12,
    fontVariant: ['tabular-nums'],
    color: COLORS.amber,
  },
});

// One alarm on the right: its time, and under it "Next · Weekdays" in
// amber for the next one, its repeat days (or label) for the others, or
// "Gym · Off", dimmed, when it's switched off.
function AlarmLine({ alarm, isNext, uses24Hour, styles }: { alarm: Alarm; isNext: boolean; uses24Hour: boolean; styles: Styles }) {
  const detail = alarm.repeatDays.length > 0 ? repeatSummary(alarm.repeatDays) : alarm.label;
  const subtitle = !alarm.enabled ? `${alarm.label} · Off` : isNext ? `Next · ${detail}` : detail;
  return (
    <View style={styles.alarmRow}>
      <Text
        style={[styles.alarmTime, isNext && styles.bright, !alarm.enabled && styles.off]}
        maxFontSizeMultiplier={MAX_SCALE}
      >
        {timeText(alarm.hour, alarm.minute, uses24Hour)}
      </Text>
      <Text
        style={[styles.alarmDetail, isNext && styles.warm, !alarm.enabled && styles.off]}
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_SCALE}
      >
        {subtitle}
      </Text>
    </View>
  );
}

// Every alarm with its next ring, switched-on alarms first, soonest first.
function rankAlarms(alarms: Alarm[], now: number) {
  return alarms
    .map((alarm) => ({ alarm, at: nextRing(alarm, now) }))
    .sort((a, b) => Number(b.alarm.enabled) - Number(a.alarm.enabled) || a.at - b.at);
}

function createStyles({ scale, sideWidth, dome, labelSpace, text }: BedsideLayout) {
  const line = (size: number) => ({ fontSize: size, lineHeight: Math.round(size * 1.3) });
  const gap = Math.round(8 * scale);
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    side: {
      width: sideWidth,
      justifyContent: 'center',
    },
    middle: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    domeBox: {
      width: dome.width,
      height: dome.height + labelSpace,
    },
    clock: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    timeLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Math.round(4 * scale),
    },
    time: {
      fontFamily: FONT_FAMILY,
      fontSize: text.clock,
      lineHeight: Math.round(text.clock * 1.1),
      fontWeight: '200',
      fontVariant: ['tabular-nums'],
      color: COLORS.mainText,
    },
    period: {
      fontFamily: FONT_FAMILY,
      fontSize: text.period,
      fontWeight: '400',
      color: COLORS.mainText,
    },
    until: {
      fontFamily: FONT_FAMILY,
      ...line(text.until),
      color: COLORS.mutedText,
      marginTop: Math.round(4 * scale),
    },
    endLabel: {
      position: 'absolute',
      // Just under the end dots.
      top: dome.cy + Math.round(14 * scale),
      width: LABEL_WIDTH * scale,
      textAlign: 'center',
      fontFamily: FONT_FAMILY,
      ...line(text.endLabel),
      color: COLORS.mutedText,
    },
    warm: {
      color: COLORS.amber,
    },
    alarms: {
      alignItems: 'flex-end',
      // Clear of the Flip button above.
      paddingTop: FLIP_SIZE,
    },
    alarmsTitle: {
      fontFamily: FONT_FAMILY,
      ...line(text.alarmsTitle),
      color: COLORS.mutedText,
      paddingBottom: gap,
    },
    alarmRow: {
      alignSelf: 'stretch',
      alignItems: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: COLORS.divider,
      paddingVertical: gap,
    },
    alarmTime: {
      fontFamily: FONT_FAMILY,
      ...line(text.alarmTime),
      fontVariant: ['tabular-nums'],
      color: COLORS.mainText,
    },
    alarmDetail: {
      fontFamily: FONT_FAMILY,
      ...line(text.small),
      color: COLORS.mutedText,
    },
    bright: {
      color: COLORS.brightText,
    },
    off: {
      color: COLORS.offText,
    },
    more: {
      fontFamily: FONT_FAMILY,
      ...line(text.small),
      color: COLORS.mutedText,
      paddingTop: gap,
    },
    flip: {
      position: 'absolute',
      width: FLIP_SIZE,
      height: FLIP_SIZE,
      borderRadius: FLIP_SIZE / 2,
      borderWidth: 1.5,
      borderColor: COLORS.domePast,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
