import { describe, it, expect } from 'vitest';
import { ideasOf, ideasRecOf, setNot, unsetNot, setLast, learnedOf, daysBetween, TOUR_FEATURE, ALMOST, LEARNED_DAYS } from '../src/lib/home/ideen.js';
import { discoverList, discoverOf, putOff } from '../src/lib/home/discover.js';
import { FEATURES } from '../src/lib/features.js';

const today = '2026-11-23';
const star = { id: 'a1:m1', actId: 'a1', left: 1, unit: '', value: 49, target: 50, progress: 0.98, name: 'Meditation · Hingebungsvoll' };

describe('«Heute entdecken»: the ideas of the day', () => {
  it('reads its record safely', () => {
    expect(ideasRecOf(null)).toEqual({ not: {}, last: null });
    expect(ideasRecOf({ not: { a: '2026-11-01', b: 3 }, last: { day: '2026-11-22', id: 'x' } })).toEqual({ not: { a: '2026-11-01' }, last: { day: '2026-11-22', id: 'x' } });
    expect(unsetNot(setNot(ideasRecOf(null), 'a', today), 'a').not).toEqual({});
    const r = setLast(ideasRecOf(null), today, 'x');
    expect(setLast(r, today, 'x')).toBe(r);
  });
  it('puts a star that is almost there first, then the tour suggestions, then the rest', () => {
    const l = ideasOf({ moment: 'lust', today, star, dreams: 3 });
    expect(l[0]).toMatchObject({ kind: 'star', id: 'star:a1:m1' });
    expect(l[1]).toMatchObject({ kind: 'content', id: TOUR_FEATURE, dreams: 3 });
    expect(l.slice(2).every((x) => x.kind === 'feature')).toBe(true);
    expect(l.some((x) => x.kind === 'feature' && x.id === TOUR_FEATURE)).toBe(false);
  });
  it('shows a star only when it is close, and a news line only while it is new', () => {
    expect(ideasOf({ moment: 'lust', today, star: { ...star, progress: ALMOST - 0.1 } }).some((x) => x.kind === 'star')).toBe(false);
    expect(ideasOf({ moment: 'lust', today, star: { ...star, progress: 1 } }).some((x) => x.kind === 'star')).toBe(false);
    expect(ideasOf({ moment: 'lust', today }).some((x) => x.kind === 'new')).toBe(false);
    expect(ideasOf({ moment: 'lust', today, news: { version: '9.9.9', title: '', text: '' } }).some((x) => x.kind === 'new')).toBe(true);
  });
  it('leaves out what you opened, put off today or sent away, and nothing on the road suggests tours', () => {
    expect(ideasOf({ moment: 'lust', today, used: new Set([TOUR_FEATURE]) }).some((x) => x.id === TOUR_FEATURE)).toBe(false);
    expect(ideasOf({ moment: 'lust', today, notForMe: { [TOUR_FEATURE]: { why: '', at: today } } }).some((x) => x.id === TOUR_FEATURE)).toBe(false);
    const rec = putOff(discoverOf(null), TOUR_FEATURE, today);
    expect(ideasOf({ moment: 'lust', today, rec }).some((x) => x.id === TOUR_FEATURE)).toBe(false);
    expect(ideasOf({ moment: 'lust', today: '2026-11-24', rec }).some((x) => x.id === TOUR_FEATURE)).toBe(true);
    expect(ideasOf({ moment: 'lust', today, star, ir: setNot(ideasRecOf(null), 'star:a1:m1', today) }).some((x) => x.kind === 'star')).toBe(false);
    expect(ideasOf({ moment: 'unterwegs', today }).some((x) => x.id === TOUR_FEATURE)).toBe(false);
  });
  it('is empty when the row is switched off', () => {
    expect(ideasOf({ moment: 'lust', today, star, rec: { off: true, later: {} } })).toEqual([]);
  });
  it('never puts the same idea first two days in a row', () => {
    const first = ideasOf({ moment: 'lust', today, star })[0].id;
    const next = ideasOf({ moment: 'lust', today: '2026-11-24', star, ir: setLast(ideasRecOf(null), today, first) });
    expect(next[0].id).not.toBe(first);
    expect(next.at(-1).id).toBe(first);
    // the same day the idea stays
    expect(ideasOf({ moment: 'lust', today, star, ir: setLast(ideasRecOf(null), today, first) })[0].id).toBe(first);
  });
  it('lists up to n functions of the moment, the day pick first', () => {
    const l = discoverList({ moment: 'packen', today }, 3);
    expect(l.length).toBe(3);
    expect(new Set(l.map((f) => f.id)).size).toBe(3);
    expect(discoverList({ moment: 'packen', today, rec: { off: true, later: {} } })).toEqual([]);
  });
  it('knows the tour suggestions as a function of the catalogue', () => {
    expect(FEATURES.some((f) => f.id === TOUR_FEATURE)).toBe(true);
  });
  it('asks for the debrief of the tour you just came back from, right after a star', () => {
    const back = { id: 'tr1', tripTitle: 'Jura-Runde', href: '#/trips/tr1/debrief' };
    const l = ideasOf({ moment: 'zurueck', today, back, star });
    expect(l[0].kind).toBe('star');
    expect(l[1]).toMatchObject({ kind: 'back', id: 'back:tr1', tripTitle: 'Jura-Runde' });
    expect(ideasOf({ moment: 'lust', today }).some((x) => x.kind === 'back')).toBe(false);
    // «Not for me» keeps it away for good
    expect(ideasOf({ moment: 'zurueck', today, back, ir: setNot(ideasRecOf(null), 'back:tr1', today) }).some((x) => x.kind === 'back')).toBe(false);
  });
  it('names what the app learned from your debriefs, newest first, only the last weeks', () => {
    const mk = (id, day, extra = {}) => ({ id, rule: `Rule ${id}`, createdAt: `${day}T08:00:00.000Z`, ...extra });
    expect(daysBetween('2026-11-02T10:00:00Z', today)).toBe(21);
    expect(LEARNED_DAYS).toBe(21);
    expect(learnedOf([], today)).toBe(null);
    expect(learnedOf([mk('old', '2026-09-01')], today)).toBe(null);
    expect(learnedOf([mk('a', '2026-11-20'), mk('b', '2026-11-22'), mk('c', '2026-11-22', { archivedAt: '2026-11-23' }), { id: 'e', rule: '  ', createdAt: '2026-11-22' }], today)).toEqual({ id: 'b', rule: 'Rule b', n: 2 });
    const l = ideasOf({ moment: 'lust', today, learned: { id: 'b', rule: 'Rule b', n: 2 } });
    expect(l.find((x) => x.kind === 'learned')).toMatchObject({ id: 'learned:b', n: 2 });
    // after the tour suggestions, before the news
    const all = ideasOf({ moment: 'lust', today, learned: { id: 'b', rule: 'r', n: 1 }, news: { version: '1.0.0', title: '', text: '' } }).map((x) => x.kind);
    expect(all.indexOf('content')).toBeLessThan(all.indexOf('learned'));
    expect(all.indexOf('learned')).toBeLessThan(all.indexOf('new'));
  });
});
