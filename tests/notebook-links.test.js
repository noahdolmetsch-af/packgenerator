// Paket N #10: links between notes, «Passt vielleicht dazu» and the small evaluation (fictional notes).
import { describe, it, expect } from 'vitest';
import { linkedNotes, linkNote, unlinkNote, maybeRelated, pickNotes, noteStats } from '../src/lib/notebook.js';

const n = (id, extra = {}) => ({ id, kind: 'note', status: 'kept', at: '2026-10-01T08:00:00Z', title: `Titel ${id}`, text: '', ...extra });

describe('note links', () => {
  const a = n('a', { text: 'Pass fahren #alpen' });
  const b = n('b', { text: 'Packliste #alpen', at: '2026-10-05T08:00:00Z' });
  const c = n('c', { bikeId: 'v1' });
  const d = n('d', { bikeId: 'v1', at: '2026-10-03T08:00:00Z' });

  it('keeps a link once and shows it on both notes', () => {
    const a2 = linkNote(linkNote(a, b), b);
    expect(a2.links.filter((l) => l.kind === 'note')).toHaveLength(1);
    const all = [a2, b, c];
    expect(linkedNotes(a2, all)).toEqual([{ id: 'b', title: 'Titel b', own: true }]);
    expect(linkedNotes(b, all)).toEqual([{ id: 'a', title: 'Titel a', own: false }]);
  });

  it('never links a note to itself and unlinks again', () => {
    expect(linkNote(a, a)).toBe(a);
    const a2 = unlinkNote(linkNote(a, b), 'b');
    expect(linkedNotes(a2, [a2, b])).toEqual([]);
  });

  it('ignores links to deleted notes', () => {
    expect(linkedNotes(linkNote(a, b), [a])).toEqual([]);
  });

  it('suggests notes with the same #tag or bike, not the linked ones', () => {
    expect(maybeRelated(a, [a, b, c])).toEqual([{ id: 'b', title: 'Titel b', why: 'tag', tag: 'alpen' }]);
    expect(maybeRelated(c, [a, b, c, d])).toEqual([{ id: 'd', title: 'Titel d', why: 'bike' }]);
    expect(maybeRelated(linkNote(a, b), [a, b])).toEqual([]);
  });

  it('finds notes to link by search, without the note itself', () => {
    expect(pickNotes(a, [a, b, c], 'packliste').map((x) => x.id)).toEqual(['b']);
    expect(pickNotes(a, [a, b], '').map((x) => x.id)).toEqual(['b']);
  });
});

describe('noteStats', () => {
  it('counts the month, tags, open points and links', () => {
    const notes = [
      n('a', { text: '#alpen #zelt', checklist: [{ text: 'x', done: false }, { text: 'y', done: true }] }),
      n('b', { text: '#alpen', at: '2026-09-01T08:00:00Z', links: [{ kind: 'note', ref: 'a', label: 'a' }] }),
      n('c', { status: 'open', text: '#alpen' }),
    ];
    const s = noteStats(notes, '2026-10-19');
    expect(s.total).toBe(2);
    expect(s.month).toBe(1);
    expect(s.topTags).toEqual([{ tag: 'alpen', n: 2 }, { tag: 'zelt', n: 1 }]);
    expect(s.openPoints).toBe(1);
    expect(s.openLists).toBe(1);
    expect(s.linked).toBe(2);
    expect(s.oldestOpen.id).toBe('a');
  });
});
