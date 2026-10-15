// FE1, FE13, FE14, FE16 (Noah 13.10.2026): the logic of lib/daumen.js, and that the CSS signs and the
// German sentences follow it (read from the source, no copies).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SIGN, signFor, FIELD_HELP, isTypingField, nextField, hintsFor, numberMode } from '../src/lib/daumen.js';
import DE from '../src/lib/i18n/de/index.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('FE13 Farbe nie allein: the signs', () => {
  it('ok has ✓, warn and bad have !, a neutral tone none', () => {
    expect(signFor('ok')).toBe('✓');
    expect(signFor('warn')).toBe('!');
    expect(signFor('bad')).toBe('!');
    expect(signFor('act')).toBe('');
    expect(signFor(undefined)).toBe('');
  });
  it('the pills and dots of app.css show the same signs, with an empty alternative text', () => {
    const css = read('src/app.css');
    const rule = (sel) => {
      const i = css.lastIndexOf(`${sel}::before`);
      expect(i, sel).toBeGreaterThan(-1);
      return css.slice(i, css.indexOf('}', i));
    };
    expect(rule('.pill.bad:not([data-nosign])')).toContain(`content: '${SIGN.bad}' / ''`);
    expect(rule('.udot.ok')).toContain(`content: '${SIGN.ok}' / ''`);
    expect(rule('.udot')).toContain(`content: '${SIGN.warn}' / ''`);
    // the first pill rule gives ✓ to all three, the second ! to warn and bad
    const ok = css.slice(css.indexOf('.pill.ok:not([data-nosign])::before'));
    expect(ok.slice(0, ok.indexOf('}'))).toContain(`content: '${SIGN.ok}' / ''`);
    expect(read('src/lib/trip/trip.css')).toContain(`content: '${SIGN.warn}' / ''`);
  });
  it('a data-sign shows its sign with an empty alternative text', () => {
    expect(read('src/lib/ui/fe-seiten.css')).toContain("content: attr(data-sign) / ''");
  });
});

describe('FE14 «?» an Ort und Stelle: the sentences', () => {
  it('every sentence is short, ends with a full stop and has its German', () => {
    const keys = Object.keys(FIELD_HELP);
    expect(keys.length).toBeGreaterThanOrEqual(8);
    for (const k of keys) {
      const en = FIELD_HELP[k];
      expect(en.split(/\s+/).length, k).toBeLessThanOrEqual(25);
      expect(en.endsWith('.'), k).toBe(true);
      expect(DE[en], k).toBeTruthy();
    }
    expect(DE.Explain).toBe('Erklärung');
  });
});

describe('FE16 Passende Handy-Tastatur', () => {
  const field = (type = 'text', o = {}) => ({ tagName: 'INPUT', type, disabled: false, readOnly: false, checkVisibility: () => o.shown !== false, ...o });
  it('only shown, typed inputs count as fields', () => {
    expect(isTypingField(field())).toBe(true);
    expect(isTypingField(field('number'))).toBe(true);
    expect(isTypingField(field('checkbox'))).toBe(false);
    expect(isTypingField(field('date'))).toBe(false);
    expect(isTypingField(field('text', { shown: false }))).toBe(false);
    expect(isTypingField(field('text', { readOnly: true }))).toBe(false);
    expect(isTypingField(field('text', { disabled: true }))).toBe(false);
    expect(isTypingField({ tagName: 'TEXTAREA', type: 'textarea' })).toBe(false);
    expect(isTypingField(field('text', { closest: () => ({}) }))).toBe(false); // inside data-weiter="off"
    expect(isTypingField(null)).toBe(false);
  });
  it('Enter goes to the next field; the last one has none', () => {
    const [a, b, c] = [field(), field(), field()];
    expect(nextField([a, b, c], a)).toBe(b);
    expect(nextField([a, b, c], b)).toBe(c);
    expect(nextField([a, b, c], c)).toBeNull();
    expect(nextField([a, b], c)).toBeNull();
  });
  it('the keyboard says «Weiter» on every field but the last, «Fertig» there', () => {
    expect(hintsFor(3)).toEqual(['next', 'next', 'done']);
    expect(hintsFor(1)).toEqual(['done']);
    expect(hintsFor(0)).toEqual([]);
  });
  it('a number field opens the number pad, unless it may be below zero', () => {
    const num = (attrs) => ({ type: 'number', getAttribute: (k) => attrs[k] ?? null });
    expect(numberMode(num({ min: '1' }))).toBe('numeric');
    expect(numberMode(num({ min: '0', step: '0.1' }))).toBe('decimal');
    expect(numberMode(num({ min: '0', step: 'any' }))).toBe('decimal');
    expect(numberMode(num({ min: '-30' }))).toBeNull();
    expect(numberMode(num({}))).toBeNull();
    expect(numberMode({ type: 'text', getAttribute: () => '1' })).toBeNull();
  });
});
