import { describe, it, expect, afterEach } from 'vitest';
import { t, tn, num, nameOf, lang, locale } from '../src/lib/i18n.svelte.js';
import DE from '../src/lib/i18n/de/index.js';

afterEach(() => (lang.v = 'en'));

describe('language', () => {
  it('English is the text itself, placeholders filled', () => {
    expect(t('Gear')).toBe('Gear');
    expect(t('{n} to do', { n: 3 })).toBe('3 to do');
    expect(t('Done|task')).toBe('Done');
  });

  it('German from the dictionary, unknown texts stay English', () => {
    lang.v = 'de';
    expect(t('Gear')).toBe('Ausrüstung');
    expect(t('{n} to do', { n: 3 })).toBe('3 offen');
    expect(t('Done|task')).toBe('Erledigt');
    expect(t('Done')).toBe('Fertig');
    expect(t('Some text nobody wrote')).toBe('Some text nobody wrote');
    expect(locale()).toBe('de-CH');
  });

  it('one or many, numbers, item names', () => {
    expect(tn(1, '{n} item', '{n} items')).toBe('1 item');
    expect(num(1460)).toBe('1,460');
    expect(nameOf({ name: 'Rain jacket', nameDe: 'Regenjacke' })).toBe('Rain jacket');
    lang.v = 'de';
    expect(num(1460)).toMatch(/^1.460$/);
    expect(nameOf({ name: 'Rain jacket', nameDe: 'Regenjacke' })).toBe('Regenjacke');
    expect(nameOf({ name: 'Bib shorts' })).toBe('Bib shorts');
  });

  it('every German text keeps the placeholders of its English key, no ß', () => {
    const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    const bad = Object.entries(DE).filter(([en, de]) => ph(en) !== ph(de) || /ß/.test(de));
    expect(bad).toEqual([]);
  });
});
