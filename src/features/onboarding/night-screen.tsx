import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FONT_FAMILY, palette, spacing, type Theme } from '@/constants/theme';
import { DEFAULT_TONE, playToneSample, stopToneSample, TONE_CHOICES, type AlarmTone } from '@/features/alarms/public';
import { useTheme } from '@/hooks/use-theme';

import { BedsideIllustration } from './illustrations';
import { OnboardingPage } from './onboarding-page';

const SAMPLE_MS = 3000;

// Screen 3 of 5: waking to the weather and bedside mode. Tapping a tone
// chip selects it and plays a 3-second sample (through the alarm feature's
// public API). There's no default-tone setting, so the choice is only a
// preview; new alarms still start on Morning.
export function NightScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [selected, setSelected] = useState<AlarmTone>(DEFAULT_TONE);

  useFocusEffect(useCallback(() => () => stopToneSample(), []));

  return (
    <OnboardingPage
      step={3}
      hero={
        <View style={styles.hero}>
          <BedsideIllustration />
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Alarm tone">
            {TONE_CHOICES.map(({ id, label }) => {
              const isSelected = id === selected;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    setSelected(id);
                    playToneSample(id, SAMPLE_MS);
                  }}
                  style={({ pressed }) => [styles.chip, isSelected ? styles.chipSelected : styles.chipIdle, pressed && styles.pressed]}
                  hitSlop={4}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={label}
                  accessibilityHint="Plays a short sample"
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      }
      title={'Wake\nto it.'}
      titleSize={56}
      body="Pick a tone. Today's weather plays softly underneath. Turn your phone sideways on its charger for bedside mode."
      button={{ label: 'Continue', onPress: () => router.push('/onboarding/name') }}
    />
  );
}

function createStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    hero: {
      alignItems: 'center',
      gap: spacing.lg,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    chip: {
      minHeight: 44,
      borderRadius: 22,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    chipSelected: {
      backgroundColor: colors.buttonBackground,
    },
    chipIdle: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: theme.name === 'light' ? palette.line : colors.border,
    },
    chipText: {
      fontFamily: FONT_FAMILY,
      fontSize: 16,
      fontWeight: '700',
      color: colors.buttonBackground,
    },
    chipTextSelected: {
      color: colors.buttonText,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}
