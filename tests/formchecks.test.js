// Einheitliche Formulare (Noah 19.10.2026): the shared field checks of ui/formchecks.js and their German texts.
import { describe, it, expect } from 'vitest';
import { checkField, checkAll, readNumber, endBeforeStart } from '../src/lib/ui/formchecks.js';
import de from '../src/lib/i18n/de/formular.js';
import DE from '../src/lib/i18n/de/index.js';

const fill = (s, v = {}) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const tDe = (en, v) => fill(DE[en] ?? en.replace(/\|[a-z]+$/, ''), v);

describe('readNumber', () => {
  it('reads numbers as people type them', () => {
    expect(readNumber('1,5')).toBe(1.5);
    expect(readNumber("1'200")).toBe(1200);
    expect(readNumber('1 200')).toBe(1200);
    expect(readNumber('')).toBe(null);
    expect(readNumber('zwei')).toBeNaN();
  });
});

describe('checkField', () => {
  it('a required field that is empty asks for it, with the example', () => {
    expect(checkField('  ', { field: 'einen Namen', example: 'Jura-Wochenende', required: true }, tDe)).toBe('Gib einen Namen ein, zum Beispiel Jura-Wochenende.');
    expect(checkField(null, { field: 'ein Velo', kind: 'choice', required: true }, tDe)).toBe('Wähle ein Velo.');
  });
  it('an optional field may stay empty, and says so when it is wrong', () => {
    expect(checkField('', { field: 'Tage', kind: 'int', min: 1, max: 60 }, tDe)).toBe('');
    expect(checkField('70', { field: 'Tage', kind: 'int', min: 1, max: 60, example: '2' }, tDe)).toBe('Tage: ganze Zahl von 1 bis 60, zum Beispiel 2. Oder leer lassen.');
  });
  it('a required number out of range gives no «leave it empty»', () => {
    expect(checkField('0', { field: 'Tage', kind: 'int', min: 1, max: 60, example: '2', required: true }, tDe)).toBe('Tage: ganze Zahl von 1 bis 60, zum Beispiel 2.');
    expect(checkField('1.5', { field: 'Tage', kind: 'int', min: 1, max: 60, required: true }, tDe)).toBe('Tage: ganze Zahl von 1 bis 60.');
    expect(checkField('12', { field: 'Tage', kind: 'int', min: 1, max: 60, required: true }, tDe)).toBe('');
  });
  it('decimal numbers, e-mail, date and length', () => {
    expect(checkField('1,6', { field: 'Druck', kind: 'number', min: 0.5, max: 5 }, tDe)).toBe('');
    expect(checkField('x', { field: 'Betrag', kind: 'number', example: '80.00' }, tDe)).toBe('Betrag: nur eine Zahl, zum Beispiel 80.00. Oder leer lassen.');
    expect(checkField('a@b', { field: 'E-Mail', kind: 'email' }, tDe)).toBe('E-Mail: eine E-Mail-Adresse wie name@beispiel.ch.');
    expect(checkField('2026-10-21', { field: 'Wann', kind: 'date' }, tDe)).toBe('');
    expect(checkField('abcdef', { field: 'Name', maxLen: 5 }, tDe)).toBe('Name: höchstens 5 Zeichen.');
  });
  it('English without a translation drops the context mark', () => {
    expect(checkField('', { field: 'a name', required: true })).toBe('Enter {field}.|form'.replace('{field}', 'a name').replace('|form', ''));
  });
});

describe('checkAll', () => {
  it('returns only the wrong fields', () => {
    const errs = checkAll({ name: ['', { field: 'einen Namen', required: true }], days: ['2', { field: 'Tage', kind: 'int', min: 1, max: 60, required: true }] }, tDe);
    expect(Object.keys(errs)).toEqual(['name']);
  });
  it('end before start', () => {
    expect(endBeforeStart('2026-10-21', '2026-10-20')).toBe(true);
    expect(endBeforeStart('2026-10-21', '')).toBe(false);
  });
});

describe('German texts', () => {
  it('every rule text has a German entry in de/index.js', () => {
    for (const k of Object.keys(de)) expect(DE[k]).toBe(de[k]);
  });
  it('optional fields read «freiwillig» (Noah 2a)', () => {
    expect(DE['optional|field']).toBe('freiwillig');
  });
});
