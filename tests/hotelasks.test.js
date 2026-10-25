import { describe, it, expect } from 'vitest';
import { ANSWERS, askKey, asksOf, addAsk, lastAsk, answerAsk, booked } from '../src/lib/race/ride/asks.js';
import DE from '../src/lib/i18n/de/index.js';

const h1 = { id: 'n1', name: 'test_data_gtp_ Gasthof', km: 210 };
const h2 = { name: 'test_data_gtp_ Hostel', km: 214.4 };
const now = Date.parse('2026-10-09T13:20:00Z');

describe('Hotels asked tonight (UC-120-I1)', () => {
  it('keeps who was asked, newest first, by id or name and km', () => {
    let l = addAsk([], h1, 'call', now);
    l = addAsk(l, h2, 'mail', now + 6e4);
    expect(l.map((a) => a.key)).toEqual(['test_data_gtp_ Hostel@214', 'n1']);
    expect(askKey(h2)).toBe('test_data_gtp_ Hostel@214');
    expect(lastAsk(l, h1)).toMatchObject({ how: 'call', answer: '' });
    expect(lastAsk([], h1)).toBeNull();
  });
  it('an answer is set and taken back; a yes means a bed is booked', () => {
    let l = addAsk([], h1, 'call', now);
    expect(booked(l)).toBeNull();
    l = answerAsk(l, h1, 'yes');
    expect(booked(l)).toMatchObject({ key: 'n1' });
    expect(answerAsk(l, h1, 'yes')[0].answer).toBe('');
    expect(answerAsk(l, h2, 'no')).toEqual(asksOf(l));
  });
  it('broken rows are left out; every answer has German', () => {
    expect(asksOf([null, { key: 'x' }, { key: 'y', at: 'z', how: 'fax', answer: 'maybe' }])).toEqual([{ key: 'y', name: '', at: 'z', how: 'call', answer: '' }]);
    for (const a of ANSWERS) expect(DE[a.name], a.name).toBeTruthy();
  });
});
