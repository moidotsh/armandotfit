// components/composed/SearchStatement.tsx
//
// THE QUIET PAGE's library instrument: the search field IS the
// statement (quiet-page-thesis §6 — "the library's loudest thing is
// the search field"). The query rides the statement scale in the
// display face; the placeholder is an overlaid text node at the same
// scale, so the page states its purpose even before the first
// keystroke — and the hierarchy law measures it. One hairline under
// the field is the page's spent rule: the blank-line counter-field
// pattern — the instrument gets its line. No border box, no icon, no
// chrome: the query is the headline.

import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../context';
import { theme } from '../../constants';

export interface SearchStatementProps {
  value: string;
  onChangeText: (text: string) => void;
  /** The statement shown while the field is empty. */
  placeholder: string;
  accessibilityLabel: string;
  testID?: string;
}

const STATEMENT_STYLE = {
  ...theme.typography.mobileDisplay,
  fontWeight: '700' as const,
};

export function SearchStatement({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  testID,
}: SearchStatementProps) {
  const { colors } = useAppTheme();

  return (
    <View>
      {/* Fixed-height line: the placeholder sizes it while empty, the
          absolute input keeps it once typing begins. */}
      <View style={styles.line}>
        {value.length === 0 ? (
          <Text style={[STATEMENT_STYLE, styles.fill, { color: colors.textMuted }]} pointerEvents="none">
            {placeholder}
          </Text>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel={accessibilityLabel}
          style={[
            STATEMENT_STYLE,
            styles.fill,
            styles.input,
            { color: colors.text },
          ]}
          autoCorrect={false}
          autoCapitalize="none"
          testID={testID}
          underlineColorAndroid="transparent"
        />
      </View>
      {/* The instrument's line — the one rule this page spends. */}
      <View style={[styles.rule, { backgroundColor: colors.mobilePremium.hairlineBorder }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    height: 48,
    justifyContent: 'center',
  },
  fill: {
    // The placeholder and the input occupy the same slot.
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    opacity: 1,
  },
  rule: {
    height: 1,
    marginTop: 6,
  },
});

export default SearchStatement;
