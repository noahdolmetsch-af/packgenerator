/**
 * «Links pro Rennen» (Noah 27.10.2026): the links of a race (stored.links = [{ id, text, url }]).
 * Pure functions; tested in tests/race-links.test.js.
 */
import { newId } from './race.js';

/** The usual links of a race, offered as one-tap buttons while they are missing (English keys for t()). */
export const LINK_KINDS = [
  { key: 'handbook', name: 'Handbook' },
  { key: 'rules', name: 'Rules|race' },
  { key: 'tracker', name: 'Tracker' },
  { key: 'website', name: 'Website' },
];

/** A web address you can open, or null. «example.org/x» gets https:// in front. */
export function safeUrl(u) {
  const s = String(u ?? '').trim();
  if (!s || /\s/.test(s)) return null;
  const full = /^https?:\/\//i.test(s) ? s : /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(s) ? `https://${s}` : null;
  if (!full) return null;
  try {
    return new URL(full).href;
  } catch {
    return null;
  }
}

/**
 * The rows to show: your links, or (none saved yet) the old rules link as the first row. A row whose name
 * is an address gets the address as its link and the site as its name.
 */
export function linksOf(stored = {}, t = (x) => x) {
  const base = Array.isArray(stored?.links) ? stored.links : stored?.rulesUrl ? [{ id: 'rules', text: t('Rules|race'), url: stored.rulesUrl }] : [];
  return base.map((r) => {
    const url = String(r.url ?? '').trim();
    if (!url && safeUrl(r.text)) return { ...r, url: safeUrl(r.text), text: new URL(safeUrl(r.text)).host.replace(/^www\./, '') };
    return { id: r.id, text: String(r.text ?? ''), url };
  });
}

/** The list with one more row of that kind (no address yet). */
export const withKind = (rows, kind, t = (x) => x) => [...rows, { id: newId('l'), text: t(kind.name), url: '' }];
