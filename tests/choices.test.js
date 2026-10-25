import { describe, it, expect } from 'vitest';
import { CHOICE_STATES, linkOf, choiceOf, choicesOf, activeChoices, droppedChoices, cancelSoon, upsert, removeChoice, moveChoice } from '../src/lib/reise/choices.js';
import DE from '../src/lib/i18n/de/index.js';

const a = { id: 'a', name: 'test_data_gtp_ Hotel Post', link: 'example.org/post', price: '120,50', cancelBy: '2026-10-11', terms: 'test_data_gtp_ gratis storno', state: 'open' };
const b = { id: 'b', name: 'test_data_gtp_ Hostel', state: 'dropped', why: 'test_data_gtp_ zu laut' };

describe('Travel options to compare (UC-032-I1, I2)', () => {
  it('makes an option safe', () => {
    expect(choiceOf(a)).toMatchObject({ link: 'https://example.org/post', price: 120.5, cancelBy: '2026-10-11', state: 'open' });
    expect(linkOf('javascript:alert(1)')).toBe('');
    expect(choiceOf({ id: 'x', name: ' ' })).toBeNull();
    expect(choiceOf({ id: 'x', name: 'n', state: 'weird', price: '-3' })).toMatchObject({ state: 'open', price: null });
  });
  it('keeps dropped ones apart, adds, changes, moves and removes', () => {
    let l = upsert([], a);
    l = upsert(l, b);
    expect(activeChoices(l).map((c) => c.id)).toEqual(['a']);
    expect(droppedChoices(l)[0].why).toBe('test_data_gtp_ zu laut');
    l = upsert(l, { ...a, state: 'chosen' });
    expect(choicesOf(l)[0].state).toBe('chosen');
    expect(moveChoice(l, 'b', 0).map((c) => c.id)).toEqual(['b', 'a']);
    expect(removeChoice(l, 'a').map((c) => c.id)).toEqual(['b']);
  });
  it('the free cancellation ending soon is worth a look', () => {
    expect(cancelSoon(choiceOf(a), '2026-10-09')).toBe(true);
    expect(cancelSoon(choiceOf(a), '2026-10-01')).toBe(false);
    expect(cancelSoon(choiceOf(a), '2026-10-12')).toBe(false);
    for (const s of CHOICE_STATES) expect(DE[s.name], s.name).toBeTruthy();
  });
});
