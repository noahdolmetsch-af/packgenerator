// v0.48.0 «Eingang»: day groups, filed today stays faint until midnight, «Abgelegt» with search,
// the 7 targets, a receipt becomes a workshop visit with the photo.
import { describe, it, expect } from 'vitest';
import { TARGETS, guessTarget, dayGroup, inboxGroups, filedRows, shopsOf, receiptName, fileReceipt, fileNote, targetHref, guessTopic } from '../src/lib/inbox.js';

const P = 'test_data_gtp_';
const today = '2026-10-09';
const at = (d, h = 8) => `${d}T${String(h).padStart(2, '0')}:00:00`;
const note = (id, d, extra = {}) => ({ id, at: new Date(at(d)).toISOString(), text: `${P} ${id}`, status: 'open', to: null, sortedAt: null, ...extra });

describe('the Eingang list', () => {
  it('has 7 targets in the agreed order', () => {
    expect(TARGETS.map((x) => x.key)).toEqual(['receipt', 'problem', 'material', 'wish', 'idea', 'tour', 'keep']);
  });
  it('guesses a target from the text', () => {
    expect(guessTarget({ text: 'Foto Rechnung Veloshop' })).toBe('receipt');
    expect(guessTarget({ text: 'Bremse hinten schleift' })).toBe('problem');
    expect(guessTarget({ text: 'Neue Schläuche kaufen' })).toBe('wish');
    expect(guessTarget({ text: 'Schönes Café in Langenbruck' })).toBe('tour');
    expect(guessTarget({ text: 'Code fürs Schloss' })).toBe('keep');
  });
  it('groups by day, newest first; filed today stays, filed earlier goes', () => {
    expect(dayGroup(new Date(at(today)).toISOString(), today)).toBe('today');
    expect(dayGroup(new Date(at('2026-10-08')).toISOString(), today)).toBe('yesterday');
    expect(dayGroup(new Date(at('2026-10-05')).toISOString(), today)).toBe('week');
    expect(dayGroup(new Date(at('2026-09-20')).toISOString(), today)).toBe('older');
    const notes = [
      note('a', today, {}),
      note('b', today, { status: 'sorted', sortedAt: new Date(at(today, 9)).toISOString(), to: { kind: 'problem' } }),
      note('c', '2026-10-08', { status: 'sorted', sortedAt: new Date(at('2026-10-08', 9)).toISOString(), to: { kind: 'wish' } }),
      note('d', '2026-10-01'),
    ];
    const g = inboxGroups(notes, today);
    expect(g.map((x) => x.key)).toEqual(['today', 'older']);
    expect(g[0].rows.map((r) => [r.id, r.filed])).toEqual([['a', false], ['b', true]]);
  });
  it('«Abgelegt» searches text, shop, bike and amount, and filters by target', () => {
    const notes = [
      note('r', '2026-10-06', { status: 'sorted', sortedAt: 'x', to: { kind: 'receipt', label: 'Shop', shop: `${P}Veloshop`, chf: 127, bikeId: 'b1' } }),
      note('w', '2026-10-07', { status: 'sorted', sortedAt: 'x', to: { kind: 'wish' } }),
      note('o', '2026-10-08'),
    ];
    expect(filedRows(notes).map((n) => n.id)).toEqual(['w', 'r']);
    expect(filedRows(notes, { query: '127.00' }).map((n) => n.id)).toEqual(['r']);
    expect(filedRows(notes, { query: 'veloshop' }).map((n) => n.id)).toEqual(['r']);
    expect(filedRows(notes, { query: 'bergziege', names: { b1: `${P} Bergziege` } }).map((n) => n.id)).toEqual(['r']);
    expect(filedRows(notes, { filter: 'gear' }).map((n) => n.id)).toEqual(['w']);
  });
});

describe('filing', () => {
  const bike = { id: 'b1', name: `${P} Bergziege`, km: 1240 };
  it('a receipt becomes a workshop visit with the photo; the entry keeps what it wrote', () => {
    const n = note('r', today, { photo: 'data:image/png;base64,AA' });
    const { visit, note: out } = fileReceipt(n, { bike, shop: `${P}Veloshop`, date: today, chf: 127, jobs: [{ part: 'chain', action: 'replace' }] }, { id: 'v1', now: 'now', today });
    expect(visit).toMatchObject({ id: 'v1', bikeId: 'b1', date: today, shop: `${P}Veloshop`, km: 1240, totalChf: 127, photos: ['data:image/png;base64,AA'], parts: [{ part: 'chain', action: 'replace', what: '' }], noteId: 'r' });
    expect(out).toMatchObject({ status: 'sorted', sortedAt: 'now', to: { kind: 'receipt', ref: 'v1', bikeId: 'b1', chf: 127, made: [['visits', 'v1']] } });
    expect(receiptName(`${P}Veloshop`, '2026-10-06')).toBe(`${P}Veloshop · 6.10.2026`);
    expect(shopsOf([{ shop: 'A' }, { shop: 'B' }, { shop: 'B' }, {}])).toEqual([{ shop: 'B', n: 2 }, { shop: 'A', n: 1 }]);
  });
  it('the other targets write their record and remember it', () => {
    const n = note('p', today);
    expect(fileNote(n, 'problem', { bike, ids: { task: 7 }, now: 'now' })).toMatchObject({ repair: { id: 7, bikeId: 'b1', status: 'open' }, note: { to: { kind: 'problem', made: [['maintenance', 7]] } } });
    expect(fileNote(n, 'material', { name: 'Pumpe', category: 'tools', grams: 90, ids: { item: 'WZ01' } }).item).toMatchObject({ id: 'WZ01', ownership: 'owned', category: 'tools', weightG: 90 });
    expect(fileNote(n, 'wish', { ids: { item: 'LX01' } }).item).toMatchObject({ ownership: 'wishlist' });
    expect(fileNote(n, 'idea', { bike, ids: { idea: 'i1' } })).toMatchObject({ idea: { bikeId: 'b1', idea: { id: 'i1' } }, note: { to: { made: [['idea', 'b1', 'i1']] } } });
    expect(fileNote(n, 'tour', { trip: { id: 't1' } })).toMatchObject({ tripNote: { tripId: 't1' }, note: { to: { kind: 'tour', ref: 't1' } } });
    expect(fileNote({ ...n, text: 'Intervalle Schwelle' }, 'keep')).toMatchObject({ note: { status: 'kept', topic: 'training', to: { kind: 'keep' } } });
    expect(guessTopic('Zelt und Isomatte')).toBe('gear');
  });
  it('links each filed entry to where it went, or nowhere when that is gone', () => {
    expect(targetHref({ kind: 'receipt', ref: 'v1', bikeId: 'b1' }, { visits: [{ id: 'v1' }] })).toBe('#/bikes?tab=shop&bike=b1&visit=v1');
    expect(targetHref({ kind: 'receipt', ref: 'v1' }, { visits: [] })).toBeNull();
    expect(targetHref({ kind: 'keep' })).toBe('#/notes');
  });
});
