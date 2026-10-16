import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CueRows } from '@/components/cue-rows';
import { ConditionName, PlayAllButton } from '@/components/cue-screen-parts';
import { WeatherHero } from '@/components/weather-hero';
import { CONDITION_IDS, type ConditionId } from '@/constants/conditions';
import { spacing, typography, type Theme } from '@/constants/theme';
import { useCuePreview } from '@/hooks/use-cue-preview';
import { useTheme } from '@/hooks/use-theme';

// Feel & hear (design/frames/08_Feel_and_hear.png): the cues for the
// current most significant condition, passed in from the Weather screen.
export default function FeelAndHearScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { condition: param } = useLocalSearchParams<{ condition: string }>();
  const condition: ConditionId = CONDITION_IDS.includes(param as ConditionId) ? (param as ConditionId) : 'clear';
  const preview = useCuePreview();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/sounds')}
              style={({ pressed }) => [styles.allSounds, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="All sounds"
            >
              <Text style={styles.allSoundsText}>All sounds</Text>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={15}
                weight="semibold"
                tintColor={theme.colors.textPrimary}
                accessible={false}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.top}>
          <View style={styles.heading}>
            <Text style={styles.caption}>Right now</Text>
            <ConditionName condition={condition} size="h1" />
          </View>
          <WeatherHero conditions={[condition]} size={150} visible />
        </View>
        <CueRows condition={condition} vibrationOn={preview.vibrationOn} />
        <PlayAllButton playing={preview.playing === condition} onPress={() => preview.toggle(condition)} />
      </ScrollView>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    heading: {
      flex: 1,
    },
    caption: {
      ...typography.body,
      color: theme.colors.textSecondary,
    },
    allSounds: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.xs,
    },
    allSoundsText: {
      ...typography.body,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    pressed: {
      opacity: 0.6,
    },
  });
}
