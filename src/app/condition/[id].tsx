import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CueRows } from '@/components/cue-rows';
import { ConditionName, PlayAllButton } from '@/components/cue-screen-parts';
import { WeatherHero } from '@/components/weather-hero';
import { CONDITION_IDS, type ConditionId } from '@/constants/conditions';
import { spacing, typography, type Theme } from '@/constants/theme';
import { useCuePreview } from '@/hooks/use-cue-preview';
import { useTheme } from '@/hooks/use-theme';

// One condition's cues (design/frames/10_Condition_detail.png), opened from
// the Sound library.
export default function ConditionScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();
  const condition: ConditionId = CONDITION_IDS.includes(id as ConditionId) ? (id as ConditionId) : 'clear';
  const preview = useCuePreview();
  const playing = preview.playing === condition;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <WeatherHero conditions={[condition]} size={260} visible />
      </View>
      <View>
        <Text style={styles.caption}>Condition</Text>
        <ConditionName condition={condition} />
      </View>
      <CueRows condition={condition} vibrationOn={preview.vibrationOn} />
      <PlayAllButton playing={playing} onPress={() => preview.toggle(condition)} />
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    hero: {
      alignItems: 'center',
    },
    caption: {
      ...typography.body,
      color: theme.colors.textSecondary,
    },
  });
}
