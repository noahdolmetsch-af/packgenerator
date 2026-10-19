/**
 * Paket H «Packen leichter», answer 3 «a und b … für alle Listen auf der gesamten App» (Noah 19.10.2026
 * 12:09): every list can show as a table on the computer (change the fields right in the cells) and
 * every list can «select several and change for all». One shared component does both:
 * ui/ListTable.svelte. These are its pure parts.
 *
 * A column: { key, label, type: 'text'|'number'|'date'|'select'|'check', options?: [{ key, name }],
 *   get?(row) → value, set?(row, value) → changed row, readOnly?, bulk? (false: not offered in
 *   «Change for all»), width? }
 */

/** The value a cell shows. */
export const cellOf = (row, col) => (col.get ? col.get(row) : row?.[col.key]);

/** Typed text → the stored value of a column ('' → null for numbers and dates). */
export function parseCell(col, raw) {
  if (col.type === 'check') return !!raw;
  if (col.type === 'number') {
    const s = String(raw ?? '').trim().replace(',', '.');
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined; // undefined: not a number, nothing is saved
  }
  if (col.type === 'date') {
    const s = String(raw ?? '').trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : s ? undefined : null;
  }
  if (col.type === 'select') return raw === '' ? null : raw;
  return String(raw ?? '').trim();
}

/** The row with one field changed (a column's own set() wins). */
export const withCell = (row, col, value) => (col.set ? col.set(row, value) : { ...row, [col.key]: value });

/** True when the value really changes (no save for the same text). */
export const changes = (row, col, value) => {
  const old = cellOf(row, col);
  return (old ?? null) !== (value ?? null) && !(old == null && value === '');
};

/**
 * «Change for all» (answer 3b): the rows of `ids` with the field set to value. Rows that already
 * have it stay out, so Undo only touches what changed. → [{ before, after }]
 */
export function applyToAll(rows, ids, col, value, idOf = (r) => r.id) {
  const want = new Set(ids);
  return rows.filter((r) => want.has(idOf(r)) && changes(r, col, value)).map((r) => ({ before: r, after: withCell(r, col, value) }));
}

/** The columns «Change for all» offers. */
export const bulkCols = (cols) => cols.filter((c) => !c.readOnly && c.bulk !== false);

/** Sort by a column, text by the German alphabet, empty cells last. dir: 1 up, -1 down. */
export function sortRows(rows, col, dir = 1) {
  if (!col) return rows;
  const val = (r) => {
    const v = cellOf(r, col);
    if (col.type === 'select') return col.options?.find((o) => o.key === v)?.name ?? v ?? null;
    return v;
  };
  return [...rows].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    if (x == null || x === '') return y == null || y === '' ? 0 : 1;
    if (y == null || y === '') return -1;
    if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
    if (typeof x === 'boolean' || typeof y === 'boolean') return (Number(y) - Number(x)) * dir;
    return String(x).localeCompare(String(y), 'de', { numeric: true, sensitivity: 'base' }) * dir;
  });
}

/** Rows whose text cells contain the search words (all of them, any column). */
export function filterRows(rows, cols, q = '') {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return rows;
  return rows.filter((r) => {
    const hay = cols
      .map((c) => {
        const v = cellOf(r, c);
        return c.type === 'select' ? (c.options?.find((o) => o.key === v)?.name ?? v) : v;
      })
      .filter((v) => v != null)
      .join(' ')
      .toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** localStorage key of a page's «List · Table» choice. */
export const viewKey = (page) => `table.${page}`;

/** Read a page's choice ('list' when none or no storage). */
export function savedView(page) {
  try {
    return localStorage.getItem(viewKey(page)) === 'table' ? 'table' : 'list';
  } catch {
    return 'list';
  }
}

export function saveView(page, view) {
  try {
    localStorage.setItem(viewKey(page), view);
  } catch {
    /* private window: the choice only lasts while the page is open */
  }
}

/**
 * Guard list (like GROUP_PLACES in groups.js): every page that shows a user list with the shared
 * table and «Change for all». tests/listtable.test.js checks that each file uses ListTable.
 * A new list page goes in here.
 */
export const TABLE_PLACES = [
  { page: 'gear', file: 'src/pages/Gear.svelte', what: 'Gear' },
  { page: 'supplies', file: 'src/pages/Supplies.svelte', what: 'Supplies' },
  { page: 'lend', file: 'src/pages/Lend.svelte', what: 'Lent out' },
  { page: 'trips', file: 'src/lib/touren/TripTable.svelte', what: 'Trips' },
  { page: 'notes', file: 'src/pages/Notes.svelte', what: 'Notes' },
  { page: 'docs', file: 'src/pages/Docs.svelte', what: 'Documents' },
  { page: 'rides', file: 'src/pages/Rides.svelte', what: 'Rides' },
];
