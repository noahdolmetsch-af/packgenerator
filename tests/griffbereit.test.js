// «Griffbereit» (Noah 23.11.2026 «G3»): food, rain gear and marked things should lie within reach on the bike. Fictional data only.
import { describe, it, expect } from 'vitest';
import { griffRows, reachWhy, skipGriff, MAX_ROWS } from '../src/lib/pack/griff.js';
import { reachChoice, reachRecord, withReach } from '../src/lib/pack/griffeld.js';
import { applyPlaces } from '../src/lib/bagsuggest.js';
import { itemRecord, itemDraft } from '../src/lib/gear.js';
import { ampelRows } from '../src/lib/trip/ampel.js';

const item = (id, extra = {}) => ({ id, name: id, ownership: 'owned', category: 'tools', ...extra });
const bags = [{ id: 'b-top', slot: 'top', volumeL: 1 }, { id: 'b-seat', slot: 'seat', volumeL: 10 }, { id: 'b-pl', slot: 'pouchL' }];
const trip = (entries, setup = { top: 'b-top', seat: 'b-seat' }, extra = {}) => ({ id: 't1', entries: entries.map(([itemId, slot]) => ({ itemId, slot, qty: 1 })), setup, status: 'planned', ...extra });

describe('who should lie within reach', () => {
  it('food and rain gear by themselves, a marked thing, never one you said no to', () => {
    expect(reachWhy(item('bar', { category: 'food' }))).toBe('food');
    expect(reachWhy(item('jacket', { category: 'rain' }))).toBe('rain');
    expect(reachWhy(item('pump'))).toBe(null);
    expect(reachWhy(item('pump', { reach: true }))).toBe('marked');
    expect(reachWhy(item('bar', { category: 'food', reach: false }))).toBe(null);
  });
});

describe('what lies out of reach', () => {
  const its = [item('bar', { category: 'food' }), item('jacket', { category: 'rain' }), item('pump'), item('tent')];
  it('suggests the top tube bag for food and rain gear in the seat pack, and leaves the rest', () => {
    const rows = griffRows({ trip: trip([['bar', 'seat'], ['jacket', 'seat'], ['pump', 'seat']]), items: its, bags });
    expect(rows.map((r) => [r.itemId, r.from, r.to, r.bagId, r.why])).toEqual([
      ['bar', 'seat', 'top', 'b-top', 'food'],
      ['jacket', 'seat', 'top', 'b-top', 'rain'],
    ]);
  });
  it('has nothing for things that are reached already', () => {
    const t = trip([['bar', 'top'], ['jacket', 'body'], ['pump', 'mounted']], { top: 'b-top' });
    expect(griffRows({ trip: t, items: [...its, item('x')], bags })).toEqual([]);
  });
  it('needs a bag of the trip in a reached place', () => {
    expect(griffRows({ trip: trip([['bar', 'seat']], { seat: 'b-seat' }), items: its, bags })).toEqual([]);
  });
  it('skips what does not fit when the litres are known on both sides', () => {
    const big = [item('jacket', { category: 'rain', volumeL: 3 })];
    expect(griffRows({ trip: trip([['jacket', 'seat']]), items: big, bags })).toEqual([]);
    const rows = griffRows({ trip: trip([['jacket', 'seat']], { top: 'b-top', pouchL: 'b-pl', seat: 'b-seat' }), items: big, bags });
    expect(rows[0].to).toBe('pouchL'); // the pouch has no litres: unknown, so it may take it
  });
  it('leaves out wishlist things, «Nicht diesmal», finished trips and trips with their own packs', () => {
    const w = [item('bar', { category: 'food', ownership: 'wishlist' })];
    expect(griffRows({ trip: trip([['bar', 'seat']]), items: w, bags })).toEqual([]);
    const t = trip([['bar', 'seat']], undefined, { griffSkip: ['bar'] });
    expect(griffRows({ trip: t, items: its, bags })).toEqual([]);
    expect(griffRows({ trip: trip([['bar', 'seat']], undefined, { status: 'done' }), items: its, bags })).toEqual([]);
    expect(griffRows({ trip: trip([['bar', 'seat']], undefined, { packs: [] }), items: its, bags })).toEqual([]);
    expect(griffRows({ trip: null, items: its, bags })).toEqual([]);
  });
  it('shows at most MAX_ROWS', () => {
    const many = Array.from({ length: 12 }, (_, i) => item(`f${i}`, { category: 'food' }));
    const rows = griffRows({ trip: trip(many.map((m) => [m.id, 'seat'])), items: many, bags });
    expect(rows).toHaveLength(MAX_ROWS);
  });
  it('«Nicht diesmal» adds one item, never twice, and a move uses Pack’s applyPlaces', () => {
    expect(skipGriff({ griffSkip: ['a'] }, 'b').griffSkip).toEqual(['a', 'b']);
    expect(skipGriff({ griffSkip: ['a'] }, 'a').griffSkip).toEqual(['a']);
    const t = trip([['bar', 'seat']]);
    const [row] = griffRows({ trip: t, items: its, bags });
    const out = applyPlaces(t, [row]);
    expect(out.entries[0]).toMatchObject({ itemId: 'bar', slot: 'top', packed: false });
    expect(out.setup).toEqual(t.setup);
  });
});

describe('the item field', () => {
  it('has three choices and goes through «Save»; an item without it is not changed', () => {
    expect(reachChoice({})).toBe('auto');
    expect(reachChoice({ reach: true })).toBe('yes');
    expect(reachChoice({ reach: false })).toBe('no');
    expect(withReach('yes')).toEqual({ reach: true });
    expect(withReach('no')).toEqual({ reach: false });
    expect(withReach('auto')).toEqual({ reach: null });
    expect(reachRecord({ reach: null }, null)).toEqual({});
    expect(reachRecord({ reach: null }, { id: 'a', reach: true })).toEqual({ reach: null });
    const old = item('pump');
    const same = itemRecord(itemDraft(old), { item: old, items: [old], weightG: null });
    expect('reach' in same).toBe(false);
    const draft = { ...itemDraft(old), reach: true };
    expect(itemRecord(draft, { item: old, items: [old], weightG: null }).reach).toBe(true);
  });
});

describe('the line on «Ready to go?»', () => {
  const base = { trip: { startDate: '2026-11-10' }, stats: { packed: 1, count: 2 }, today: '2026-11-05' };
  it('has no line without one out of reach', () => {
    expect(ampelRows({ ...base }).find((r) => r.key === 'griff')).toBeUndefined();
    expect(ampelRows({ ...base, griff: { n: 0, name: '' } }).find((r) => r.key === 'griff')).toBeUndefined();
  });
  it('names one, counts several, and a tap opens the window', () => {
    const one = ampelRows({ ...base, griff: { n: 1, name: 'Bar' } }).find((r) => r.key === 'griff');
    expect(one).toMatchObject({ tone: 'wait', text: 'Within reach: {name} lies deep in a bag', vars: { name: 'Bar' }, act: 'griff' });
    const many = ampelRows({ ...base, griff: { n: 3, name: 'Bar' } }).find((r) => r.key === 'griff');
    expect(many).toMatchObject({ text: 'Within reach: {n} things lie deep in a bag', vars: { n: 3 }, act: 'griff' });
  });
});
