/**
 * «Mein Tag» step 3b (Noah 23.11.2026 «dreimal ja»): open points of notes are offered as to-dos, only on a tap.
 * A note keeps its tick list in note.checklist [{ text, done }] (notebook.js). Nothing is turned into a to-do by itself:
 * the tab «To-dos» lists the open points, and one tap makes a to-do of Merken that belongs to the note (links, N3).
 * A to-do made from a point carries src «note:<id>:<text>», so the same point is not offered twice.
 */
export const NOTE_ITEMS_MAX = 30;
const srcOf = (noteId, text) => `note:${noteId}:${String(text).trim().slice(0, 60)}`;

/** The open points of the kept notes that are not a to-do yet: [{ key, src, noteId, noteName, text }]. */
export function openNoteItems(notes, todos, noteName = (n) => n?.title || '') {
  const known = new Set((todos ?? []).map((x) => x.src).filter(Boolean));
  const out = [];
  for (const n of notes ?? []) {
    if (n?.status !== 'kept') continue;
    for (const c of Array.isArray(n.checklist) ? n.checklist : []) {
      const text = String(c?.text ?? '').trim();
      if (!text || c.done) continue;
      const src = srcOf(n.id, text);
      if (known.has(src)) continue;
      out.push({ key: src, src, noteId: n.id, noteName: noteName(n), text });
    }
  }
  return out.slice(0, NOTE_ITEMS_MAX);
}

/** The fields of the to-do that one open point becomes (for merkendb.addTodo). */
export const todoFromItem = (it) => ({ text: it.text, src: it.src, links: [{ kind: 'note', ref: String(it.noteId), label: String(it.noteName ?? '').slice(0, 80) }] });
