import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

// The app is portrait everywhere except bedside mode, which is landscape
// either way up (so the charger can be on either side). app.json allows
// every orientation ("default"); these locks decide. Locks can be refused
// (iOS 27 while the app is resizable), so failures are ignored.

const SIDE_KEY = 'bedside.landscapeSide';
type Side = 'left' | 'right';

const LOCKS: Record<Side, ScreenOrientation.OrientationLock> = {
  left: ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
  right: ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
};

export function lockPortrait() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

// Bedside mode opening: the side picked last time with Flip, or either
// landscape side (whichever way the phone is turned) before the first flip.
export async function enterLandscape() {
  const saved = await loadSide();
  await ScreenOrientation.lockAsync(saved ? LOCKS[saved] : ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
}

// The Flip button: the other landscape side, for when rotation lock keeps
// the phone from turning. Remembered for next time.
export async function flipLandscape() {
  const current = await ScreenOrientation.getOrientationAsync().catch(() => ScreenOrientation.Orientation.UNKNOWN);
  const next: Side = current === ScreenOrientation.Orientation.LANDSCAPE_LEFT ? 'right' : 'left';
  await ScreenOrientation.lockAsync(LOCKS[next]).catch(() => {});
  AsyncStorage.setItem(SIDE_KEY, next).catch(() => {});
}

async function loadSide(): Promise<Side | null> {
  try {
    const value = await AsyncStorage.getItem(SIDE_KEY);
    return value === 'left' || value === 'right' ? value : null;
  } catch {
    return null;
  }
}
