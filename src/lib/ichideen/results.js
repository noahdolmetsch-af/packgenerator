/**
 * Einzelidee 27 (996 Ideen, Noah 25.10.2026 «bauen»): «Letzte Ergebnisse» of the Werkzeugkasten.
 * Every file a tool saves or shares (deliver() in tools/tools.js: a smaller PDF, a cut photo, a QR
 * code, a measured route …) is also kept here, so it can be found again later: the newest RESULTS_MAX,
 * each at most RESULT_MAX_BYTES. One tap saves or shares it again, or puts it into «Links and files».
 *
 * Where it lives: the meta table, record RESULTS_KEY { list: [{ id, name, type, size, tool, at, data }] }
 * (data: a data URL). The meta table never goes into a backup and never syncs: the results stay on
 * this device, as the tools do their work only here. No schema change.
 * Pure apart from the small read/write helpers at the end; tested in tests/ichideen.test.js.
 */
export const RESULTS_KEY = 'toolResults';
export const RESULTS_MAX = 5;
export const RESULT_MAX_BYTES = 4 * 1024 * 1024;

const newId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A stored list made safe: only whole entries, newest first, at most RESULTS_MAX. */
export function resultsOf(value) {
  const list = Array.isArray(value?.list) ? value.list : [];
  return list
    .filter((r) => r && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.data === 'string' && r.data.startsWith('data:'))
    .sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
    .slice(0, RESULTS_MAX);
}

/**
 * The list with one more result on top. A result with the same name from the same tool replaces the
 * older one (saving twice keeps one). Too big: the list stays as it is ('big' is the caller's hint).
 */
export function withResult(list, r, id = newId()) {
  if (!r || !(r.size >= 0) || r.size > RESULT_MAX_BYTES) return list;
  const entry = { id, name: String(r.name || 'file').slice(0, 120), type: String(r.type || 'application/octet-stream'), size: r.size, tool: String(r.tool || ''), at: r.at, data: r.data };
  return [entry, ...list.filter((x) => !(x.name === entry.name && x.tool === entry.tool))].slice(0, RESULTS_MAX);
}

export const withoutResult = (list, id) => list.filter((x) => x.id !== id);

/** The tool of the page now («#/me/tools/pdf» → 'pdf'), or ''. */
export const toolOfHash = (hash) => /^#\/me\/tools\/([a-z]+)/.exec(String(hash ?? ''))?.[1] ?? '';

/* ---------- reading and writing (meta table) ---------- */

function dataUrlOf(blob) {
  return new Promise((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(blob);
  });
}

export async function readResults(db) {
  return resultsOf(await db.table('meta').get(RESULTS_KEY));
}
export const saveResults = (db, list) => db.table('meta').put({ key: RESULTS_KEY, list });

/** Keep a delivered file. Never throws: keeping is a help, the saving itself already happened. */
export async function keepResult(db, blob, name, tool = '', now = new Date().toISOString()) {
  try {
    if (!blob || blob.size > RESULT_MAX_BYTES) return false;
    const data = await dataUrlOf(blob);
    await saveResults(db, withResult(await readResults(db), { name, type: blob.type, size: blob.size, tool, at: now, data }));
    return true;
  } catch {
    return false;
  }
}
