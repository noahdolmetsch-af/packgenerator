/**
 * Ich › Dokumente (P3b «Daten sicher», Noah 15.10.2026 «1a»; mockups D3/D4 approved 12.10.2026
 * «d1-d5 freigeben»): Pass, insurance, emergency and travel papers in one place, only on this device and
 * in the backup file. A document has a «valid until» month, a reminder some months before (6 by
 * default), and can stand in the packing list of every trip («ID and cash with you?»).
 *
 * The rows, groups, sorting and search follow the package «Dokumente-PDF» (DP, built 15.10.2026, ships
 * later with the server package), so DP adds the camera, the text recognition and Google Drive on top.
 * Everything here runs without a browser so tests/docs.test.js can check it.
 *
 * A row: { id, kind: 'pdf'|'photo', name, group, createdAt, docDate, source: 'file', pages, bytes,
 *          mode, text, data (data URL of the PDF or JPEG), drive: null,
 *          until: 'YYYY-MM' | null (valid until, end of that month), remind: months before (0 = off),
 *          note, inPack: true when it stands in the packing list of trips }
 * group '' = the default group: «Importierte PDF» for PDFs, «Importierte Fotos» for photos.
 */

/** The default groups (English source names; German via t(): «Importierte PDF», «Importierte Fotos»). */
export const DEFAULT_GROUP = { pdf: 'Imported PDFs', photo: 'Imported photos' };
/** The groups the earlier D3 mockups showed; offered when a new group is made. */
export const GROUP_IDEAS = ['IDs', 'Insurance and emergency', 'Money', 'Travel', 'Warranties', 'Receipts'];
/** Sorting (Noah «mit möglichkeiten zum sortieren»). */
export const SORTS = ['new', 'name', 'date', 'source'];
/** Looks of a page (Noah «4a im normalfall und b möglich»): black and white by default. */
export const MODES = ['bw', 'gray', 'color'];
/** What several photos become (Noah «1a»: one PDF of all is chosen first). */
export const MAKES = ['one', 'each', 'photos'];
/** Longest side of a stored page in pixels; black and white pages stay at about 0.2 MB. */
export const PAGE_MAX = 1700;

const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** The group a row is in ('' = default). */
export const groupOf = (d) => (typeof d?.group === 'string' ? d.group.trim() : '');

/** Sorted copy: new (newest first), name (A–Z), date (date in the document, newest first), source (camera, gallery, file). */
export function sortDocs(list, by = 'new') {
  const rows = [...(list ?? [])];
  const newer = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
  if (by === 'name') return rows.sort((a, b) => fold(a.name).localeCompare(fold(b.name)) || newer(a, b));
  if (by === 'date') return rows.sort((a, b) => String(b.docDate ?? b.createdAt ?? '').localeCompare(String(a.docDate ?? a.createdAt ?? '')) || newer(a, b));
  if (by === 'source') {
    const rank = { camera: 0, gallery: 1, share: 2, file: 3 };
    return rows.sort((a, b) => (rank[a.source] ?? 9) - (rank[b.source] ?? 9) || newer(a, b));
  }
  return rows.sort(newer);
}

/**
 * The groups with their rows: the default PDF group first, then own groups A–Z, the photo group last.
 * Returns [{ key, kind, name (own name or null for a default), rows }]. Empty own groups that are kept in
 * «extra» (made but still empty) show too.
 */
export function groupDocs(list, by = 'new', extra = []) {
  const map = new Map();
  const add = (key, kind, name) => map.get(key) ?? (map.set(key, { key, kind, name, rows: [] }), map.get(key));
  add('pdf:', 'pdf', null);
  for (const d of list ?? []) {
    const g = groupOf(d);
    const kind = d.kind === 'photo' && !g ? 'photo' : 'pdf';
    add(g ? `own:${fold(g)}` : `${kind}:`, g ? 'own' : kind, g || null).rows.push(d);
  }
  for (const g of extra ?? []) if (String(g ?? '').trim()) add(`own:${fold(g)}`, 'own', String(g).trim());
  const order = (x) => (x.kind === 'pdf' ? 0 : x.kind === 'own' ? 1 : 2);
  return [...map.values()]
    .filter((x) => x.rows.length || x.kind !== 'photo')
    .map((x) => ({ ...x, rows: sortDocs(x.rows, by) }))
    .sort((a, b) => order(a) - order(b) || fold(a.name).localeCompare(fold(b.name)));
}

/** All own group names (for «In Gruppe verschieben»), A–Z, without doubles. */
export function ownGroups(list, extra = []) {
  const seen = new Map();
  for (const g of [...(list ?? []).map(groupOf), ...(extra ?? [])]) {
    const s = String(g ?? '').trim();
    if (s && !seen.has(fold(s))) seen.set(fold(s), s);
  }
  return [...seen.values()].sort((a, b) => fold(a).localeCompare(fold(b)));
}

/** Search in the name and the recognised text (Noah «5a»); all words must be found, accents ignored. */
export function searchDocs(list, q) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [...(list ?? [])];
  return (list ?? []).filter((d) => {
    const hay = `${fold(d.name)} ${fold(d.group)} ${fold(d.text)}`;
    return words.every((w) => hay.includes(w));
  });
}

/** A file name: «quittung-veloladen-muster-2026-10-15.pdf» (no accents, no spaces). */
export function fileName(name, day, ext = 'pdf') {
  const base = fold(name)
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${base || 'dokument'}${day ? `-${day}` : ''}.${ext}`;
}

/** Bytes of a data URL (the size shown, «0,4 MB»). */
export function dataBytes(dataUrl) {
  const s = String(dataUrl ?? '');
  const i = s.indexOf(',');
  if (i < 0) return 0;
  const b64 = s.slice(i + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
}

/* ---------- P3b: valid until, reminders, packing list ---------- */

/** The reminder choices in months before the end (0 = no reminder); D3/D4: 6 months by default. */
export const REMIND_MONTHS = [0, 1, 3, 6, 12];
export const DEFAULT_REMIND = 6;
/** The group whose papers make the one row «ID and cash with you?» in the packing list. */
export const ID_GROUP = 'IDs';

/** 'YYYY-MM' of a row's «valid until», or null. */
export const untilOf = (d) => (typeof d?.until === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(d.until) ? d.until : null);
const remindOf = (d) => (Number.isFinite(d?.remind) ? Math.max(0, d.remind) : DEFAULT_REMIND);
const monthIndex = (ym) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
const ymOf = (i) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;

/**
 * How it stands with a document's «valid until» on a day (YYYY-MM-DD):
 * { until, left (whole months from this month to the until month), remindFrom ('YYYY-MM', or null
 *   without reminder), soon (inside the reminder time), over (the month is past) } or null without a date.
 */
export function expiry(d, today) {
  const until = untilOf(d);
  if (!until) return null;
  const now = monthIndex(today.slice(0, 7));
  const end = monthIndex(until);
  const r = remindOf(d);
  const remindFrom = r ? ymOf(end - r) : null;
  const over = now > end;
  return { until, left: end - now, remindFrom, soon: !over && !!r && now >= end - r, over };
}

/** The documents with a «valid until», the soonest first, each with its expiry. */
export function reminderRows(list, today) {
  return (list ?? [])
    .map((d) => ({ doc: d, ex: expiry(d, today) }))
    .filter((x) => x.ex)
    .sort((a, b) => a.ex.until.localeCompare(b.ex.until) || String(a.doc.name ?? '').localeCompare(String(b.doc.name ?? '')));
}

/** How many documents need you now (inside the reminder time, or over). */
export const dueCount = (list, today) => reminderRows(list, today).filter((x) => x.ex.soon || x.ex.over).length;

/**
 * The rows for the packing list of a trip (D3 «Für die nächste Reise», D4 «In die Packliste»):
 * the papers of the group «IDs» together as one row «ID and cash with you?» (linked to the first),
 * every other paper marked for the packing list as «{name} with you?». English keys for t().
 * Returns [{ key, label, name?, doc }].
 */
export function packRows(list) {
  const marked = (list ?? []).filter((d) => d.inPack);
  const ids = marked.filter((d) => groupOf(d) === ID_GROUP);
  const rest = sortDocs(marked.filter((d) => groupOf(d) !== ID_GROUP), 'name');
  return [...(ids.length ? [{ key: 'ids', label: 'ID and cash with you?', doc: sortDocs(ids, 'name')[0] }] : []), ...rest.map((d) => ({ key: d.id, label: '{name} with you?', name: d.name, doc: d }))];
}
