import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing, type Theme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { cleanName, NAME_MAX_LENGTH } from './opening-storage';
import { useOpeningPreferences } from './use-opening-preferences';

// An optional name for the Weather screen greeting. Saves when the field
// loses focus or Done is pressed, trimmed (empty means no name).
export function NameField() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { name, update } = useOpeningPreferences();
  const [draft, setDraft] = useState(name);

  // Switching tabs with the keyboard up closes it, which saves the name.
  useFocusEffect(useCallback(() => () => Keyboard.dismiss(), []));

  const save = () => {
    const cleaned = cleanName(draft);
    setDraft(cleaned);
    if (cleaned !== name) update({ name: cleaned });
  };

  return (
    <View style={styles.group}>
      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        onBlur={save}
        onSubmitEditing={save}
        placeholder="Your name (optional)"
        placeholderTextColor={theme.colors.textSecondary}
        maxLength={NAME_MAX_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="done"
        accessibilityLabel="Your name, optional, up to 15 characters"
      />
      <Text style={styles.counter} accessibilityLabel={`${draft.length} of ${NAME_MAX_LENGTH} characters`}>
        {draft.length}/{NAME_MAX_LENGTH}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  const { colors } = theme;
  return StyleSheet.create({
    group: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: theme.cardBorderWidth,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      minHeight: 56,
      fontSize: 17,
      color: colors.textPrimary,
    },
    counter: {
      fontSize: 13,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
  });
}
