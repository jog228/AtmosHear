import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/glass-card';
import { WeatherIcon } from '@/components/weather-icon';
import { TEST_WEATHER, type TestWeather } from '@/constants/test-weather';
import { spacing, type Theme } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';

const GROUPS: TestWeather['group'][] = ['Conditions', 'Combinations'];

// Sheet for picking Developer mode's test weather (opened from Preferences › Developer).
export default function TestWeatherSheet() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { preferences, updatePreferences } = usePreferences();

  const choose = (option: TestWeather) => {
    updatePreferences({ testWeather: option.id });
    AccessibilityInfo.announceForAccessibility(`${option.label} selected`);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* Drawn here because Android sheets can't show a native header. */}
      <Text style={styles.title} accessibilityRole="header">
        Test weather
      </Text>
      {GROUPS.map((group) => (
        <View key={group} style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {group}
          </Text>
          <GlassCard accessibilityRole="radiogroup">
            {TEST_WEATHER.filter((option) => option.group === group).map((option, i) => {
              const selected = option.id === preferences.testWeather;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.row, i > 0 && styles.divider]}
                  onPress={() => choose(option)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={option.label}
                >
                  <WeatherIcon conditions={option.conditions} />
                  <Text style={styles.label}>{option.label}</Text>
                  {selected && (
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={20}
                      tintColor={theme.colors.accent}
                      accessible={false}
                    />
                  )}
                </Pressable>
              );
            })}
          </GlassCard>
        </View>
      ))}
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      gap: spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.heading,
      textAlign: 'center',
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.heading,
      marginLeft: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 52,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    label: {
      flex: 1,
      fontSize: 17,
      color: theme.colors.textPrimary,
    },
  });
}
