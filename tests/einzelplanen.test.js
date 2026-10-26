// Einzelideen Planen (996 Ideen 12, 13, 14; Noah 25.10.2026): links with a meaning, a reminder after an
// event, restore with attachments. Fictional data only.
import { describe, it, expect } from 'vitest';
import { relLinks, setRel, RELS, newAfter, afterHit, afterDue, afterWaiting, restoreInfo, lastDay } from '../src/lib/notes/context.js';

const P = 'test_data_ep_';
const note = (id, extra = {}) => ({ id, status: 'kept', title: `${P}${id}`, text: '', at: '2026-10-01T10:00:00Z', ...extra });

describe('links with a meaning', () => {
  it('the note that keeps the link names the other; the other reads it back', () => {
    const a = note('a', { links: [{ kind: 'note', ref: 'b', label: 'b', rel: 'source' }] });
    const b = note('b');
    expect(relLinks(a, [a, b])).toEqual([{ id: 'b', title: `${P}b`, own: true, rel: 'source' }]);
    expect(relLinks(b, [a, b])).toEqual([{ id: 'a', title: `${P}a`, own: false, rel: 'source' }]);
  });
  it('setRel sets, changes and removes the meaning; unknown meanings are left out', () => {
    const a = note('a', { links: [{ kind: 'note', ref: 'b', label: 'b' }, { kind: 'trip', ref: 't1', label: 'Jura' }] });
    const b = setRel(a, 'b', 'counter', 'now');
    expect(b.links[0]).toEqual({ kind: 'note', ref: 'b', label: 'b', rel: 'counter' });
    expect(b.links[1]).toEqual(a.links[1]);
    expect(setRel(b, 'b', null).links[0].rel).toBeUndefined();
    expect(setRel(b, 'b', 'nonsense').links[0].rel).toBeUndefined();
    expect(relLinks(note('x', { links: [{ kind: 'note', ref: 'b', rel: 'nonsense' }] }), [b, note('b')])[0].rel).toBe(null);
  });
  it('three meanings, each with both readings', () => {
    expect(RELS.map((r) => r.key)).toEqual(['source', 'counter', 'followup']);
    for (const r of RELS) expect(r.own && r.back).toBeTruthy();
  });
});

describe('a reminder after an event', () => {
  const trips = [
    { id: 't1', title: `${P}Jura`, startDate: '2026-10-10', days: 3 },
    { id: 't2', title: `${P}Idea`, startDate: '2026-10-05', days: 1, idea: true },
  ];
  it('after the next trip: back the day after its last day', () => {
    const n = note('a', { after: newAfter('trip', { today: '2026-10-08' }) });
    expect(lastDay(trips[0])).toBe('2026-10-12');
    expect(afterHit(n, { trips, today: '2026-10-12' })).toBe(null);
    expect(afterHit(n, { trips, today: '2026-10-13' })).toEqual({ kind: 'trip', day: '2026-10-12', title: `${P}Jura` });
  });
  it('a trip that ended before it was set does not count; an idea never counts', () => {
    const n = note('a', { after: newAfter('trip', { today: '2026-10-20' }) });
    expect(afterHit(n, { trips, today: '2026-10-25' })).toBe(null);
  });
  it('one chosen trip: only that one', () => {
    const n = note('a', { after: newAfter('trip', { today: '2026-10-08', tripId: 'other' }) });
    expect(afterHit(n, { trips, today: '2026-10-20' })).toBe(null);
  });
  it('after the next workshop visit: visits already there on the day are left out', () => {
    const old = [{ id: 'v1', date: '2026-10-08', shop: 'A' }];
    const after = newAfter('visit', { today: '2026-10-08', visits: old });
    expect(after.skip).toEqual(['v1']);
    const n = note('a', { after });
    expect(afterHit(n, { visits: old, today: '2026-10-09' })).toBe(null);
    const visits = [...old, { id: 'v2', date: '2026-10-09', shop: `${P}Shop` }];
    expect(afterHit(n, { visits, today: '2026-10-09' })).toEqual({ kind: 'visit', day: '2026-10-09', title: `${P}Shop` });
    expect(afterDue([n], { visits, today: '2026-10-09' })).toHaveLength(1);
    expect(afterWaiting([n], { visits: old, today: '2026-10-09' })).toHaveLength(1);
    expect(afterHit({ ...n, after: { ...after, done: true } }, { visits, today: '2026-10-09' })).toBe(null);
  });
  it('unknown kinds or days give nothing', () => {
    expect(newAfter('rain', { today: '2026-10-08' })).toBe(null);
    expect(newAfter('trip', { today: 'soon' })).toBe(null);
  });
});

describe('restore with attachments', () => {
  it('counts photos, files, links and notes that link to it; names linked notes in the trash', () => {
    const gone = note('g', { photo: 'data:image/png;base64,x', photos: ['data:image/png;base64,y'], link: { url: 'https://example.org', title: 'x' }, links: [{ kind: 'note', ref: 'b' }, { kind: 'note', ref: 'c' }, { kind: 'note', ref: 'lost' }] });
    const row = { id: 'trash:g', noteId: 'g', note: gone };
    const other = { id: 'trash:c', noteId: 'c', note: note('c') };
    const back = { id: 'trash:d', noteId: 'd', note: note('d', { links: [{ kind: 'note', ref: 'g' }] }) };
    const notes = [note('b'), note('e', { links: [{ kind: 'note', ref: 'g' }] })];
    const files = [{ id: 'f1', kind: 'notefile', noteId: 'g' }, { id: 'f2', kind: 'notefile', noteId: 'b' }];
    const x = restoreInfo(row, { files, notes, trash: [row, other, back] });
    expect(x).toMatchObject({ photos: 2, files: 1, links: 3, back: 1, gone: 1 });
    expect(x.inTrash.map((r) => r.id)).toEqual(['trash:c', 'trash:d']);
  });
  it('a note without anything comes back as it was', () => {
    expect(restoreInfo({ id: 'trash:z', noteId: 'z', note: note('z') })).toMatchObject({ photos: 0, files: 0, links: 0, back: 0, gone: 0, inTrash: [] });
  });
});
