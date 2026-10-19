/**
 * v0.48.0 «Notizen» (Noah 12a-17a): the notes kept in the app, beside the Eingang.
 * A note is a record of the notes table with status 'kept' (written here, or an inbox entry filed
 * as «Einfach behalten»):
 *   { id, kind: 'note', status: 'kept', at, editedAt?, title?, text, topic, pinned?, photo?,
 *     link?: { title, url }, checklist?: [{ text, done }], bikeId?, links?: [{ kind, ref, label }] }
 * - 5 fixed topics (inbox.js TOPICS) plus #tags in the text; at most 3 pinned (14a, 15a).
 * - A shared link keeps its title and address; nothing is fetched online (16a).
 * - «Aus Notiz wird …» makes a trip idea, a wish or a bike problem; the note stays and links to it.
 * - Notes are in the normal backup (the notes table); notesMarkdown is the Markdown export (17a).
 * - Today shows one line only for pinned notes with an open checklist (todayNotes).
 * Pure functions; the page writes the records.
 */
import { TOPICS, guessTopic } from './inbox.js';

export { TOPICS, guessTopic };

/**
 * «Gruppen überall» (Noah 18.10.2026): a note's topic as shown. A note without a topic counts as
 * «General» (as before); a topic the person deleted (or «General» deleted) shows as «Ohne Thema» ('').
 */
export const NO_TOPIC = '';
export function noteTopic(n) {
  const k = n?.topic ?? 'general';
  return TOPICS.some((x) => x.key === k) ? k : NO_TOPIC;
}
/** A topic as shown: a typed name as it is (never through t()), a Standard name translated; '' is «No topic». */
export function topicText(k, tr) {
  const x = TOPICS.find((y) => y.key === k);
  return !x ? tr('No topic') : x.raw ? x.name : tr(x.name);
}
export const MAX_PINNED = 3;

/** Is this a kept note (the Notes page), not an open inbox entry or one filed elsewhere? */
export const isKept = (n) => n?.status === 'kept';

/** The #tags in a text, lower case, each once: «#druck #Gravel» → ['druck', 'gravel']. */
export function tagsOf(text = '') {
  return [...new Set([...String(text).matchAll(/(^|\s)#([\p{L}\p{N}_-]{2,30})/gu)].map((m) => m[2].toLowerCase()))];
}

/** A link from a shared or pasted text: the first http(s) address; the title is what is left. */
export function linkFrom(text = '') {
  const m = String(text).match(/https?:\/\/[^\s<>"]+/i);
  if (!m) return null;
  const url = m[0].replace(/[).,;]+$/, '');
  const rest = String(text).replace(m[0], '').trim().replace(/\s+/g, ' ');
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
  return { title: rest || host, url, host };
}

/** Checklist lines typed in the capture field: «- Gas», «[ ] Riegel», «[x] Wachs». */
export function checklistFrom(text = '') {
  const lines = String(text).split('\n');
  const items = [];
  const rest = [];
  for (const l of lines) {
    const m = l.match(/^\s*(?:[-*•]|\[( |x|X)?\])\s+(.+)$/);
    if (m) items.push({ text: m[2].trim(), done: /x/i.test(m[1] ?? '') });
    else rest.push(l);
  }
  return { items, text: rest.join('\n').trim() };
}

/**
 * A new kept note from the capture field. The first line becomes the title when the text has more
 * lines; the topic comes from the text unless one is given; a link in the text is kept as a link.
 */
export function newKeptNote({ text = '', photo = null, topic = null, checklist = [], link = null, dictated = false }, { id, now = new Date().toISOString() }) {
  const parsed = checklistFrom(text);
  const items = [...parsed.items, ...checklist.filter((c) => c.text?.trim())];
  const lk = link ?? linkFrom(parsed.text);
  let body = lk && !link ? parsed.text.replace(lk.url, '').trim() : parsed.text;
  const lines = body.split('\n');
  let title = '';
  if ((lines.length > 1 || items.length) && lines[0] && lines[0].length <= 80) {
    title = lines[0].trim();
    body = lines.slice(1).join('\n').trim();
  } else if (!body && lk) title = lk.title;
  return {
    id, kind: 'note', status: 'kept', at: now, editedAt: now, title, text: body,
    topic: topic ?? guessTopic(`${title} ${body} ${lk?.title ?? ''}`),
    pinned: false, photo, ...(lk ? { link: { title: lk.title, url: lk.url } } : {}),
    ...(items.length ? { checklist: items } : {}), ...(dictated ? { dictated: true } : {}),
  };
}

/** The name of a note: its title, else its first line. */
export const noteTitle = (n) => (n.title || (n.text ?? '').split('\n')[0] || n.link?.title || '').trim();

/** How far a checklist is: { done, total } (total 0: no checklist). */
export function progress(n) {
  const c = n.checklist ?? [];
  return { done: c.filter((x) => x.done).length, total: c.length };
}

/** Pin or unpin. At most MAX_PINNED: → { ok: false } when a 4th would be pinned. */
export function togglePin(notes, id) {
  const n = notes.find((x) => x.id === id);
  if (!n) return { ok: false };
  if (n.pinned) return { ok: true, pinned: false };
  if (notes.filter((x) => isKept(x) && x.pinned).length >= MAX_PINNED) return { ok: false, full: true };
  return { ok: true, pinned: true };
}

/**
 * The filters of the side list with their counts. The topic filters follow the person's topics
 * (setTopics rebuilds them in place); «Ohne Thema» (key 'topic:') counts the notes of deleted topics.
 */
export const FILTERS = [];
const buildFilters = () => [
  { key: 'all', name: 'All notes', test: () => true },
  { key: 'pinned', name: 'Pinned', test: (n) => !!n.pinned },
  ...TOPICS.map((x) => ({ key: `topic:${x.key}`, name: x.name, raw: !!x.raw, topic: x.key, test: (n) => noteTopic(n) === x.key })),
  { key: `topic:${NO_TOPIC}`, name: 'No topic', topic: NO_TOPIC, none: true, test: (n) => noteTopic(n) === NO_TOPIC },
  { key: 'check', name: 'Checklist', has: true, test: (n) => (n.checklist ?? []).length > 0 },
  { key: 'link', name: 'Link', has: true, test: (n) => !!n.link?.url },
  { key: 'photo', name: 'Photo', has: true, test: (n) => !!n.photo },
  { key: 'linked', name: 'Linked', has: true, test: (n) => !!n.bikeId || (n.links ?? []).length > 0 },
];
FILTERS.push(...buildFilters());

/** Puts the person's topics in place: [{ key, name, raw? }] (lists.js, from «Listen und Typen»). */
export function setTopics(list) {
  TOPICS.splice(0, TOPICS.length, ...list.map((x) => ({ key: x.key, name: x.name, ...(x.raw ? { raw: true } : {}) })));
  FILTERS.splice(0, FILTERS.length, ...buildFilters());
}

/** Kept notes matching a filter and a search (text, title, link, checklist, tags), newest first. */
export function noteList(notes, { filter = 'all', query = '' } = {}) {
  const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return notes
    .filter(isKept)
    .filter(f.test)
    .filter((n) => {
      if (!words.length) return true;
      const hay = [n.title, n.text, n.link?.title, n.link?.url, ...(n.checklist ?? []).map((c) => c.text)].filter(Boolean).join(' ').toLowerCase();
      return words.every((w) => hay.includes(w.replace(/^#/, '')));
    })
    .sort((a, b) => (b.editedAt ?? b.at ?? '').localeCompare(a.editedAt ?? a.at ?? ''));
}

/** Counts per filter key. */
export function filterCounts(notes) {
  const kept = notes.filter(isKept);
  return Object.fromEntries(FILTERS.map((f) => [f.key, kept.filter(f.test).length]));
}

/**
 * Today (17a): one line per pinned note with an open checklist, at most 2.
 * → [{ id, title, open, total }]
 */
export function todayNotes(notes, max = 2) {
  return notes
    .filter((n) => isKept(n) && n.pinned)
    .map((n) => ({ n, p: progress(n) }))
    .filter(({ p }) => p.total > p.done)
    .slice(0, max)
    .map(({ n, p }) => ({ id: n.id, title: noteTitle(n), open: p.total - p.done, total: p.total }));
}

/** All kept notes as one Markdown text (17a), grouped by topic; topicName: key → shown name. */
export function notesMarkdown(notes, { topicName = (k) => k, bikeName = () => '', today = '' } = {}) {
  const kept = notes.filter(isKept).sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  const out = [`# ${topicName('__title')}${today ? ` (${today})` : ''}`, ''];
  for (const x of [...TOPICS, { key: NO_TOPIC }]) {
    const rows = kept.filter((n) => noteTopic(n) === x.key);
    if (!rows.length) continue;
    out.push(`## ${topicName(x.key)}`, '');
    for (const n of rows) {
      out.push(`### ${noteTitle(n) || '…'}${n.pinned ? ` (${topicName('__pinned')})` : ''}`);
      out.push(`_${(n.at ?? '').slice(0, 10)}${n.bikeId && bikeName(n.bikeId) ? ` · ${bikeName(n.bikeId)}` : ''}_`, '');
      if (n.text && n.text !== noteTitle(n)) out.push(n.text, '');
      if (n.link?.url) out.push(`[${n.link.title || n.link.url}](${n.link.url})`, '');
      for (const c of n.checklist ?? []) out.push(`- [${c.done ? 'x' : ' '}] ${c.text}`);
      if ((n.checklist ?? []).length) out.push('');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** A note with one more link to what it became («Aus Notiz wird …»). */
export const addLink = (note, link, now = new Date().toISOString()) => ({ ...note, links: [...(note.links ?? []), link], editedAt: now });

/*
 * Paket N #10 «Notizen suchen, verknüpfen, auswerten» (19.10.2026): a note can link to other notes.
 * The link is kept once, on the note where it was made ({ kind: 'note', ref, label }); the other note
 * shows it as well («links here»). Pure functions; the sheet writes the records.
 */

/** The notes linked with a note, both ways: [{ id, title, own }] (own: the link is kept on this note). */
export function linkedNotes(note, notes = []) {
  if (!note) return [];
  const byId = new Map(notes.filter(isKept).map((n) => [n.id, n]));
  const out = new Map();
  for (const l of note.links ?? []) if (l.kind === 'note' && byId.has(l.ref) && l.ref !== note.id) out.set(l.ref, { id: l.ref, title: noteTitle(byId.get(l.ref)), own: true });
  for (const n of byId.values()) {
    if (n.id === note.id || out.has(n.id)) continue;
    if ((n.links ?? []).some((l) => l.kind === 'note' && l.ref === note.id)) out.set(n.id, { id: n.id, title: noteTitle(n), own: false });
  }
  return [...out.values()];
}

/** The note with a link to another note (once; never to itself). */
export function linkNote(note, other, now = new Date().toISOString()) {
  if (!other || other.id === note.id || (note.links ?? []).some((l) => l.kind === 'note' && l.ref === other.id)) return note;
  return addLink(note, { kind: 'note', ref: other.id, label: noteTitle(other).slice(0, 60) }, now);
}

/** The note without its link to another note. */
export const unlinkNote = (note, otherId, now = new Date().toISOString()) => ({ ...note, links: (note.links ?? []).filter((l) => !(l.kind === 'note' && l.ref === otherId)), editedAt: now });

/**
 * Notes that may belong to this one (shared #tags or the same bike), not linked yet, at most `max`.
 * → [{ id, title, why: 'tag' | 'bike', tag? }]
 */
export function maybeRelated(note, notes = [], max = 3) {
  if (!note) return [];
  const linked = new Set(linkedNotes(note, notes).map((x) => x.id));
  const mine = new Set(tagsOf(`${note.title ?? ''} ${note.text ?? ''}`));
  const out = [];
  for (const n of notes.filter(isKept).sort((a, b) => (b.editedAt ?? b.at ?? '').localeCompare(a.editedAt ?? a.at ?? ''))) {
    if (n.id === note.id || linked.has(n.id)) continue;
    const tag = tagsOf(`${n.title ?? ''} ${n.text ?? ''}`).find((x) => mine.has(x));
    if (tag) out.push({ id: n.id, title: noteTitle(n), why: 'tag', tag });
    else if (note.bikeId && n.bikeId === note.bikeId) out.push({ id: n.id, title: noteTitle(n), why: 'bike' });
    if (out.length >= max) break;
  }
  return out;
}

/** Kept notes found by a search for the link picker (title and text), without the note itself, at most `max`. */
export function pickNotes(note, notes = [], query = '', max = 6) {
  return noteList(notes, { query }).filter((n) => n.id !== note?.id).slice(0, max).map((n) => ({ id: n.id, title: noteTitle(n) }));
}

/**
 * The small evaluation on the Notes page: { total, month, topTags: [{ tag, n }], openPoints,
 * openLists, linked, oldestOpen: { id, title, at } | null }. today: 'YYYY-MM-DD' (localDay()).
 */
export function noteStats(notes = [], today = '') {
  const kept = notes.filter(isKept);
  const month = today.slice(0, 7);
  const tags = new Map();
  for (const n of kept) for (const tg of tagsOf(`${n.title ?? ''} ${n.text ?? ''}`)) tags.set(tg, (tags.get(tg) ?? 0) + 1);
  const open = kept.filter((n) => progress(n).total > progress(n).done).sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''));
  const linkedIds = new Set();
  for (const n of kept) for (const l of n.links ?? []) if (l.kind === 'note') (linkedIds.add(n.id), linkedIds.add(l.ref));
  return {
    total: kept.length,
    month: month ? kept.filter((n) => (n.at ?? '').slice(0, 7) === month).length : 0,
    topTags: [...tags].map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag)).slice(0, 5),
    openPoints: open.reduce((a, n) => a + progress(n).total - progress(n).done, 0),
    openLists: open.length,
    linked: kept.filter((n) => linkedIds.has(n.id)).length,
    oldestOpen: open[0] ? { id: open[0].id, title: noteTitle(open[0]), at: open[0].at } : null,
  };
}
