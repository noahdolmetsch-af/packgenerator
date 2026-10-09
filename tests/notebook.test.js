// v0.48.0 «Notizen»: kept notes, topics, tags, pinning, checklists, Markdown, the line on Today.
import { describe, it, expect } from 'vitest';
import { tagsOf, linkFrom, checklistFrom, newKeptNote, togglePin, noteList, filterCounts, todayNotes, notesMarkdown, noteTitle, addLink, MAX_PINNED } from '../src/lib/notebook.js';

const P = 'test_data_gtp_';
const kept = (id, extra = {}) => ({ id, kind: 'note', status: 'kept', at: '2026-10-01T08:00:00.000Z', title: `${P} ${id}`, text: '', topic: 'general', ...extra });

describe('capture', () => {
  it('reads #tags, a link and checklist lines', () => {
    expect(tagsOf('Vorne 2,1 bar #druck #Gravel #druck')).toEqual(['druck', 'gravel']);
    expect(linkFrom(`${P} Route https://example.org/r?x=1).`)).toEqual({ title: `${P} Route`, url: 'https://example.org/r?x=1', host: 'example.org' });
    expect(linkFrom('no link')).toBeNull();
    expect(checklistFrom('Einkaufen\n- Gas\n[x] Wachs\n[ ] Riegel')).toEqual({ items: [{ text: 'Gas', done: false }, { text: 'Wachs', done: true }, { text: 'Riegel', done: false }], text: 'Einkaufen' });
  });

  it('makes a kept note: title from the first line, topic from the text, the link kept, nothing fetched', () => {
    const n = newKeptNote({ text: `${P} Jura-Wochenende\nRoute über den Pass\n- Gas` }, { id: 'n1', now: '2026-10-09T07:00:00.000Z' });
    expect(n).toMatchObject({ status: 'kept', title: `${P} Jura-Wochenende`, text: 'Route über den Pass', topic: 'trips', checklist: [{ text: 'Gas', done: false }], pinned: false });
    const l = newKeptNote({ text: `${P} Via Valtellina https://example.org/route` }, { id: 'n2' });
    expect(l.link).toEqual({ title: `${P} Via Valtellina`, url: 'https://example.org/route' });
    expect(newKeptNote({ text: 'Intervalle 4×8 min Schwelle' }, { id: 'n3' }).topic).toBe('training');
    expect(newKeptNote({ text: 'irgendwas', topic: 'gear' }, { id: 'n4' }).topic).toBe('gear');
  });
});

describe('pinning, lists and Today', () => {
  const notes = [
    kept('a', { pinned: true, checklist: [{ text: 'x', done: true }, { text: 'y', done: false }] }),
    kept('b', { pinned: true, topic: 'bike', link: { title: 'L', url: 'https://example.org' }, at: '2026-10-05T08:00:00.000Z' }),
    kept('c', { pinned: true, checklist: [{ text: 'z', done: true }] }),
    kept('d', { topic: 'trips', text: 'Mit Zug #zug', at: '2026-10-08T08:00:00.000Z' }),
    { id: 'open', status: 'open', text: 'inbox entry', at: '2026-10-09T08:00:00.000Z' },
  ];
  it('pins at most 3', () => {
    expect(MAX_PINNED).toBe(3);
    expect(togglePin(notes, 'd')).toEqual({ ok: false, full: true });
    expect(togglePin(notes, 'a')).toEqual({ ok: true, pinned: false });
  });
  it('filters and searches only kept notes, newest first', () => {
    expect(noteList(notes).map((n) => n.id)).toEqual(['d', 'b', 'a', 'c']);
    expect(noteList(notes, { filter: 'topic:bike' }).map((n) => n.id)).toEqual(['b']);
    expect(noteList(notes, { filter: 'check' }).map((n) => n.id)).toEqual(['a', 'c']);
    expect(noteList(notes, { query: '#zug' }).map((n) => n.id)).toEqual(['d']);
    expect(filterCounts(notes)).toMatchObject({ all: 4, pinned: 3, link: 1, 'topic:trips': 1 });
  });
  it('Today: one line only for pinned notes with an open checklist', () => {
    expect(todayNotes(notes)).toEqual([{ id: 'a', title: `${P} a`, open: 1, total: 2 }]);
  });
  it('exports Markdown by topic with checklists and links', () => {
    const md = notesMarkdown(notes, { topicName: (k) => ({ __title: 'Notes', __pinned: 'pinned', bike: 'Bike', trips: 'Trip ideas', general: 'General' })[k] ?? k });
    expect(md).toContain('# Notes');
    expect(md).toContain('## Bike');
    expect(md).toContain(`### ${P} a (pinned)`);
    expect(md).toContain('- [x] x\n- [ ] y');
    expect(md).toContain('[L](https://example.org)');
    expect(md).not.toContain('inbox entry');
  });
  it('keeps the note when something is made from it', () => {
    const n = addLink(kept('e'), { kind: 'wish', ref: 'LX01', label: 'Wishlist' }, 'now');
    expect(n.links).toEqual([{ kind: 'wish', ref: 'LX01', label: 'Wishlist' }]);
    expect(noteTitle({ text: 'first\nsecond' })).toBe('first');
  });
});
