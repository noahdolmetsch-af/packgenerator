import { describe, it, expect } from 'vitest';
import { EXTRA_QUESTIONS, extraContext, extraList, extraForTrip, setExtraOn, renameExtra, addExtra, dropExtra, orderExtra, futureFor } from '../src/lib/lernen/zusatzfragen.js';

const trip = { id: 't2', title: 'Jura Runde', startDate: '2026-08-01', days: 2, bikeId: 'bike-x', route: { gainM: 1200 }, entries: [], forecast: { days: [{ date: '2026-08-01', rainMm: 5 }] } };

describe('Zusatzfragen (#34)', () => {
  it('has 10 questions', () => expect(EXTRA_QUESTIONS).toHaveLength(10));
  it('the fitting ones come first and two show open', () => {
    const ctx = extraContext(trip);
    expect(ctx).toEqual({ days: 2, rain: true, climbM: 1200, bike: true, items: 0 });
    const s = extraForTrip(null, ctx, {}, 2);
    expect(s.open.map((q) => q.id)).toEqual(['tag', 'regen']);
    expect(s.more).toHaveLength(8);
    expect(s.more.slice(0, 2).map((q) => q.id)).toEqual(['hart', 'velo']);
  });
  it('an answered question always shows open; first = 0 folds all', () => {
    const s = extraForTrip(null, extraContext({ days: 1 }), { essen: 'Rösti' }, 0);
    expect(s.open.map((q) => q.id)).toEqual(['essen']);
    expect(s.more).toHaveLength(9);
  });
  it('switch off, rename, add, delete, order', () => {
    let c = setExtraOn(null, 'moment', false);
    expect(extraList(c).find((q) => q.id === 'moment').on).toBe(false);
    c = renameExtra(c, 'anders', 'Was nächstes Mal anders?');
    expect(extraList(c).find((q) => q.id === 'anders')).toMatchObject({ text: 'Was nächstes Mal anders?', edited: true });
    c = renameExtra(c, 'anders', '');
    expect(extraList(c).find((q) => q.id === 'anders').edited).toBe(false);
    c = addExtra(c, 'Wie war der Kaffee?', new Date('2026-08-03T10:00:00Z'));
    const own = extraList(c).at(-1);
    expect(own).toMatchObject({ text: 'Wie war der Kaffee?', own: true, on: true });
    c = orderExtra(c, [own.id, 'moment']);
    expect(extraList(c)[0].id).toBe(own.id);
    c = dropExtra(c, own.id);
    expect(extraList(c).some((q) => q.id === own.id)).toBe(false);
    c = dropExtra(c, 'essen');
    expect(extraList(c).find((q) => q.id === 'essen').on).toBe(false);
  });
});

describe('Nachricht ans zukünftige Ich (#258)', () => {
  const trips = [
    { id: 'a', title: 'Frühling', startDate: '2026-04-01' },
    { id: 'b', title: 'Sommer', startDate: '2026-07-01' },
    { id: 'c', title: 'Herbst', startDate: '2026-10-01' },
  ];
  const debriefs = [
    { tripId: 'a', future: { text: 'Warme Handschuhe!', at: '2026-04-03T10:00:00Z' } },
    { tripId: 'b', future: { text: '  Mehr trinken ', at: '2026-07-03T10:00:00Z' } },
    { tripId: 'c', future: { text: 'Später', at: '2026-10-03T10:00:00Z' } },
  ];
  it('shows the messages of earlier trips, newest first, until read', () => {
    expect(futureFor('c', trips, debriefs).map((m) => m.text)).toEqual(['Mehr trinken', 'Warme Handschuhe!']);
    expect(futureFor('c', trips, debriefs, ['b']).map((m) => m.fromId)).toEqual(['a']);
    expect(futureFor('a', trips, debriefs)).toEqual([]);
  });
});
