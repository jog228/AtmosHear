import { createContext, useContext, type ReactNode } from 'react';

// Bedside mode shows weather and the sky, but alarm code can't import
// weather code. So the screen has slots that the root layout fills in from
// the weather side. Empty slots: no weather column, and a plain arc instead
// of the sunrise/sunset dome. The clock and alarms always show.

// The dome's stretch of sky at a moment, already in words.
export type BedsideSky = {
  kind: 'day' | 'night';
  // The dome's left and right ends (ms since 1970).
  start: number;
  end: number;
  // Under the ends, e.g. "Sunset 6:10 PM" and "Sunrise 7:21 AM".
  startLabel: string;
  endLabel: string;
  // Under the clock, e.g. "7 hr 39 min until sunrise", and spoken.
  untilText: string;
  untilSpoken: string;
};

export type BedsideSlots = {
  // Draws the left column (current weather) at the screen's scale
  // (bedside-layout.ts), or null to leave it out.
  renderWeatherColumn: ((scale: number) => ReactNode) | null;
  // For the screen's VoiceOver summary, e.g. "54 degrees, light rain,
  // feels like 51".
  weatherSpoken: string | null;
  // The sky at `now`, or null for a plain arc.
  sky: ((now: number) => BedsideSky | null) | null;
  // Developer mode: shows a layout readout (window, insets, scale).
  // TEMPORARY, for the Dynamic Island fix.
  debug: boolean;
};

const EMPTY: BedsideSlots = { renderWeatherColumn: null, weatherSpoken: null, sky: null, debug: false };

const BedsideSlotsContext = createContext<BedsideSlots>(EMPTY);

export function BedsideSlotsProvider({ value, children }: { value: BedsideSlots; children: ReactNode }) {
  return <BedsideSlotsContext.Provider value={value}>{children}</BedsideSlotsContext.Provider>;
}

export function useBedsideSlots(): BedsideSlots {
  return useContext(BedsideSlotsContext);
}
