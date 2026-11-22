// «Frag die App merkt sich Fragen» (S6, Noah 21.11.2026 «5a»): questions the app could not answer.
// Only on this device: they sit in localStorage, never in the database, so they never reach a backup or the sync.
export const OPEN_KEY = 'pg.openq';
export const MAX_OPEN = 20;
const MAX_LEN = 140;

/** The same question typed with other capitals or spaces is the same question. */
export const keyOf = (q) => String(q ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

/** The list after the question was asked and not answered: newest first, once per question with a count. */
export function noteOpen(list, q, day) {
  const text = String(q ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_LEN);
  const key = keyOf(text);
  if (key.length < 3) return list ?? [];
  const old = (list ?? []).find((e) => e.key === key);
  const rest = (list ?? []).filter((e) => e.key !== key);
  return [{ key, q: old?.q ?? text, n: (old?.n ?? 0) + 1, day }, ...rest].slice(0, MAX_OPEN);
}

export const dropOpen = (list, key) => (list ?? []).filter((e) => e.key !== key);
export const hasOpen = (list, q) => (list ?? []).some((e) => e.key === keyOf(q));

/** What was read back, made safe: broken entries go, the rest keeps its order. */
export function cleanOpen(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e.q === 'string' && keyOf(e.q).length >= 3)
    .map((e) => ({ key: keyOf(e.q), q: e.q.slice(0, MAX_LEN), n: Number.isFinite(e.n) && e.n > 0 ? Math.floor(e.n) : 1, day: typeof e.day === 'string' ? e.day : '' }))
    .slice(0, MAX_OPEN);
}

export function loadOpen(storage = globalThis.localStorage) {
  try {
    return cleanOpen(JSON.parse(storage.getItem(OPEN_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function saveOpen(list, storage = globalThis.localStorage) {
  try {
    if (list.length) storage.setItem(OPEN_KEY, JSON.stringify(list));
    else storage.removeItem(OPEN_KEY);
  } catch {
    /* private mode or full: the list just does not stay */
  }
}
