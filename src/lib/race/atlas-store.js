/**
 * «Rennatlas»: your race list stays in the app (the settings record 'rennatlas', so it is in the backup
 * and on your other devices): { fileName, asOf, rows, saved: [{ id, name, filter }] }. The file is only
 * read on this device. A newer file replaces the races but keeps what you ticked (favourite,
 * registered, the alarm) and the saved filters.
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { keyOf } from './atlas.js';
import { newFilter } from './atlas-view.js';

export const ATLAS_KEY = 'rennatlas';
export const MAX_SAVED = 20;

/** The stored atlas, live: the record or null. */
export const atlasQuery = () => liveQuery(async () => (await db.settings.get(ATLAS_KEY))?.value ?? null);

async function patchAtlas(fn) {
  let before = null;
  await db.transaction('rw', db.settings, async () => {
    before = (await db.settings.get(ATLAS_KEY))?.value ?? null;
    const next = fn(before);
    if (next == null) await db.settings.delete(ATLAS_KEY);
    else await db.settings.put({ key: ATLAS_KEY, value: next });
  });
  return before;
}

/** Take a file: new rows, the marks and the saved filters of before stay. Returns the old record (for Undo). */
export const loadAtlas = ({ fileName, asOf, rows }) =>
  patchAtlas((cur) => {
    const old = new Map((cur?.rows ?? []).map((r) => [keyOf(r), r]));
    return {
      fileName,
      asOf,
      rows: rows.map((r) => {
        const o = old.get(keyOf(r));
        return o ? { ...r, fav: r.fav || o.fav, registered: r.registered || o.registered, ...(o.wecker ? { wecker: true } : {}) } : r;
      }),
      saved: cur?.saved ?? [],
    };
  });

/** Put a stored atlas back as it was (Undo); null removes it. */
export const putAtlas = (value) => patchAtlas(() => value);

/** Change one race by its key: patch is merged. */
export const markRace = (key, patch) =>
  patchAtlas((cur) => (cur ? { ...cur, rows: cur.rows.map((r) => (keyOf(r) === key ? { ...r, ...patch } : r)) } : cur));

const sameFilter = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// a plain copy: a filter that comes from the page can hold proxies that the database cannot store
const clean = (f) => JSON.parse(JSON.stringify({ ...newFilter(), ...f, show: 'all' }));

/** Save the filter that is on under a name (a saved name that exists is replaced). */
export const saveFilter = (name, filter) =>
  patchAtlas((cur) => {
    if (!cur) return cur;
    const label = String(name ?? '').trim().slice(0, 40);
    if (!label) return cur;
    const saved = cur.saved.filter((s) => s.name !== label);
    saved.push({ id: `f${Date.now().toString(36)}${saved.length}`, name: label, filter: clean(filter) });
    return { ...cur, saved: saved.slice(-MAX_SAVED) };
  });

export const renameFilter = (id, name) =>
  patchAtlas((cur) => {
    const label = String(name ?? '').trim().slice(0, 40);
    return cur && label ? { ...cur, saved: cur.saved.map((s) => (s.id === id ? { ...s, name: label } : s)) } : cur;
  });

export const deleteFilter = (id) => patchAtlas((cur) => (cur ? { ...cur, saved: cur.saved.filter((s) => s.id !== id) } : cur));

/** The saved filter that equals the one on (its id), or ''. */
export const savedIdOf = (saved = [], filter) => saved.find((s) => sameFilter(clean(s.filter), clean(filter)))?.id ?? '';
