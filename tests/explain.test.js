// v0.116.0 «Knöpfe neu» (N1–N4): what the explanation bubble shows and where it goes.
import { describe, it, expect } from 'vitest';
import { explainFor, place, hasWords, EXPLAIN, explain } from '../src/lib/ui/explain.js';
import DE from '../src/lib/i18n/de/index.js';

const el = (attrs = {}, text = '') => ({ getAttribute: (k) => attrs[k] ?? null, textContent: text });

describe('explainFor: what a button says', () => {
  it('its own explanation with the context line; «off» says nothing', () => {
    expect(explainFor(el({ 'data-explain': 'Als erledigt markieren', 'data-explain-sub': 'Gabel · heute' }, 'Erledigt'))).toEqual({ title: 'Als erledigt markieren', sub: 'Gabel · heute' });
    expect(explainFor(el({ 'data-explain': 'off', 'aria-label': 'x' }, ''))).toBeNull();
  });
  it('a button with only a symbol explains itself with its name (N3 rule 5)', () => {
    expect(explainFor(el({ 'aria-label': 'Weitere Aktionen' }, '•••'))).toEqual({ title: 'Weitere Aktionen', sub: '' });
    expect(explainFor(el({ 'aria-label': 'Schliessen' }, '×'))).toEqual({ title: 'Schliessen', sub: '' });
    // a button with words needs no bubble that repeats them
    expect(explainFor(el({ 'aria-label': 'Speichern' }, 'Speichern'))).toBeNull();
  });
  it('a title counts only for a long press (the computer shows the browser tooltip)', () => {
    expect(explainFor(el({ title: 'Velomech' }, 'Velomech'))).toBeNull();
    expect(explainFor(el({ title: 'Velomech' }, 'Velomech'), true)).toEqual({ title: 'Velomech', sub: '' });
  });
  it('words: two letters or more', () => {
    expect(hasWords('•••')).toBe(false);
    expect(hasWords('×')).toBe(false);
    expect(hasWords('Ok')).toBe(true);
  });
});

describe('place: under the button, inside the screen', () => {
  const btn = { left: 300, right: 428, top: 100, bottom: 144, width: 128, height: 44 };
  const box = { width: 220, height: 50 };
  it('computer: right edge at the button’s right edge, 10 px below', () => {
    expect(place(btn, box, 1440, 900)).toMatchObject({ left: 208, top: 154, above: false });
  });
  it('phone: centred, never past the edge', () => {
    expect(place({ ...btn, left: 2, right: 130 }, box, 390, 844, true).left).toBe(8);
    expect(place({ ...btn, left: 300, right: 388 }, box, 390, 844, true).left).toBe(162);
  });
  it('above the button when there is no room below', () => {
    expect(place({ ...btn, top: 820, bottom: 864 }, box, 1440, 900)).toMatchObject({ top: 760, above: true });
  });
});

describe('N4: every explanation has a German text', () => {
  it('each text of EXPLAIN is translated', () => {
    for (const [key, text] of Object.entries(EXPLAIN)) expect(DE[text], `${key}: ${text}`).toBeTruthy();
    expect(explain('nope')).toBe('');
  });
});
