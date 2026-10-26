// Paket «Touren b» (996 Ideen 50–58): the pure parts.
import { describe, it, expect } from 'vitest';
import { packStories, storyOff } from '../src/lib/tourenb/stories.js';
import { breakCheckText, withBreakCheck, BREAK_CHECKS } from '../src/lib/tourenb/breakcheck.js';
import { BREAK_KINDS, breakdownsOf } from '../src/lib/tourlernen/tourlernen.js';
import { dayClips, clipDays, moveClip, dateOfDay } from '../src/lib/tourenb/tagclips.js';
import { INTENTS, whenChoices, startAnswers, pickAnswer, proposal, intentRecord, answerAfter, dropAsk } from '../src/lib/tourenb/absicht.js';
import { untilOf, ruleHolds, untilOver, setUntil, rulesOver, ruleOff, seasonEnd } from '../src/lib/tourenb/ruleuntil.js';

const voice = (id) => ({ id, src: 'data:audio/webm;base64,AAAA', s: 12, at: '2026-10-26T10:00:00Z' });

describe('51 little stories while packing', () => {
  const items = { a: { id: 'a', name: 'Pump', inputs: { voices: [voice('v1')] } }, b: { id: 'b', name: 'Tube' }, c: { id: 'c', name: 'Tool', inputs: { voices: [voice('v2')] } } };
  const trip = { id: 't', entries: [{ itemId: 'b' }, { itemId: 'a' }, { itemId: 'c' }, { itemId: 'a' }] };
  it('lists the items on the trip with a voice note, in list order, once', () => {
    expect(packStories(trip, items).map((s) => s.item.id)).toEqual(['a', 'c']);
  });
  it('leaves out what was taken out for this trip, and brings it back', () => {
    const off = storyOff(trip, 'a');
    expect(packStories({ ...trip, storiesOff: off }, items).map((s) => s.item.id)).toEqual(['c']);
    expect(storyOff({ storiesOff: off }, 'a', true)).toEqual([]);
  });
});

describe('53 a check from a real breakdown', () => {
  it('has a check for every kind of breakdown', () => {
    for (const k of BREAK_KINDS) expect(BREAK_CHECKS[k.key]).toBeTruthy();
  });
  it('suggests the check of the kind with the part', () => {
    expect(breakCheckText('flat', ' rear tube ')).toBe('Check the tyres and the sealant: rear tube');
    expect(breakCheckText('nope')).toBe(BREAK_CHECKS.other);
  });
  it('adds the row to the saved standard once, or starts from the suggestion', () => {
    const a = withBreakCheck(null, 'bikepacking', 'Kette prüfen', { now: 1 });
    expect(a.list.at(-1)).toEqual({ id: a.id, label: 'Kette prüfen' });
    expect(a.list.length).toBeGreaterThan(1);
    const b = withBreakCheck(a.list, 'bikepacking', 'kette prüfen ', { now: 2 });
    expect(b.list).toHaveLength(a.list.length);
    expect(b.id).toBe(a.id);
    expect(withBreakCheck([{ id: 'x', label: 'X', done: true }], 'ski', '').list).toEqual([{ id: 'x', label: 'X' }]);
  });
  it('the breakdown keeps the id of its check', () => {
    expect(breakdownsOf({ breakdowns: [{ id: 'b1', kind: 'flat', checkId: 'std-break-1' }] })[0].checkId).toBe('std-break-1');
  });
});

describe('50 a rule with an end', () => {
  const trips = [
    { id: 't1', startDate: '2026-10-20', days: 2 },
    { id: 't2', startDate: '2026-10-30', days: 1 },
    { id: 't3', startDate: '2026-10-01', days: 1, finished: false },
  ];
  it('holds always, for one tour, or until a day', () => {
    expect(ruleHolds(null, trips[0])).toBe(true);
    expect(ruleHolds({ tripId: 't2' }, trips[1])).toBe(true);
    expect(ruleHolds({ tripId: 't2' }, trips[0])).toBe(false);
    expect(ruleHolds({ date: '2026-10-25' }, trips[0])).toBe(true);
    expect(ruleHolds({ date: '2026-10-25' }, trips[1])).toBe(false);
    expect(untilOf({ date: 'soon' })).toBe(null);
  });
  it('is over after the tour or the day', () => {
    expect(untilOver({ tripId: 't1' }, trips, '2026-10-21')).toBe(false);
    expect(untilOver({ tripId: 't1' }, trips, '2026-10-22')).toBe(true);
    expect(untilOver({ tripId: 'gone' }, trips, '2026-10-22')).toBe(true);
    expect(untilOver({ date: '2026-10-25' }, trips, '2026-10-25')).toBe(false);
    expect(untilOver({ date: '2026-10-25' }, trips, '2026-10-26')).toBe(true);
  });
  it('stores, asks and answers on the block record', () => {
    let v = setUntil([{ key: 'rain', name: 'Nass' }], 'rain', { tripId: 't1' });
    expect(v).toEqual([{ key: 'rain', name: 'Nass', until: { tripId: 't1' } }]);
    v = setUntil(v, 'cold', { date: '2027-04-30' });
    expect(rulesOver(v, trips, '2026-10-26').map((r) => r.key)).toEqual(['rain']);
    expect(setUntil(v, 'cold', null).some((s) => s.key === 'cold')).toBe(false);
    const off = ruleOff(v, 'rain');
    expect(off.find((s) => s.key === 'rain')).toEqual({ key: 'rain', name: 'Nass', rule: { on: false } });
    expect(rulesOver(off, trips, '2026-10-26')).toEqual([]);
  });
  it('offers the end of the season', () => {
    expect(seasonEnd('2026-06-10')).toEqual({ key: 'summer', date: '2026-09-30' });
    expect(seasonEnd('2026-10-26')).toEqual({ key: 'winter', date: '2027-04-30' });
    expect(seasonEnd('2026-02-01')).toEqual({ key: 'winter', date: '2026-04-30' });
  });
});

import { usedRows, setUsed, boughtOf, bookPlan, costItems, lastUse, countable } from '../src/lib/tourenb/verbrauch.js';
describe('58 book what was used', () => {
  const items = {
    bar: { id: 'bar', name: 'Bar', category: 'food', stock: 12, minStock: 4 },
    gel: { id: 'gel', name: 'Gel', category: 'food', stock: 6, minStock: 4 },
    cream: { id: 'cream', name: 'Cream', category: 'hygiene', minStock: 1 },
    tool: { id: 'tool', name: 'Tool', category: 'tools' },
    salt: { id: 'salt', name: 'Salt', category: 'food' },
  };
  const trip = { id: 't', startDate: '2026-10-20', days: 2, domain: 'bikepacking', entries: [{ itemId: 'bar', qty: 8 }, { itemId: 'gel', qty: 4 }, { itemId: 'tool' }, { itemId: 'cream' }, { itemId: 'salt' }], used: { bar: 5, gel: 4, salt: 1 } };
  it('counts food and supplies only, with what is left', () => {
    expect(countable(items.tool)).toBe(false);
    expect(usedRows(trip, items).map((r) => [r.item.id, r.taken, r.used, r.left])).toEqual([['bar', 8, 5, 3], ['gel', 4, 4, 0], ['cream', 1, 0, 1], ['salt', 1, 1, 0]]);
    expect(setUsed({ bar: 2 }, 'bar', 0)).toEqual({});
    expect(setUsed({}, 'gel', 3.4)).toEqual({ gel: 3 });
  });
  it('plans the stock, the shopping list and the costs', () => {
    const t2 = { ...trip, bought: [{ id: 'b1', name: ' Water tabs ', qty: 1, chf: '6.90' }, { id: 'b2', name: 'Bar', qty: 2, chf: null, itemId: 'bar' }, { id: '', name: 'x' }] };
    expect(boughtOf(t2).map((b) => [b.name, b.chf])).toEqual([['Water tabs', 6.9], ['Bar', null]]);
    const p = bookPlan(t2, items);
    expect(p.stock.map((s) => [s.item.id, s.from, s.to])).toEqual([['bar', 12, 9], ['gel', 6, 2]]);
    expect(p.shop.map((i) => i.id)).toEqual(['gel', 'salt']);
    expect(p.costs.map((b) => b.name)).toEqual(['Water tabs']);
    expect(costItems(p.costs, { day: '2026-10-21', now: 'n', ids: ['c1'] })[0]).toMatchObject({ id: 'c1', what: 'Water tabs', chf: 6.9, cur: 'CHF', paidBy: 'me', for: [] });
  });
  it('the next packing list sees the newest booked tour of the type', () => {
    const done = { ...trip, usedBooked: { at: 'x', opts: { hint: true } } };
    const next = { id: 'n', startDate: '2026-11-01', domain: 'bikepacking', entries: [{ itemId: 'bar', qty: 8 }] };
    expect(lastUse([done, next], next, 'bar')).toEqual({ used: 5, taken: 8, days: 2, title: '' });
    expect(lastUse([{ ...done, usedBooked: { opts: { hint: false } } }], next, 'bar')).toBe(null);
    expect(lastUse([trip], next, 'bar')).toBe(null);
  });
});

import { eatStops, startEat, eatOf, nextEat, eaten, snooze, nearStop, fuelStopsFor, eatPushItems, tripEat, GAP_MIN } from '../src/lib/unterwegs/essen.js';
describe('57 eat reminder at the planned stops', () => {
  const H = 36e5;
  const t0 = Date.UTC(2026, 9, 24, 7, 0);
  const fuel = [{ km: 42, name: 'Fuel', day: 0, h: 2.5, lat: 47.3, lon: 7.2 }, { km: 61, name: 'Inn', day: 0, h: 3.0 }, { km: 112, name: 'Shop', day: 0, h: 6.5 }, { km: 30, name: 'Next day', day: 1, h: 1 }];
  it('moves the stops of the day to the real start, with a hint in long gaps', () => {
    const list = eatStops(fuel, { day: 0, startMs: t0 });
    expect(list.filter((x) => !x.gap).map((x) => [x.name, (x.at - t0) / H])).toEqual([['Fuel', 2.5], ['Inn', 3], ['Shop', 6.5]]);
    // 0 → 2.5 h: a hint at 1 h (not at 2 h, only half an hour before the stop); 3 → 6.5 h: at 4 h and 5 h
    expect(list.filter((x) => x.gap).map((x) => (x.at - t0) / H)).toEqual([1, 4, 5]);
    expect(eatStops(fuel, { day: 0, startMs: t0, until: t0 + 2.6 * H }).filter((x) => !x.gap)).toHaveLength(1);
    expect(GAP_MIN).toBe(60);
  });
  it('the next reminder is the next stop; eaten and snoozed move on', () => {
    const v = startEat({ now: t0, mode: 'stops', stops: eatStops(fuel, { day: 0, startMs: t0 }) });
    const e = eatOf(v, t0);
    expect(e.mode).toBe('stops');
    expect((nextEat(e) - t0) / H).toBe(1);
    const e2 = eaten(e, t0 + 1.1 * H);
    expect((nextEat(e2) - t0) / H).toBe(2.5);
    const e3 = snooze(e2, t0 + 2 * H);
    expect((nextEat(e3) - t0) / H).toBeCloseTo(2 + 10 / 60);
    expect(eatPushItems(v, { title: 'T', body: 'B', stop: 'Stop {name}' }, t0 + 2.2 * H).map((x) => x.body)).toEqual(['Stop Fuel', 'Stop Inn', 'B', 'B', 'Stop Shop']);
    expect(eatOf(startEat({ now: t0, mode: 'stops', stops: [] }), t0).mode).toBeUndefined();
  });
  it('comes 500 m before a stop with a place, and that stop counts as done', () => {
    const e = eatOf(startEat({ now: t0, mode: 'stops', stops: [{ at: t0 + 2.5 * H, name: 'Fuel', lat: 47.3, lon: 7.2 }] }), t0);
    expect(nearStop(e, { lat: 47.303, lon: 7.2 })?.name).toBe('Fuel');
    expect(nearStop(e, { lat: 47.31, lon: 7.2 })).toBe(null);
    expect(nextEat(eaten(e, t0 + H, nearStop(e, { lat: 47.3, lon: 7.2 })))).toBe(null);
  });
  it('keeps the planned stops of a food plan and the mode of the tour', () => {
    const startMs = Date.UTC(2026, 9, 24);
    const plan = { sections: [{ toKm: 42, to: { name: 'Fuel', lat: 1, lon: 2 }, arriveMs: startMs + 10.5 * H }, { toKm: 90, to: null, arriveMs: startMs + 14 * H }, { toKm: 130, to: { name: 'Camp' }, arriveMs: startMs + 864e5 + 9 * H }] };
    expect(fuelStopsFor(plan, { startMs, startHour: 8 })).toEqual([{ km: 42, name: 'Fuel', day: 0, h: 2.5, lat: 1, lon: 2 }, { km: 130, name: 'Camp', day: 1, h: 1 }]);
    expect(tripEat({ eat: { every: 30, mode: 'stops' } })).toEqual({ on: true, every: 30, mode: 'stops' });
    expect(tripEat({})).toEqual({ on: true, every: 45 });
  });
});

import { placeOf, pointAtKm, notesHere, placeNotes } from '../src/lib/tourenb/placenote.js';
describe('55 a note at a later point of the route', () => {
  const route = { km: 20, line: Array.from({ length: 21 }, (_, i) => [47 + i * 0.009, 8]) };
  it('finds the point of the route at a km', () => {
    const p = pointAtKm(route, 10);
    expect(p.km).toBe(10);
    expect(p.lat).toBeCloseTo(47.09, 3);
    expect(pointAtKm({}, 3)).toBe(null);
    expect(pointAtKm(route, 99).km).toBe(20);
  });
  it('shows the note within 500 m on that tour, not when done or later', () => {
    const at2 = { tripId: 't', ...pointAtKm(route, 10) };
    const notes = [{ id: 'a', text: 'Water', at2 }, { id: 'b', text: 'Done', at2: { ...at2, done: true } }, { id: 'c', text: 'Later', at2: { ...at2, later: 2000 } }, { id: 'd', text: 'Other', at2: { ...at2, tripId: 'x' } }, { id: 'e', text: 'Plain' }];
    expect(notesHere(notes, 't', { lat: at2.lat - 0.003, lon: 8 }, 1000).map((x) => x.note.id)).toEqual(['a']);
    expect(notesHere(notes, 't', { lat: at2.lat - 0.003, lon: 8 }, 3000).map((x) => x.note.id)).toEqual(['a', 'c']);
    expect(notesHere(notes, 't', { lat: at2.lat - 0.01, lon: 8 }, 1000)).toEqual([]);
    expect(placeNotes(notes, 't').map((x) => x.note.id)).toEqual(['a', 'c']);
    expect(placeOf({ at2: { tripId: 't' } })).toBe(null);
  });
});

describe('56 your day to listen to', () => {
  const v = (id, at, text) => ({ id, src: 'data:audio/webm;base64,AAAA', s: 10, at, ...(text ? { text } : {}) });
  const route = { km: 38, line: [[47.0, 8.0], [47.0, 8.5]] };
  const trip = { id: 't', startDate: '2026-10-24', days: 2, route };
  const notes = [
    { id: 'n1', tripId: 't', day: 0, at: '2026-10-24T09:00:00Z', text: 'Coffee', inputs: { voices: [v('a', '2026-10-24T09:00:00Z')] } },
    { id: 'n2', tripId: 't', day: 1, at: '2026-10-25T08:00:00Z', inputs: { voices: [v('b', '2026-10-25T08:00:00Z', 'Rain')] } },
    { id: 'n3', tripId: 'other', day: 0, inputs: { voices: [v('c', '2026-10-24T07:00:00Z')] } },
  ];
  const places = [{ id: 'p1', kind: 'place', tripId: 't', at: '2026-10-24T08:00:00Z', lat: 47.0, lon: 8.25, inputs: { voices: [v('d', '2026-10-24T08:00:00Z')] } }];
  const diary = [{ id: 'f1', kind: 'diary', day: '2026-10-24', title: 'Evening', inputs: { voices: [v('e', '2026-10-24T18:00:00Z')] } }];
  const src = { notes, places, diary };
  it('gives the date of a tour day', () => {
    expect(dateOfDay(trip, 1)).toBe('2026-10-25');
  });
  it('collects the voice notes of one day from notes, places and diary, in time order', () => {
    const c = dayClips(trip, 0, src);
    expect(c.map((x) => x.from.voiceId)).toEqual(['d', 'a', 'e']);
    expect(c[0].km).toBe(19);
    expect(dayClips(trip, 1, src)[0].said).toBe('Rain');
  });
  it('lists only days with voice notes', () => {
    expect(clipDays(trip, src)).toEqual([
      { day: 0, n: 3, s: 30 },
      { day: 1, n: 1, s: 10 },
    ]);
  });
  it('keeps your own order', () => {
    const keys = dayClips(trip, 0, src).map((x) => x.key);
    const moved = moveClip(keys, keys[2], -1);
    expect(moved).toEqual([keys[0], keys[2], keys[1]]);
    expect(moveClip(keys, keys[0], -1)).toEqual(keys);
    expect(dayClips({ ...trip, clipOrder: { 0: moved } }, 0, src).map((x) => x.key)).toEqual(moved);
  });
});

describe('52 a tour from an intent', () => {
  it('offers five intents, each with «When?»', () => {
    expect(INTENTS.map((i) => i.key)).toEqual(['nature', 'visit', 'night', 'training', 'ride']);
    for (const i of INTENTS) expect(i.questions.some((q) => q.when)).toBe(true);
  });
  it('gives today, tomorrow and next Saturday as calendar days', () => {
    const w = whenChoices(new Date(2026, 9, 26, 10)); // a Monday
    expect(w.map((x) => x.day)).toEqual(['2026-10-26', '2026-10-27', '2026-10-31']);
    expect(whenChoices(new Date(2026, 9, 30, 10)).map((x) => x.key)).toEqual(['today', 'tomorrow']); // Friday: Saturday is tomorrow
  });
  it('presets the answers and switches multi answers', () => {
    const night = INTENTS.find((i) => i.key === 'night');
    const a = startAnswers(night, new Date(2026, 9, 26, 10));
    expect(a).toMatchObject({ sleep: 'tent', far: 'near', test: ['cold'], when: '2026-10-27' });
    const test = night.questions.find((q) => q.id === 'test');
    expect(pickAnswer(pickAnswer(a, test, 'cook'), test, 'cold').test).toEqual(['cook']);
  });
  it('proposes a test night with the questions for afterwards', () => {
    const p = proposal('night', { sleep: 'tent', test: ['cold', 'cook'], own: 'New jacket', when: '2026-10-31' });
    expect(p).toMatchObject({ title: 'Test night', days: 2, overnight: 'outdoor', tent: true, cook: true, startDate: '2026-10-31' });
    expect(p.asks).toEqual([{ text: 'How warm was the sleeping bag?' }, { text: 'Did the cooking work?' }, { own: 'New jacket' }, { text: 'What do you take differently next time?' }]);
    expect(proposal('night', { sleep: 'hut', test: ['cook'] })).toMatchObject({ overnight: 'lodging', cook: false });
  });
  it('proposes training and a plain ride with hours', () => {
    expect(proposal('training', { focus: 'climb', hours: '3' })).toMatchObject({ title: 'Training: climbing', hours: 3, days: 1 });
    expect(proposal('ride', { long: 'half' }).hours).toBe(4);
    expect(proposal('visit', { back: 'stay' })).toMatchObject({ days: 2, overnight: 'lodging' });
  });
  it('keeps answers after the tour and takes a question out', () => {
    const rec = intentRecord('night', {}, proposal('night', { test: ['cold', 'cook'] }));
    const a = answerAfter(answerAfter(rec, 0, 'warm'), 2, 'nothing');
    const d = dropAsk(a, 1);
    expect(d.asks.map((x) => x.text)).toEqual(['How warm was the sleeping bag?', 'What do you take differently next time?']);
    expect(d.after).toEqual({ 0: 'warm', 1: 'nothing' });
  });
});
