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

/** The filters of the side list with their counts. */
export const FILTERS = [
  { key: 'all', name: 'All notes', test: () => true },
  { key: 'pinned', name: 'Pinned', test: (n) => !!n.pinned },
  ...TOPICS.map((x) => ({ key: `topic:${x.key}`, name: x.name, topic: x.key, test: (n) => (n.topic ?? 'general') === x.key })),
  { key: 'check', name: 'Checklist', has: true, test: (n) => (n.checklist ?? []).length > 0 },
  { key: 'link', name: 'Link', has: true, test: (n) => !!n.link?.url },
  { key: 'photo', name: 'Photo', has: true, test: (n) => !!n.photo },
  { key: 'linked', name: 'Linked', has: true, test: (n) => !!n.bikeId || (n.links ?? []).length > 0 },
];

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
  for (const x of TOPICS) {
    const rows = kept.filter((n) => (n.topic ?? 'general') === x.key);
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
