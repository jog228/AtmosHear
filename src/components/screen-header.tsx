import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import type { Place } from '@/services/location';

export function ScreenHeader({ place }: { place: Place }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Immersive Weather
      </Text>
      <Text style={styles.location}>{place.name}</Text>
      {place.isFallback && (
        <Text style={styles.note}>Location unavailable, showing default</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  location: {
    fontSize: 16,
    color: colors.textMuted,
  },
  note: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
