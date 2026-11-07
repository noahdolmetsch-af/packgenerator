// «Erste Nacht» › «Nach der Nacht» (Noah 05.11.2026 «7a»): three questions and the take-over. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { nightOf } from '../src/lib/frei.js';
import { answersOf, missingMarks, nightNotes, overCount, SLEEP, COLD } from '../src/lib/frei/nacht-fragen.js';
import { takeOver, applyTakeOver } from '../src/lib/frei/uebernahme.js';

const tr = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v?.[k] ?? '');
const NOW = '2026-11-05T21:00:00.000Z';

describe('answers', () => {
  it('are made safe: unknown choices drop out, nothing is needed', () => {
    expect(answersOf({})).toMatchObject({ sleep: '', cold: '', coldWhere: '', missing: '', takenTo: null });
    expect(answersOf({ answers: { sleep: 'nope', cold: 'yes', coldWhere: '  feet ', missing: 'a' } })).toMatchObject({ sleep: '', cold: 'yes', coldWhere: 'feet', missing: 'a' });
    expect(SLEEP.map((o) => o.key)).toEqual(['good', 'ok', 'bad']);
    expect(COLD.map((o) => o.key)).toEqual(['no', 'bit', 'yes']);
  });
  it('travel with the night record', () => {
    expect(nightOf({ night: { answers: { sleep: 'bad' } } }).answers).toEqual({ sleep: 'bad' });
    expect(nightOf({}).answers).toEqual({});
  });
  it('turn lines into things, each once, bullets removed', () => {
    const m = missingMarks({ missing: '- Warm hat\n\n• warm hat\nHead torch  ' });
    expect(m.map((x) => x.name)).toEqual(['Warm hat', 'Head torch']);
    expect(m.every((x) => x.pile === 'missing' && x.key.startsWith('name:'))).toBe(true);
  });
  it('suggest a planning note for cold and for a bad night, none for a good one', () => {
    expect(nightNotes({ cold: 'no', sleep: 'good' }, tr)).toEqual([]);
    expect(nightNotes({ cold: 'yes', coldWhere: 'feet' }, tr)).toEqual(['First night: it was too cold. Plan something warmer for sleeping. (feet)']);
    expect(nightNotes({ cold: 'bit', sleep: 'bad' }, tr)).toHaveLength(2);
    expect(overCount({ missing: 'a\nb', cold: 'yes' }, tr)).toBe(3);
  });
});

describe('take-over of the first night', () => {
  const items = [{ id: 'i2', name: 'Head torch', category: 'lux', ownership: 'owned' }];
  const trip = { id: 'tr1', title: 'test_data_gtp_ Runde', startDate: '2026-11-10', days: 1, bikeId: 'b1', setup: {}, entries: [] };
  it('adds the things and the notes to the trip, each note once', () => {
    const marks = missingMarks({ missing: 'Head torch\nWarm hat' });
    const notes = nightNotes({ cold: 'yes' }, tr);
    const r = takeOver({ marks, notes, trip, items, now: NOW, tr });
    expect(r.added).toEqual(['Head torch', 'Warm hat']);
    expect(r.newItems.map((i) => i.name)).toEqual(['Warm hat']);
    expect(r.planNotes.map((n) => n.text)).toEqual(notes);
    const again = takeOver({ marks: [], notes, trip: { ...trip, planNotes: r.planNotes }, items, now: NOW, tr });
    expect(again.noted).toEqual([]);
  });
  it('writes loose words without touching the table of notes, and Undo brings the trip back', async () => {
    const db = createDb(`test-nacht-${Math.random().toString(36).slice(2)}`);
    await db.items.bulkPut(items);
    await db.trips.put(trip);
    const { result, undo } = await applyTakeOver(db, { tripId: 'tr1', marks: missingMarks({ missing: 'Warm hat' }), notes: nightNotes({ sleep: 'bad' }, tr), tr, now: NOW });
    expect(result.added).toEqual(['Warm hat']);
    expect(await db.frei.count()).toBe(0);
    expect((await db.trips.get('tr1')).planNotes).toHaveLength(1);
    await undo();
    expect((await db.trips.get('tr1')).entries).toHaveLength(0);
    expect((await db.trips.get('tr1')).planNotes).toEqual([]);
    expect(await db.items.count()).toBe(1);
  });
});
