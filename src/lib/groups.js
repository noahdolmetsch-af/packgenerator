/**
 * «Gruppen überall» (Noah 18.10.2026, «gruppen umbenennen und löschen soll grundsätzlich überall auf
 * der app möglich sein»): every group a person files things in can be renamed and deleted. Deleting a
 * group that still holds things asks where they go (GroupDeleteSheet.svelte); the first choice is
 * «Ohne Gruppe»: the things keep their old group mark and show under «Ohne …», so «Auf Standard
 * zurücksetzen» brings a deleted Standard group back with its things. Another group moves them there.
 *
 * Pure helpers (tests/groups.test.js) plus one write with its Undo snapshot for «Listen und Typen».
 */
import { noteTopic, isKept } from './notebook.js';

/**
 * Every place where a person sees or chooses groups, with the file that renames and deletes them.
 * The guard test (tests/groups.test.js) checks each file uses the one delete window. A new kind of
 * group in the app is added here, with rename and delete (app rule «Gruppen überall»).
 * Dokumente (Ich › Dokumente, Paket B): renames in the group head (GroupActions), deletes with the same window.
 */
export const GROUP_PLACES = [
  { name: 'Gear categories', file: 'src/pages/Lists.svelte' },
  { name: 'Note topics', file: 'src/pages/Lists.svelte' },
  { name: 'Groups of the bike values', file: 'src/pages/Lists.svelte' },
  { name: 'Building blocks', file: 'src/pages/Blocks.svelte' },
  { name: 'Learnings by topic', file: 'src/lib/review/Learned.svelte' },
  { name: 'Document groups', file: 'src/pages/Docs.svelte' },
  // Paket N «Pläne und Träume» (19.10.2026)
  { name: 'Kinds of tour (Dreams)', file: 'src/pages/Dreams.svelte' },
  { name: 'Compass boxes', file: 'src/pages/Compass.svelte' },
  { name: 'Groups of the links', file: 'src/pages/WebLinks.svelte' }, // Paket L «Werkzeuge und Links»
  { name: 'Neuland collections', file: 'src/pages/Neuland.svelte' }, // «Neuland»: own collections (built-in ones: rename, switch off)
  { name: 'Inspection areas', file: 'src/lib/inspect/EditList.svelte' }, // «Velo-Inspektion»: the areas of the checklist
  { name: 'Impulse areas', file: 'src/lib/frei/Impulse.svelte' }, // Paket T «Freie Zeit»
  { name: 'Collections', file: 'src/lib/frei/Sammlungen.svelte' },
  { name: 'Shopping list groups', file: 'src/lib/alltag/Einkauf.svelte' }, // Paket V «Alltag»
  { name: 'Diary tags', file: 'src/lib/tagebuch/Settings.svelte' }, // «Tagebuch»: tags are its groups
];

/** The items of category `from` moved to `to` (only the ones that change). */
export function moveItems(items, from, to, now = new Date().toISOString()) {
  if (!to || to === from) return [];
  return items.filter((i) => i.category === from).map((i) => ({ ...i, category: to, updatedAt: now }));
}

/** The kept notes shown under topic `from` moved to `to` (a note without a topic counts as «General»). */
export function moveNotes(notes, from, to, now = new Date().toISOString()) {
  if (!to || to === from) return [];
  return notes.filter((n) => isKept(n) && noteTopic(n) === from).map((n) => ({ ...n, topic: to, editedAt: n.editedAt ?? now }));
}

/**
 * «Gelernt» (Rückblick): the topic of the learnings is their group. Renaming changes every learning of
 * the topic; deleting moves them to another topic or to «Ohne Thema» (topic ''). The topic «Open question»
 * marks the open questions of the import and stays as it is (debrief.js reads it).
 */
export const FIXED_LEARN_TOPICS = ['Open question'];
export function retopicLearnings(learnings, from, to) {
  const next = String(to ?? '').trim();
  if (next === from || FIXED_LEARN_TOPICS.includes(from)) return [];
  return learnings.filter((l) => (l.topic ?? '') === from).map((l) => ({ ...l, topic: next }));
}

/** The other groups a deleted one can hand its things to: [{ id, name }] (name: as shown). */
export const targetsOf = (list, id, name = (e) => e.name) => list.filter((e) => e.id !== id && !e.hidden).map((e) => ({ id: e.id, name: name(e) }));

/**
 * Deletes a group in one transaction and returns the snapshot for Undo:
 * settings: the records to write (settings rows, whole); items, notes: the records that change.
 * → { settings: [{ key, before }], items: [before], notes: [before] }
 */
export async function writeGroupChange(db, { settings = [], items = [], notes = [], learnings = [] }) {
  return db.transaction('rw', [db.settings, db.items, db.notes, db.learnings], async () => {
    const snap = { settings: [], items: [], notes: [], learnings: [] };
    for (const rec of settings) {
      snap.settings.push({ key: rec.key, before: (await db.settings.get(rec.key)) ?? null });
      await db.settings.put(rec);
    }
    if (items.length) {
      snap.items = (await db.items.bulkGet(items.map((i) => i.id))).filter(Boolean);
      await db.items.bulkPut(items);
    }
    if (notes.length) {
      snap.notes = (await db.notes.bulkGet(notes.map((n) => n.id))).filter(Boolean);
      await db.notes.bulkPut(notes);
    }
    if (learnings.length) {
      snap.learnings = (await db.learnings.bulkGet(learnings.map((l) => l.id))).filter(Boolean);
      await db.learnings.bulkPut(learnings);
    }
    return snap;
  });
}

/** Undo of writeGroupChange: everything as it was before. */
export async function undoGroupChange(db, snap) {
  if (!snap) return;
  await db.transaction('rw', [db.settings, db.items, db.notes, db.learnings], async () => {
    for (const s of snap.settings ?? []) {
      if (s.before) await db.settings.put(s.before);
      else await db.settings.delete(s.key);
    }
    if (snap.items?.length) await db.items.bulkPut(snap.items);
    if (snap.notes?.length) await db.notes.bulkPut(snap.notes);
    if (snap.learnings?.length) await db.learnings.bulkPut(snap.learnings);
  });
}
