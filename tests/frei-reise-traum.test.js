// «Reise-Wünsche» › «Zur Traumtour machen» (Noah 05.11.2026 «6a»). Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { DREAMS_KEY, KINDS, storeOf } from '../src/lib/dreams.js';
import { thoughtTitle, thoughtKind, seasonOf, dreamFromThought, makeDream } from '../src/lib/frei/reise-traum.js';

const tr = (s) => s.replace(/\|[a-z]+$/, '');
const thought = (over = {}) => ({ id: 'fr-1', kind: 'longing', day: '2026-11-01', at: '2026-11-01T10:00:00.000Z', text: 'Warm in winter, far from the grey.', photos: [], data: { moods: ['space'], dest: 'Tessin' }, ...over });
const store = storeOf({ dreams: [] });

describe('title, kind and season of a wish', () => {
  it('the title is the place, else the first sentence, else the fallback', () => {
    expect(thoughtTitle(thought())).toBe('Tessin');
    expect(thoughtTitle(thought({ data: {} }))).toBe('Warm in winter, far from the grey.');
    expect(thoughtTitle(thought({ data: {}, text: '' }), 'A wish')).toBe('A wish');
  });
  it('the kind: your choice first, then a clear hint, else none', () => {
    expect(thoughtKind(thought(), store.kinds)).toBe('south');
    expect(thoughtKind(thought({ data: { dest: 'Tessin', kind: 'gravel' } }), store.kinds)).toBe('gravel');
    expect(thoughtKind(thought({ data: {}, text: 'More quiet.' }), store.kinds)).toBe('');
    expect(thoughtKind(thought({ data: { dest: 'x', kind: 'gone-kind' }, text: 'q' }), store.kinds)).toBe('');
  });
  it('the season says the months and whether this month fits; none without a kind', () => {
    const s = seasonOf(thought(), store, '2026-11-05', tr);
    expect(s.months).toEqual(KINDS.find((k) => k.key === 'south').months.slice().sort((a, b) => a - b));
    expect(s.now).toBe(true);
    expect(s.text).toBe('Oct–Apr');
    expect(seasonOf(thought(), store, '2026-07-05', tr).now).toBe(false);
    expect(seasonOf(thought({ data: {}, text: 'More quiet.' }), store, '2026-07-05', tr)).toBeNull();
  });
  it('the dream keeps kind, title and a note', () => {
    const d = dreamFromThought(thought(), store, { id: 'dream-x', now: '2026-11-05T10:00:00.000Z' });
    expect(d).toMatchObject({ id: 'dream-x', title: 'Tessin', kind: 'south', days: 2, note: 'Warm in winter, far from the grey.' });
  });
});

describe('makeDream', () => {
  const fresh = async () => {
    const db = createDb(`test-reise-${Math.random().toString(36).slice(2)}`);
    await db.frei.put(thought());
    return db;
  };
  it('writes the dream first in the list, marks the wish, and Undo takes both back', async () => {
    const db = await fresh();
    await db.settings.put({ key: DREAMS_KEY, value: { dreams: [{ id: 'dream-old', title: 'Old', kind: 'alps', days: 3, note: '', url: '', at: '2026-10-01' }], kinds: store.kinds } });
    const r = await makeDream(db, 'fr-1', { id: 'dream-new' });
    expect(r.dream.title).toBe('Tessin');
    const s = storeOf((await db.settings.get(DREAMS_KEY)).value);
    expect(s.dreams.map((d) => d.id)).toEqual(['dream-new', 'dream-old']);
    expect((await db.frei.get('fr-1')).data.dreamId).toBe('dream-new');
    await r.undo();
    expect(storeOf((await db.settings.get(DREAMS_KEY)).value).dreams.map((d) => d.id)).toEqual(['dream-old']);
    expect((await db.frei.get('fr-1')).data.dreamId).toBeUndefined();
  });
  it('makes the dream record when there is none, and never twice for the same wish', async () => {
    const db = await fresh();
    const r = await makeDream(db, 'fr-1', { id: 'dream-a' });
    expect(r).not.toBeNull();
    expect(await makeDream(db, 'fr-1', { id: 'dream-b' })).toBeNull();
    await r.undo();
    expect(await db.settings.get(DREAMS_KEY)).toBeUndefined();
  });
  it('makes a new one when the dream was deleted since; nothing for a wish that is gone', async () => {
    const db = await fresh();
    await makeDream(db, 'fr-1', { id: 'dream-a' });
    await db.settings.put({ key: DREAMS_KEY, value: { dreams: [], kinds: store.kinds } });
    expect(await makeDream(db, 'fr-1', { id: 'dream-b' })).not.toBeNull();
    expect(await makeDream(db, 'nope')).toBeNull();
  });
});
