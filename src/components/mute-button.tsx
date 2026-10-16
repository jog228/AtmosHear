import { SymbolView } from 'expo-symbols';
import { AccessibilityInfo } from 'react-native';

import { taps } from '@/constants/haptics';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { hapticPlayer } from '@/services/haptics';

import { SQUARE_BUTTON_ICON, SquareButton, squareButtonIconColor } from './square-button';

// Quick mute for checking the app in public. Flips the same "Ambient sound"
// setting as Preferences, so both always match. Sound only: vibration and
// severe alert beeps keep working.
// The deepBlue square beside Feel & hear on the Weather screen.
export function MuteButton() {
  const theme = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const soundOn = preferences.ambientSound;

  const toggle = () => {
    const next = !soundOn;
    updatePreferences({ ambientSound: next });
    // A light tap confirms the press, if Vibration is on.
    if (preferences.vibration) hapticPlayer.play([taps('light', [0])]);
    AccessibilityInfo.announceForAccessibility(next ? 'Sound on' : 'Sound muted');
  };

  return (
    <SquareButton
      variant="primary"
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel="Ambient sound"
      accessibilityState={{ checked: soundOn }}
      accessibilityHint={soundOn ? 'Double-tap to mute' : 'Double-tap to unmute'}
    >
      <SymbolView
        name={
          soundOn
            ? { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' }
            : { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }
        }
        size={SQUARE_BUTTON_ICON}
        tintColor={squareButtonIconColor(theme, 'primary')}
        accessible={false}
      />
    </SquareButton>
  );
}
