// «Wechsel-Varianten» (Noah 23.11.2026 «2a»): other wordings of the questions that are on at the start. Fictional days only.
import { describe, it, expect } from 'vitest';
import DE from '../src/lib/i18n/de/index.js';
import VARIANT_DE from '../src/lib/i18n/de/varianten.js';
import { VARIANTS, askVariant } from '../src/lib/abfragen/varianten.js';
import { QUESTIONS, QUESTION, ON_AT_START, configOf, setMainOnly } from '../src/lib/abfragen.js';

describe('the variants', () => {
  it('every question that is on at the start has two other wordings, nothing else has', () => {
    for (const id of Object.keys(VARIANTS)) expect(ON_AT_START.has(id), id).toBe(true);
    expect(Object.keys(VARIANTS)).toHaveLength(29);
    for (const [id, list] of Object.entries(VARIANTS)) {
      expect(QUESTION[id], id).toBeTruthy();
      expect(list, id).toHaveLength(2);
    }
    // every question on at the start except the ones added later has them
    expect([...ON_AT_START].filter((id) => !VARIANTS[id])).toEqual(expect.any(Array));
  });
  it('no wording is the same as another wording or the text of any question', () => {
    const texts = QUESTIONS.map((q) => q.text);
    const all = Object.values(VARIANTS).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const v of all) expect(texts).not.toContain(v);
  });
  it('every wording has a German text (Swiss spelling, no ß)', () => {
    for (const v of Object.values(VARIANTS).flat()) {
      expect(DE[v], v).toBeTruthy();
      expect(VARIANT_DE[v], v).toBeTruthy();
      expect(VARIANT_DE[v]).not.toMatch(/ß/);
    }
  });
});

describe('askVariant', () => {
  const q = QUESTION['erholung.schlaf'];
  it('is the same all day and changes from day to day, through all three wordings', () => {
    expect(askVariant(q, '2026-11-20')).toBe(askVariant(q, '2026-11-20'));
    const seen = new Set(['2026-11-20', '2026-11-21', '2026-11-22'].map((d) => askVariant(q, d)));
    expect(seen).toEqual(new Set([q.text, ...VARIANTS[q.id]]));
  });
  it('«Always the main question» gives the main text', () => {
    for (const d of ['2026-11-20', '2026-11-21', '2026-11-22']) expect(askVariant(q, d, true)).toBe(q.text);
  });
  it('an own or a changed question and one without variants keep their words', () => {
    expect(askVariant({ ...q, edited: true, text: 'Mein Text' }, '2026-11-21')).toBe('Mein Text');
    expect(askVariant({ id: 'own-1', own: true, text: 'Kaffee?' }, '2026-11-21')).toBe('Kaffee?');
    expect(askVariant(QUESTION['spass.gelacht'], '2026-11-21')).toBe(QUESTION['spass.gelacht'].text);
  });
});

describe('the switch', () => {
  it('is off at the start, can be set and is kept with the rest', () => {
    expect(configOf(null).mainOnly).toBe(false);
    const on = setMainOnly(null, true);
    expect(configOf(on).mainOnly).toBe(true);
    expect(configOf(setMainOnly(on, false)).mainOnly).toBe(false);
    expect(configOf({ mainOnly: 'yes' }).mainOnly).toBe(false);
  });
});
