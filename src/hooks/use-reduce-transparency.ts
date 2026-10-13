import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// True when iOS Settings > Accessibility > Display & Text Size > Reduce
// Transparency is on. Updates live. Always false on Android.
export function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setEnabled);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setEnabled);
    return () => subscription.remove();
  }, []);

  return enabled;
}
