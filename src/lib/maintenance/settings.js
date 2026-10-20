/**
 * «App-Wartung» (Noah 13.10.2026, BF4 BF7 BF8, built without mockups at his word): the settings of the
 * card Ich › App maintenance, one record in db.settings (MAINT_KEY, travels in backups like every
 * setting). Everything is a suggestion: both switches can be turned off, every key can be changed or
 * removed.
 *   snap: a copy of the data before every update (snapshots.js), default on
 *   hint: the calm line on Today when something is due (check.js), default on
 *   keys: keys that end on a date, e.g. the AI helper key: [{ id, name, until: 'YYYY-MM-DD' }]
 */
export const MAINT_KEY = 'maintenance';

/**
 * The list starts empty (Noah 20.10.2026: his AI helper key has no end date). Until then the list began
 * with an assumed «AI helper key» until 10 November 2026; that entry, still unchanged, is dropped when
 * read. A key the person added or changed stays.
 */
export const DEFAULT_KEYS = [];
const OLD_DEFAULT = (k) => k?.id === 'ai-helper' && k?.until === '2026-11-10';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const validKey = (k) => k && typeof k === 'object' && typeof k.name === 'string' && k.name.trim() && DAY_RE.test(k.until ?? '');

/** The stored value with the defaults filled in. */
export function maintOf(v) {
  return {
    snap: v?.snap !== false,
    hint: v?.hint !== false,
    keys: Array.isArray(v?.keys) ? v.keys.filter((k) => validKey(k) && !OLD_DEFAULT(k)).map((k, i) => ({ id: String(k.id ?? `key-${i}`), name: k.name.trim(), until: k.until })) : DEFAULT_KEYS.map((k) => ({ ...k })),
  };
}

export async function readMaint(db) {
  return maintOf((await db.settings.get(MAINT_KEY))?.value);
}

export async function saveMaint(db, patch) {
  const cur = await readMaint(db);
  await db.settings.put({ key: MAINT_KEY, value: JSON.parse(JSON.stringify(maintOf({ ...cur, ...patch }))) });
}
