import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { conditionProfiles } from '@/constants/condition-profiles';
import type { ConditionId } from '@/constants/conditions';
import { describeContrastPair } from '@/constants/contrast';
import { describeLightTiming } from '@/constants/light-cues';
import { spacing, typography, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ContrastGlyph, LightGlyph, SoundGlyph, VibrationGlyph } from './cue-glyphs';

type Props = {
  condition: ConditionId;
  // Shown under the vibration when Vibration is off in Preferences, since a
  // preview won't vibrate then.
  vibrationOn: boolean;
};

// Sound, Vibration, Light, and Contrast color for one condition, as divided
// rows with a glyph on the right (design/frames/08 and 10). Each row reads
// as one line to VoiceOver.
export function CueRows({ condition, vibrationOn }: Props) {
  const theme = useTheme();
  const profile = conditionProfiles[condition];
  const contrast = describeContrastPair(profile.contrastPair);
  const hasSound = !!profile.sound || condition === 'severe-alert';
  const lightTiming = describeLightTiming(profile.light);
  const vibrationNote = vibrationOn ? profile.vibrationDetail : `${profile.vibrationDetail}. Vibration is off in Preferences`;

  return (
    <View>
      <CueRow
        label="Sound"
        value={profile.soundDescription}
        glyph={hasSound ? <SoundGlyph theme={theme} /> : null}
      />
      <CueRow
        label="Vibration"
        value={profile.vibrationDescription}
        detail={vibrationNote}
        glyph={<VibrationGlyph pattern={profile.haptic} theme={theme} />}
      />
      <CueRow
        label="Light"
        value={profile.lightDescription}
        detail={lightTiming}
        glyph={<LightGlyph cue={profile.light} theme={theme} />}
      />
      <CueRow
        label="Contrast color"
        value={contrast.label}
        detail={`${contrast.ratioText} contrast`}
        spokenDetail={`${contrast.spokenRatio} contrast`}
        glyph={<ContrastGlyph pair={profile.contrastPair} theme={theme} />}
        last
      />
    </View>
  );
}

function CueRow({
  label,
  value,
  detail,
  spokenDetail,
  glyph,
  last,
}: {
  label: string;
  value: string;
  detail?: string;
  spokenDetail?: string;
  glyph: ReactNode;
  last?: boolean;
}) {
  const styles = createStyles(useTheme());
  const spoken = [`${label}: ${value}`, spokenDetail ?? detail].filter(Boolean).join('. ');
  return (
    <View style={[styles.row, !last && styles.divider]} accessible accessibilityLabel={spoken}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}
      </View>
      {glyph}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
    },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    label: {
      ...typography.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    value: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      color: theme.colors.textPrimary,
    },
    detail: {
      ...typography.body,
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
  });
}
