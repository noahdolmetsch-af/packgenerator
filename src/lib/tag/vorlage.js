/**
 * «Tagesvorlagen und Wiederholen» (Noah 25.11.2026 «1-3», Idee 3): a day that went well is kept as a template and put on other days,
 * and an own entry can be repeated every week. Pure rules, tested in tests/tag-vorlage.test.js; the pages are
 * src/lib/tag/VorlageSheet.svelte, EntrySheet.svelte and Tag.svelte.
 *
 * - A template (setting TEMPLATES_KEY, travels in every backup): { id, name, items: [{ kind: 'date' | 'todo', title, time, mins? }] },
 *   made from the own dates and to-dos of a day (not done ones are not required: a ticked one counts too, it is only a pattern).
 * - Putting a template on a day adds its entries as ordinary own entries; what is already there (same title and time) is not added twice.
 * - Repeating: the entry is copied to the same weekday of the next 4 or 8 weeks as ordinary own entries (nothing hidden, each can be changed
 *   or deleted alone); the copies carry the ref `rep:<id>` so a second repeat does not double them.
 */
import { cleanItem } from '../woche.js';

export const TEMPLATES_KEY = 'week.templates';
export const MAX_TEMPLATES = 20;
export const MAX_ITEMS = 30;
export const REPEAT_WEEKS = [4, 8];

const clip = (s, n) => String(s ?? '').trim().slice(0, n);

/** The templates as stored, made safe. */
export function templatesOf(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const x of v) {
    const name = clip(x?.name, 40);
    if (!name || !Array.isArray(x?.items)) continue;
    const items = x.items
      .map((i) => cleanItem({ ...i, id: 'x', day: '2000-01-01', done: false }))
      .filter(Boolean)
      .slice(0, MAX_ITEMS)
      .map(({ kind, title, time, mins }) => ({ kind, title, time, ...(mins ? { mins } : {}) }));
    if (items.length) out.push({ id: String(x.id || name), name, items });
  }
  return out.slice(0, MAX_TEMPLATES);
}

/** The pattern of a day: its own dates and to-dos (items of the week list, `day` = the day), in time order. */
export function patternOf(items = [], day) {
  return items
    .filter((x) => x && x.day === day && (x.kind === 'date' || x.kind === 'todo'))
    .sort((a, b) => String(a.time || '99:99').localeCompare(String(b.time || '99:99')))
    .slice(0, MAX_ITEMS)
    .map(({ kind, title, time, mins }) => ({ kind, title, time: time || '', ...(mins ? { mins } : {}) }));
}

/** A template with its name made from the items; replaces one of the same name (case aside) instead of keeping two. */
export function saveTemplate(list, name, items, newId) {
  const n = clip(name, 40);
  if (!n || !items.length) return list;
  const same = list.find((x) => x.name.toLowerCase() === n.toLowerCase());
  const row = { id: same?.id ?? newId(), name: n, items: items.slice(0, MAX_ITEMS) };
  return [...list.filter((x) => x !== same), row].slice(-MAX_TEMPLATES);
}

const sameAs = (a, b) => a.title.toLowerCase() === b.title.toLowerCase() && (a.time || '') === (b.time || '');

/** The new own entries when `tpl` is put on `days`; `existing`: the own entries now (to skip what is there). → [item] */
export function putTemplate(tpl, days, existing = [], newId) {
  const made = [];
  for (const day of days) {
    for (const i of tpl.items) {
      const item = cleanItem({ ...i, id: newId(), day, done: false });
      if (!item) continue;
      if ([...existing, ...made].some((x) => x.day === day && sameAs(x, item))) continue;
      made.push(item);
    }
  }
  return made;
}

const addDays = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/** The copies of an entry for the next `weeks` weeks, same weekday. → [item]; none for a to-do without a day. */
export function repeatItems(item, weeks, existing = [], newId) {
  if (!item?.day || !REPEAT_WEEKS.includes(weeks)) return [];
  const root = String(item.ref ?? '').startsWith('rep:') ? item.ref : `rep:${item.id}`;
  const made = [];
  for (let k = 1; k <= weeks; k++) {
    const day = addDays(item.day, 7 * k);
    if (existing.some((x) => x.day === day && (x.ref === root || sameAs(x, item)))) continue;
    const copy = cleanItem({ ...item, id: newId(), day, done: false, ref: root });
    if (copy) made.push(copy);
  }
  return made;
}
