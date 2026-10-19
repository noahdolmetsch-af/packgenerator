// Package G #85/#163/#1003: tours into the own calendar «Packgenerator», notes ↔ Google Tasks.
// Fictional tours and notes only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { tripItems, fingerprint, planNotes, syncNotes, syncCal, savePrefs, PACK_REMIND_MIN, OWN_KEY } from '../src/lib/googleown.js';

const trip = (id, startDate, over = {}) => ({ id, title: `Runde ${id}`, startDate, days: 2, ...over });
const note = (id, over = {}) => ({ id, at: '2026-10-18T08:00:00Z', text: `Notiz ${id}`, status: 'open', to: null, ...over });
const task = (id, over = {}) => ({ id, list: 'own', title: `Notiz ${id}`, done: false, ...over });

describe('tours as calendar items', () => {
  it('takes the tours of the window with a reminder two days before at 18:00', () => {
    const items = tripItems([trip('a', '2026-10-24'), trip('b', '2026-09-01'), trip('c', '2026-10-30', { skipped: true }), trip('d', '2026-10-12', { days: 3 })], '2026-10-19');
    expect(items.map((i) => [i.key, i.day, i.lastDay])).toEqual([['trip:d', '2026-10-12', '2026-10-14'], ['trip:a', '2026-10-24', '2026-10-25']]);
    expect(items[1].remind).toEqual([PACK_REMIND_MIN]);
    expect(PACK_REMIND_MIN).toBe(30 * 60);
    expect(tripItems([trip('a', '2026-10-24')], '2026-10-19', { remind: false })[0].remind).toEqual([]);
    expect(fingerprint(items)).toBe(fingerprint(tripItems([trip('a', '2026-10-24'), trip('d', '2026-10-12', { days: 3 })], '2026-10-19')));
  });
  it('sends only when switched on and when something changed', async () => {
    const db = createDb(`own-${Math.random()}`);
    await db.trips.put(trip('a', '2026-10-24'));
    const sent = [];
    const c = async (step, o) => (sent.push([step, o.body.items.length]), { ok: true, cal: 'own@x', made: 1 });
    expect(await syncCal({ db, c, today: '2026-10-19' })).toBe(null);
    await savePrefs({ cal: true }, db);
    await syncCal({ db, c, today: '2026-10-19' });
    expect(await syncCal({ db, c, today: '2026-10-19' })).toEqual({ skipped: true });
    await db.trips.put(trip('b', '2026-11-02'));
    await syncCal({ db, c, today: '2026-10-19' });
    expect(sent).toEqual([['own-sync', 1], ['own-sync', 2]]);
    expect((await db.settings.get(OWN_KEY)).value.calId).toBe('own@x');
  });
});

describe('notes and Google Tasks, both ways', () => {
  it('plans what to do', () => {
    const p = planNotes({
      notes: [note('new'), note('sorted-new', { status: 'sorted' }), note('a', { gTask: 'ta' }), note('b', { gTask: 'tb', status: 'sorted' }), note('c', { gTask: 'tc', text: 'Neuer Text' })],
      tasks: [task('ta', { done: true }), task('tb'), task('tc', { title: 'Alter Text' }), task('tg', { title: 'Aus Google' }), task('told')],
      known: ['told'],
    });
    expect(p.create.map((n) => n.id)).toEqual(['new']);
    expect(p.done.map((x) => x.note.id)).toEqual(['a']);
    expect(p.tick.map((x) => x.task.id)).toEqual(['tb']);
    expect(p.rename.map((x) => x.task.id)).toEqual(['tc']);
    expect(p.newNotes.map((x) => x.id)).toEqual(['tg']);
    expect(p.remove).toEqual(['told']);
  });
  it('runs one round with the server', async () => {
    const db = createDb(`own-${Math.random()}`);
    await db.notes.bulkPut([note('n1'), note('n2', { gTask: 'g2' })]);
    await savePrefs({ notes: true }, db);
    const calls = [];
    const c = async (step, o = {}) => {
      calls.push(step);
      if (step === 'own-list') return { list: { id: 'own', title: 'Packgenerator Notizen' } };
      if (step === 'tasks') return { tasks: [task('g2', { done: true }), task('g3', { title: 'Velo putzen' })] };
      if (step === 'task-save') return { task: { id: 'g1', ...o.body } };
      return { ok: true };
    };
    const res = await syncNotes({ db, c, now: new Date('2026-10-19T09:00:00Z') });
    expect(res).toMatchObject({ created: 1, done: 1, added: 1 });
    expect((await db.notes.get('n1')).gTask).toBe('g1');
    expect((await db.notes.get('n2')).status).toBe('sorted');
    expect((await db.notes.toArray()).find((n) => n.gTask === 'g3').text).toBe('Velo putzen');
    expect((await db.settings.get(OWN_KEY)).value).toMatchObject({ listId: 'own', known: expect.arrayContaining(['g1', 'g2', 'g3']) });
    expect(calls[0]).toBe('own-list');
  });
});
