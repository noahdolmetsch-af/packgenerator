// «Dazu nötig» (Noah 23.11.2026 «G1»): the small thing that belongs with a bigger one. Fictional data only.
import { describe, it, expect } from 'vitest';
import { dazuRows, learnedPairs, skipPatch, LEARN_MIN, MAX_ROWS, MAX_LEARNED } from '../src/lib/pack/dazu.js';
import { linkedOf, withAdded, withRemoved, withRecord } from '../src/lib/pack/dazufeld.js';
import { itemRecord, itemDraft } from '../src/lib/gear.js';
import { ampelRows } from '../src/lib/trip/ampel.js';

const item = (id, extra = {}) => ({ id, name: id, ownership: 'owned', category: 'tools', ...extra });
const trip = (id, ids, extra = {}) => ({ id, title: id, startDate: '2026-10-01', entries: ids.map((itemId) => ({ itemId, qty: 1 })), ...extra });
const done = (t) => ({ id: `d-${t.id}`, tripId: t.id, status: 'done', items: {} });

const items = [item('computer'), item('cable'), item('lamp'), item('spare'), item('jacket'), item('wishy', { ownership: 'wishlist' })];

describe('linked companions', () => {
  it('lists only what the item names, without itself and without doubles', () => {
    expect(linkedOf({ id: 'a', withIds: ['b', 'a', 'b', '', 7] })).toEqual(['b']);
    expect(linkedOf({ id: 'a' })).toEqual([]);
    expect(linkedOf(null)).toEqual([]);
  });

  it('adds and removes one companion', () => {
    const a = { id: 'a', withIds: ['b'] };
    expect(withAdded(a, 'c')).toEqual(['b', 'c']);
    expect(withAdded(a, 'b')).toEqual(['b']);
    expect(withAdded(a, 'a')).toEqual(['b']);
    expect(withRemoved(a, 'b')).toEqual([]);
  });

  it('shows a companion that is missing on the list and is a thing you own', () => {
    const its = [item('computer', { withIds: ['cable', 'wishy', 'gone'] }), item('cable'), item('wishy', { ownership: 'wishlist' })];
    const rows = dazuRows({ trip: trip('t', ['computer']), items: its });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'cable', forIds: ['computer'], source: 'linked' });
  });

  it('shows nothing when the companion is on the list, was taken off, or was skipped for this trip', () => {
    const its = [item('computer', { withIds: ['cable'] }), item('cable')];
    expect(dazuRows({ trip: trip('t', ['computer', 'cable']), items: its })).toEqual([]);
    expect(dazuRows({ trip: trip('t', ['computer'], { leftOut: [{ itemId: 'cable', at: 'x' }] }), items: its })).toEqual([]);
    const skipped = skipPatch(trip('t', ['computer']), 'cable');
    expect(dazuRows({ trip: skipped, items: its })).toEqual([]);
    expect(skipPatch(skipped, 'cable').dazuSkip).toEqual(['cable']);
  });

  it('says one row for a companion that two things on the list name', () => {
    const its = [item('computer', { withIds: ['cable'] }), item('lamp', { withIds: ['cable'] }), item('cable')];
    const rows = dazuRows({ trip: trip('t', ['computer', 'lamp']), items: its });
    expect(rows).toHaveLength(1);
    expect(rows[0].forIds).toEqual(['computer', 'lamp']);
  });

  it('shows nothing without a trip or an empty list', () => {
    expect(dazuRows({ trip: null, items })).toEqual([]);
    expect(dazuRows({ trip: trip('t', []), items })).toEqual([]);
  });

  it('caps the rows', () => {
    const many = Array.from({ length: MAX_ROWS + 4 }, (_, i) => `c${i}`);
    const its = [item('a', { withIds: many }), ...many.map((id) => item(id))];
    expect(dazuRows({ trip: trip('t', ['a']), items: its })).toHaveLength(MAX_ROWS);
  });
});

describe('learned companions', () => {
  // eight finished trips: lamp and spare together on three; the jacket on all; the computer on two
  const past = [
    trip('p1', ['lamp', 'spare', 'jacket']),
    trip('p2', ['lamp', 'spare', 'jacket']),
    trip('p3', ['lamp', 'spare', 'jacket']),
    trip('p4', ['computer', 'jacket']),
    trip('p5', ['computer', 'jacket']),
    trip('p6', ['jacket']),
    trip('p7', ['jacket']),
    trip('p8', ['jacket']),
  ];
  const debriefs = past.map(done);
  const only = (id) => ({ only: new Set([id]) });

  it('learns a pair of things that came as a pair, not a thing that is on every trip', () => {
    const l = learnedPairs(past, debriefs, only('lamp'));
    expect(l.lamp.spare).toEqual({ n: 3, of: 3 });
    expect(l.lamp.jacket).toBeUndefined(); // on every trip: general
    expect(learnedPairs(past, debriefs, only('jacket'))).toEqual({}); // and nothing is learned for it
  });

  it('does not learn two things of the cold season (both on most trips)', () => {
    const cold = Array.from({ length: 6 }, (_, i) => trip(`c${i}`, ['legwarmers', 'computer']));
    const warm = [trip('w1', ['shorts']), trip('w2', ['shorts'])];
    const all = [...cold, ...warm];
    expect(learnedPairs(all, all.map(done), only('legwarmers'))).toEqual({});
  });

  it('does not learn a second thing that also came without the first', () => {
    const more = [...past, trip('p9', ['spare']), trip('p10', ['spare']), trip('p11', ['x']), trip('p12', ['x']), trip('p13', ['x'])];
    expect(learnedPairs(more, more.map(done), only('lamp'))).toEqual({});
  });

  it('needs LEARN_MIN finished trips', () => {
    expect(LEARN_MIN).toBe(3);
    const two = [past[0], past[1], past[5], past[6], past[7]];
    expect(learnedPairs(two, two.map(done), only('lamp'))).toEqual({});
  });

  it('counts only trips with a finished debrief', () => {
    expect(learnedPairs(past, debriefs.slice(1), only('lamp'))).toEqual({});
  });

  it('suggests the learned companion on a new list, as learned', () => {
    const rows = dazuRows({ trip: trip('new', ['lamp', 'jacket']), items, trips: past, debriefs });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 'spare', forIds: ['lamp'], source: 'learned', n: 3, of: 3 });
  });

  it('shows at most MAX_LEARNED learned companions', () => {
    const kit = ['k1', 'k2', 'k3', 'k4', 'k5'];
    const many = [...Array.from({ length: 3 }, (_, i) => trip(`m${i}`, ['lamp', ...kit])), trip('o1', ['x']), trip('o2', ['x']), trip('o3', ['x']), trip('o4', ['x']), trip('o5', ['x'])];
    const its = [...items, ...kit.map((id) => item(id))];
    const rows = dazuRows({ trip: trip('new', ['lamp']), items: its, trips: many, debriefs: many.map(done) });
    expect(rows.filter((r) => r.source === 'learned')).toHaveLength(MAX_LEARNED);
  });

  it('does not count the open trip itself', () => {
    const open = trip('p1', ['lamp']);
    expect(dazuRows({ trip: open, items, trips: past, debriefs }).some((r) => r.id === 'spare')).toBe(false);
  });

  it('a linked companion stays «linked» when it was learned too', () => {
    const its = items.map((i) => (i.id === 'lamp' ? { ...i, withIds: ['spare'] } : i));
    const rows = dazuRows({ trip: trip('new', ['lamp']), items: its, trips: past, debriefs });
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe('linked');
  });
});

describe('the item field', () => {
  it('is stored as a list, left out when empty, and removed when it was there and is emptied', () => {
    expect(withRecord({ withIds: ['b', 'b'] }, null)).toEqual({ withIds: ['b'] });
    expect(withRecord({ withIds: [] }, null)).toEqual({});
    expect(withRecord({ withIds: [] }, { id: 'a', withIds: ['b'] })).toEqual({ withIds: null });
  });

  it('goes through «Save» and an item without it is not changed by opening and saving', () => {
    const old = item('lamp');
    const same = itemRecord(itemDraft(old), { item: old, items: [old], weightG: null });
    expect('withIds' in same).toBe(false);
    const draft = { ...itemDraft(old), withIds: ['spare'] };
    expect(itemRecord(draft, { item: old, items: [old], weightG: null }).withIds).toEqual(['spare']);
  });
});

describe('the line on «Ready to go?»', () => {
  const base = { trip: { startDate: '2026-11-10' }, stats: { packed: 1, count: 2 }, today: '2026-11-05' };
  it('has no line without a missing companion', () => {
    expect(ampelRows({ ...base }).find((r) => r.key === 'dazu')).toBeUndefined();
    expect(ampelRows({ ...base, dazu: { n: 0, name: '' } }).find((r) => r.key === 'dazu')).toBeUndefined();
  });
  it('names one, counts several, and a tap opens the window', () => {
    const one = ampelRows({ ...base, dazu: { n: 1, name: 'Cable' } }).find((r) => r.key === 'dazu');
    expect(one).toMatchObject({ tone: 'wait', text: 'Needed with it: {name} is missing', vars: { name: 'Cable' }, act: 'dazu' });
    const many = ampelRows({ ...base, dazu: { n: 3, name: 'Cable' } }).find((r) => r.key === 'dazu');
    expect(many).toMatchObject({ text: 'Needed with it: {n} things are missing', vars: { n: 3 }, act: 'dazu' });
  });
});
