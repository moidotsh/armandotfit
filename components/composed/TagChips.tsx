// components/composed/TagChips.tsx
// The realization-context editor for a logged exercise. Quiet by design:
// active tags render as small signal chips (tap to remove), suggested
// tags ride ONE bare-text line (tap a word to add), and the free-form
// input hides behind a small "+ tag" affordance until asked for. This
// is the ONLY setup-control surface — there are no per-dimension
// pickers. `register="focus"` retunes the whole surface for the stage.

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
  /** 'desk' (default) reads the Desk palette; 'focus' reads the focus register (the stage). */
  register?: 'desk' | 'focus';
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
  register = 'desk',
  testID,
}: TagChipsProps) {
  const { colors } = useAppTheme();
  const [input, setInput] = useState('');
  const [inputOpen, setInputOpen] = useState(false);
  const focus = register === 'focus';

  const chipBg = focus ? colors.focus.signalSoft : colors.cardAlt;
  const chipBorder = focus ? colors.focus.signal : colors.border;
  const chipText = focus ? colors.focus.signal : colors.textSecondary;
  const wordText = focus ? colors.focus.muted : colors.textSecondary;
  const plusText = focus ? colors.focus.signal : colors.brand;
  const inputBorder = focus ? colors.focus.border : colors.glass.emptyInputBorder;
  const inputBg = focus ? colors.focus.surfaceAlt : colors.glass.inputBackground;
  const inputFg = focus ? colors.focus.text : colors.text;

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
                  backgroundColor: chipBg,
                  borderColor: chipBorder,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: chipText }]}>
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
            <Text style={[styles.wordText, { color: wordText }]}>
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
            <Text style={[styles.wordText, { color: plusText }]}>+ tag</Text>
          </Pressable>
        )}
      </View>

      {inputOpen ? (
        <TextInput
          style={[
            styles.input,
            {
              borderColor: inputBorder,
              backgroundColor: inputBg,
              color: inputFg,
              outlineWidth: 0,
            },
          ]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submit}
          placeholder="Add tag (e.g. column-3, paused)…"
          placeholderTextColor={focus ? colors.focus.muted : colors.textColors.tertiary}
          returnKeyType="done"
          autoFocus
          accessibilityLabel="Add custom tag"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, alignItems: 'center' },
  // Every pressable clears the 44px touch floor — the visual marking
  // chip rides centered inside the box (RN-web hitSlop does not expand
  // the DOM hit area; measured).
  chip: {
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: theme.shapes.tag,
    borderWidth: 1,
  },
  chipText: { ...theme.typography.mobileTag },
  wordCta: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  wordText: { ...theme.typography.mobileTag },
  input: {
    borderWidth: 1.5,
    borderRadius: theme.shapes.control,
    minHeight: 44,
    paddingHorizontal: 10,
    ...theme.typography.mobileBody,
  },
});

export default TagChips;
