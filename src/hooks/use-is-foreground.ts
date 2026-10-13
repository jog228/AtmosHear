import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// True while the app is on screen. 'inactive' (e.g. Control Center open)
// still counts as foreground.
export function useIsForeground(): boolean {
  const [foreground, setForeground] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state !== 'background'));
    return () => subscription.remove();
  }, []);
  return foreground;
}
