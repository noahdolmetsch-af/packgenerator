// «Mein Tag» step 3b: open points of notes are offered as to-dos, once, on a tap
import { describe, it, expect } from 'vitest';
import { openNoteItems, todoFromItem, NOTE_ITEMS_MAX } from '../src/lib/tag/notetodos.js';

const notes = [
  { id: 'n1', status: 'kept', title: 'Packliste Herbst', checklist: [{ text: 'Gas', done: false }, { text: 'Riegel', done: true }, { text: '  ', done: false }] },
  { id: 'n2', status: 'open', title: 'Roh', checklist: [{ text: 'Soll nicht', done: false }] },
  { id: 'n3', status: 'kept', title: 'Ohne Liste' },
];

describe('openNoteItems', () => {
  it('offers only the open points of kept notes', () => {
    const r = openNoteItems(notes, [], (n) => n.title);
    expect(r.map((x) => [x.noteId, x.text, x.noteName])).toEqual([['n1', 'Gas', 'Packliste Herbst']]);
  });
  it('does not offer a point twice once it is a to-do', () => {
    const first = openNoteItems(notes, [])[0];
    expect(openNoteItems(notes, [{ id: 'td-1', text: 'Gas', src: first.src }])).toEqual([]);
  });
  it('the to-do carries the note as «belongs to»', () => {
    const f = todoFromItem(openNoteItems(notes, [], (n) => n.title)[0]);
    expect(f).toEqual({ text: 'Gas', src: 'note:n1:Gas', links: [{ kind: 'note', ref: 'n1', label: 'Packliste Herbst' }] });
  });
  it('is short and survives rubbish', () => {
    const many = [{ id: 'x', status: 'kept', checklist: Array.from({ length: 100 }, (_, i) => ({ text: `p${i}` })) }];
    expect(openNoteItems(many, []).length).toBe(NOTE_ITEMS_MAX);
    expect(openNoteItems(null, null)).toEqual([]);
    expect(openNoteItems([{ id: 'y', status: 'kept', checklist: 'nope' }], [])).toEqual([]);
  });
});
