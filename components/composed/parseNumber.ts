// components/composed/parseNumber.ts
//
// The set-logger's input parser: text → number|null. Empty string →
// null (Number('') is 0, which would false-positive as "0 kg");
// anything non-finite → null. Shared by every figure-input surface
// (TheLogger, EditableSetRow) so the empty-means-null trap has one
// home.

export function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
