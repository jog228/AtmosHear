import { useCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, BackHandler, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { type PulseSource } from '@/components/brand';
import { LARGE_TEXT_MAX_SCALE, spacing } from '@/constants/theme';
import { useMinuteClock } from '@/hooks/use-minute-clock';
import { hapticPlayer } from '@/services/haptics';

import { useAlarmColors, useBedsideColors, type AlarmColors } from './alarm-colors';
import { countdownText, dateText, formatTime, timeText, untilText } from './alarm-format';
import { BigButton, SunRings } from './alarm-parts';
import { alarmRinger, SNOOZE_EXTEND_MS, SNOOZE_MS } from './alarm-ringer';
import { DEFAULT_LABEL } from './alarm-types';
import { BEDSIDE_MARGIN, sideInset } from './bedside-layout';
import { useBedsideDaytime, useBedsideSlots } from './bedside-slots';

const BUTTON_HEIGHT = 72;

// Each buzz tap grows the rings a little (DotRings, scale only, so it
// can't flash; still with Reduce Motion).
const buzzPulses: PulseSource = (onPulse) => hapticPlayer.subscribeTaps(() => onPulse(0.6));

// Full screen while an alarm rings or is snoozed (route /alarm-ringing,
// opened by AlarmHost), after design/frames/26 Alarm ringing.png and
// 27 Snoozed.png. Ringing: the date, the big time, the weather playing
// under the tone (the ringWeather slot), the clock-face sun in rings that
// pulse with the buzz, and Snooze 9 min and Stop. Snooze keeps it open:
// a countdown to the next ring, when that is, the weather, and Add 5 min
// and Stop. Keeps the screen awake. Closes itself when there's neither a
// ring nor a snooze (Stop, or the 10-minute auto-stop). Can't be swiped
// away. Over bedside mode it's landscape: the text on the left, the
// buttons side by side on the right, no rings (and back to bedside, the
// same way up, after). Like bedside mode, it's a fullScreenModal with its
// own SafeAreaProvider, since the app's root one can keep portrait insets
// after a rotation.
export function RingingScreen() {
  return (
    <SafeAreaProvider>
      <Ringing />
    </SafeAreaProvider>
  );
}

function Ringing() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const landscape = window.width > window.height;
  const now = useMinuteClock(true);
  const slots = useBedsideSlots();
  const weather = slots.ringWeather;
  // Over bedside mode (landscape), the same palette as bedside; otherwise
  // the Alarms tab's colors.
  const alarmColors = useAlarmColors();
  const bedside = useBedsideColors(useBedsideDaytime(slots.now(now))).colors;
  const colors: AlarmColors = landscape
    ? {
        ...alarmColors,
        background: bedside.background,
        card: bedside.background,
        cardBorderWidth: 2,
        separator: bedside.accent,
        text: bedside.brightText,
        secondaryText: bedside.mutedText,
        accent: bedside.accent,
        onAccent: bedside.onAccent,
      }
    : alarmColors;
  const styles = createStyles(colors);
  // In landscape, the same rule as bedside mode: the larger side inset on
  // both sides plus a margin, so nothing is under the Dynamic Island
  // whichever way up.
  const side = sideInset(window.width, window.height, insets) + BEDSIDE_MARGIN;
  const uses24Hour = useCalendars()[0]?.uses24hourClock ?? false;
  const ring = useSyncExternalStore(
    (listener) => alarmRinger.subscribe(listener),
    () => alarmRinger.current(),
  );
  const snoozed = useSyncExternalStore(
    (listener) => alarmRinger.subscribe(listener),
    () => alarmRinger.snoozed(),
  );
  const shown = ring ?? snoozed;

  // The snooze countdown ticks every second.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (ring || !snoozed) return;
    const update = () => setTick(Date.now());
    const catchUp = setTimeout(update, 0);
    const interval = setInterval(update, 1000);
    return () => {
      clearTimeout(catchUp);
      clearInterval(interval);
    };
  }, [ring, snoozed]);

  const at = new Date(shown?.at ?? now);
  const hour = at.getHours();
  const minute = at.getMinutes();
  const spokenTime = timeText(hour, minute, uses24Hour);
  const { time, period } = formatTime(hour, minute, uses24Hour);
  const label = shown?.label ?? '';
  const named = label !== '' && label !== DEFAULT_LABEL;

  // Announced once when it rings (again after a snooze).
  const ringLabel = ring?.label;
  const ringAt = ring?.at;
  useEffect(() => {
    if (ringLabel) AccessibilityInfo.announceForAccessibility(`Alarm, ${ringLabel}, ${spokenTime}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringLabel, ringAt]);

  // Nothing ringing or snoozed: leave.
  useEffect(() => {
    if (shown) return;
    if (router.canGoBack()) router.back();
    else router.replace('/alarms');
  }, [shown]);

  // Android's back button doesn't dismiss a ringing alarm.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const snooze = useCallback(() => {
    const until = timeText(...hourMinute(Date.now() + SNOOZE_MS), uses24Hour);
    alarmRinger.snooze();
    AccessibilityInfo.announceForAccessibility(`Snoozed until ${until}`);
  }, [uses24Hour]);

  const addFive = useCallback(() => {
    const current = alarmRinger.snoozed();
    if (!current) return;
    alarmRinger.extendSnooze();
    const until = timeText(...hourMinute(current.at + SNOOZE_EXTEND_MS), uses24Hour);
    AccessibilityInfo.announceForAccessibility(`Rings again at ${until}`);
  }, [uses24Hour]);

  // What the text says, ringing or snoozed.
  const isSnoozed = !ring && !!snoozed;
  const left = snoozed ? snoozed.at - tick : 0;
  const caption = isSnoozed ? 'Snoozed' : [dateText(shown?.at ?? now), named ? label : null].filter(Boolean).join(' · ');
  const big = isSnoozed ? countdownText(left) : time;
  const bigPeriod = isSnoozed ? '' : period;
  const headline = isSnoozed ? `Rings again at ${spokenTime}` : (weather?.headline ?? null);
  const subline = isSnoozed ? (weather?.headline ?? null) : (weather?.playing ?? null);
  const spoken = isSnoozed
    ? `Snoozed${named ? `, ${label}` : ''}. Rings again at ${spokenTime}, in ${untilText(left).spoken}.${weather ? ` ${weather.spoken}.` : ''}`
    : `Alarm, ${label}, ${spokenTime}.${weather ? ` ${weather.spoken}.` : ''}${weather?.playing ? ` ${weather.playing}.` : ''}`;

  return (
    <View
      style={[
        styles.screen,
        landscape && styles.screenLandscape,
        {
          paddingTop: insets.top + (landscape ? BEDSIDE_MARGIN : spacing.lg),
          paddingBottom: insets.bottom + (landscape ? BEDSIDE_MARGIN : spacing.lg),
          paddingLeft: landscape ? side : insets.left + spacing.md,
          paddingRight: landscape ? side : insets.right + spacing.md,
        },
      ]}
    >
      <View style={[styles.top, landscape && styles.topLandscape]} accessible accessibilityLabel={spoken}>
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
        <View style={styles.timeLine}>
          <Text
            style={[styles.time, landscape && styles.timeLandscape]}
            maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {big}
          </Text>
          {bigPeriod !== '' && (
            <Text style={styles.period} maxFontSizeMultiplier={LARGE_TEXT_MAX_SCALE}>
              {bigPeriod}
            </Text>
          )}
        </View>
        {headline && (
          <Text style={styles.headline} numberOfLines={3}>
            {headline}
          </Text>
        )}
        {subline && (
          <Text style={styles.subline} numberOfLines={2}>
            {subline}
          </Text>
        )}
      </View>

      {!landscape && <Art clock={{ hour, minute }} pulsing={!!ring} />}

      <View style={[styles.buttons, landscape && styles.buttonsLandscape]}>
        {isSnoozed ? (
          <BigButton
            label="Add 5 min"
            variant="card"
            width="flex"
            height={BUTTON_HEIGHT}
            colors={colors}
            onPress={addFive}
            accessibilityLabel="Add 5 minutes"
            accessibilityHint="Rings 5 minutes later"
          />
        ) : (
          <BigButton
            label="Snooze 9 min"
            variant="card"
            width="flex"
            height={BUTTON_HEIGHT}
            colors={colors}
            onPress={snooze}
            accessibilityLabel="Snooze 9 minutes"
            accessibilityHint={`Rings again at ${timeText(...hourMinute(now + SNOOZE_MS), uses24Hour)}`}
          />
        )}
        <BigButton
          label="Stop"
          width="flex"
          height={BUTTON_HEIGHT}
          colors={colors}
          onPress={() => (isSnoozed ? alarmRinger.dismissSnooze() : alarmRinger.stop())}
          accessibilityLabel={isSnoozed ? 'Stop, and cancel the snooze' : 'Stop alarm'}
        />
      </View>
    </View>
  );
}

// The clock-face sun in its rings, as big as the space between the text
// and the buttons allows.
function Art({ clock, pulsing }: { clock: { hour: number; minute: number }; pulsing: boolean }) {
  const [size, setSize] = useState(0);
  return (
    <View
      style={artStyles.art}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize(Math.floor(Math.min(width, height, 380)));
      }}
    >
      {size > 80 && <SunRings size={size} clock={clock} pulses={pulsing ? buzzPulses : undefined} />}
    </View>
  );
}

const artStyles = StyleSheet.create({
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
});

function hourMinute(ms: number): [number, number] {
  const date = new Date(ms);
  return [date.getHours(), date.getMinutes()];
}

function createStyles(colors: AlarmColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Landscape (over bedside mode): two halves side by side.
    screenLandscape: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    top: {
      gap: spacing.xs,
    },
    topLandscape: {
      flex: 1,
    },
    caption: {
      fontSize: 17,
      color: colors.secondaryText,
    },
    timeLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.sm,
    },
    // Giant and tight, like the frames; shrinks to fit one line.
    time: {
      flexShrink: 1,
      fontSize: 128,
      lineHeight: 136,
      fontWeight: '800',
      letterSpacing: -5,
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    timeLandscape: {
      fontSize: 88,
      lineHeight: 96,
      letterSpacing: -3,
    },
    period: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    headline: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.sm,
    },
    subline: {
      fontSize: 17,
      lineHeight: 22,
      color: colors.secondaryText,
    },
    buttons: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    buttonsLandscape: {
      flex: 1,
    },
  });
}
