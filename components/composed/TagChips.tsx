// components/composed/TagChips.tsx
// The realization-context editor for a logged exercise. Quiet by design:
// active tags render as small ember chips (tap to remove), suggested tags
// ride ONE bare-text line (tap a word to add), and the free-form input
// hides behind a small "+ tag" affordance until asked for. This is the
// ONLY setup-control surface — there are no per-dimension pickers.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

export interface TagChipsProps {
  /** Currently active tags on the logged exercise. */
  tags: string[];
  /** Suggested tags shown as one-tap words (program suggestions first). */
  suggestions?: string[];
  onToggleTag: (tag: string) => void;
  /** Fired when the user submits a new tag via the input. */
  onAddTag: (tag: string) => void;
  testID?: string;
}

function normalizeTag(raw: string): string | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, '-');
  return t.length >= 1 && t.length <= 30 ? t : null;
}

export function TagChips({
  tags,
  suggestions = [],
  onToggleTag,
  onAddTag,
  testID,
}: TagChipsProps) {
  const { colors } = useAppTheme();
  const [input, setInput] = useState('');
  const [inputOpen, setInputOpen] = useState(false);

  const active = new Set(tags);
  // Suggestion order: program suggestions first, then any seed-vocabulary
  // values not already covered. Deduped; already-active tags excluded —
  // they render in the active row.
  const suggestionList = suggestions.filter((s) => !active.has(s));

  const submit = () => {
    const tag = normalizeTag(input);
    if (tag && !active.has(tag)) onAddTag(tag);
    setInput('');
    setInputOpen(false);
  };

  return (
    <View style={styles.wrap} testID={testID}>
      {tags.length > 0 ? (
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => onToggleTag(tag)}
              accessibilityRole="button"
              accessibilityLabel={`Remove tag ${tag}`}
              hitSlop={8}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: `${colors.brand}14`,
                  borderColor: `${colors.brand}3D`,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: colors.brandText }]}>
                {tag} ✕
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.chipRow}>
        {suggestionList.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => onToggleTag(tag)}
            accessibilityRole="button"
            accessibilityLabel={`Add tag ${tag}`}
            hitSlop={6}
            style={({ pressed }) => [styles.wordCta, pressed ? { opacity: 0.6 } : null]}
          >
            <Text style={[styles.wordText, { color: colors.textSecondary }]}>
              {tag}
            </Text>
          </Pressable>
        ))}
        {inputOpen ? null : (
          <Pressable
            onPress={() => setInputOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Add custom tag"
            hitSlop={6}
            style={({ pressed }) => [styles.wordCta, pressed ? { opacity: 0.6 } : null]}
          >
            <Text style={[styles.wordText, { color: colors.brand }]}>+ tag</Text>
          </Pressable>
        )}
      </View>

      {inputOpen ? (
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.glass.emptyInputBorder,
              backgroundColor: colors.glass.inputBackground,
              color: colors.text,
            },
          ]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          placeholder="Add tag (e.g. column-3, paused)…"
          placeholderTextColor={colors.textColors.tertiary}
          returnKeyType="done"
          autoFocus
          accessibilityLabel="Add custom tag"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { ...theme.typography.mobileTag },
  wordCta: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  wordText: { ...theme.typography.mobileTag },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    ...theme.typography.mobileBody,
  },
});

export default TagChips;
