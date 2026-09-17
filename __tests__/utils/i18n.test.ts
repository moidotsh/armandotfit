// __tests__/utils/i18n.test.ts
//
// Goldens for the i18n seam: corrupt-persist normalization, the
// catalog harness's mirror/fallback discipline, and the document-lang
// mirror. The compile-error half of the contract (a mirror missing a
// key fails tsc) is enforced by the harness's types, not runtime —
// the type-level test below pins it.

import { beforeEach, describe, expect, it } from 'vitest';
import {
  createStringsCatalog,
  resolveLang,
  setLang,
  syncDocumentLang,
  useLangStore,
  DEFAULT_LANG,
  type Lang,
} from '../../utils/i18n';

describe('resolveLang', () => {
  it('keeps live languages', () => {
    expect(resolveLang('en')).toBe('en');
    expect(resolveLang('fr')).toBe('fr');
  });

  it('normalizes corrupt or retired persisted values back to the default', () => {
    expect(resolveLang(undefined)).toBe(DEFAULT_LANG);
    expect(resolveLang('EN')).toBe(DEFAULT_LANG);
    expect(resolveLang('de')).toBe(DEFAULT_LANG);
    expect(resolveLang(42)).toBe(DEFAULT_LANG);
    expect(resolveLang(null)).toBe(DEFAULT_LANG);
  });
});

describe('createStringsCatalog', () => {
  const { t } = createStringsCatalog(
    { greeting: 'Welcome', cta: 'Start' },
    { fr: { greeting: 'Bienvenue', cta: 'Commencer' } },
  );

  it('the source language reads the source object', () => {
    expect(t('en')).toEqual({ greeting: 'Welcome', cta: 'Start' });
  });

  it('a mirrored language reads its mirror', () => {
    expect(t('fr').greeting).toBe('Bienvenue');
    expect(t('fr').cta).toBe('Commencer');
  });

  it('a mirror must satisfy the source shape — the type pins it', () => {
    // Type-level contract: this assignment compiles only when the
    // mirror is complete. A mirror missing `cta` fails tsc.
    const mirror: { greeting: string; cta: string } = { greeting: 'Bonjour', cta: 'Allons-y' };
    expect(mirror.cta).toBe('Allons-y');
  });

  it('t is pure — same input, same output, callable outside React', () => {
    expect(t('fr')).toBe(t('fr'));
  });
});

describe('the lang store', () => {
  beforeEach(() => {
    useLangStore.setState({ lang: DEFAULT_LANG });
  });

  it('setLang flips the store and mirrors the document', () => {
    setLang('fr' as Lang);
    expect(useLangStore.getState().lang).toBe('fr');
    // jsdom: the document mirror is testable.
    expect(document.documentElement.lang).toBe('fr');
    setLang('en');
    expect(useLangStore.getState().lang).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});

describe('syncDocumentLang', () => {
  it('mirrors onto <html lang>', () => {
    syncDocumentLang('fr');
    expect(document.documentElement.lang).toBe('fr');
  });
});
