import { SymbolView } from 'expo-symbols';
import { AccessibilityInfo, Pressable, StyleSheet } from 'react-native';

import { taps } from '@/constants/haptics';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { hapticPlayer } from '@/services/haptics';

// Quick mute for checking the app in public. Flips the same "Ambient sound"
// setting as Settings, so both always match. Sound only: vibration and
// severe alert beeps keep working.
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
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
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
        size={26}
        tintColor={theme.colors.heading}
        accessible={false}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
