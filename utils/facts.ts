// utils/facts.ts
//
// THE FACT JOIN (the atelier pass, finissage): every fact line, tag
// run, and whisper list in the app joins through ONE authored
// separator — middot flanked by HAIR SPACES (U+2009), not word
// spaces. The difference is optical: a word-spaced middot reads as
// three characters; a hair-spaced one reads as one breath. Gate-
// enforced (verify-design bans raw ` · ` joins in the authored layer).

/** The one separator: middot with hair-space shoulders. */
export const FACT_JOIN = ' \u2009·\u2009';

/**
 * Join present parts into one fact line. Null/undefined/empty-string
 * segments never join (a printed `·` beside nothing is a fact line
 * lying about its parts — the sight amendment's law, carried here).
 */
export function joinFacts(
  parts: Array<string | number | null | undefined>,
): string {
  return parts.filter((p): p is string | number => p != null && p !== '').join(FACT_JOIN);
}
