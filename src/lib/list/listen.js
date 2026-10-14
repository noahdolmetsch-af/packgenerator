/**
 * SL «Scrollen und Listen» (mockups SL1–SL4, Noah 14.10.2026 «SL1–SL4 freigegeben», answers «alle a»): one
 * pattern for long lists. Groups (by day, month or category) with a count, closed except the newest; a
 * group shows SHOW_ROWS rows and «Show n more»; a jump bar (phone: chips, computer: a list beside it);
 * the search and the group you are in stay on top while you scroll; «Back to top» after TOP_AFTER screens.
 * The pure parts live here (tested in tests/listen.test.js); the pieces are in this folder.
 */

/** A long group shows this many rows, then «Show n more» (answer 4a). */
export const SHOW_ROWS = 5;
/** «Back to top» shows after this many screens (SL4). */
export const TOP_AFTER = 2;
/** The newest days that get a group of their own (SL1); older days share one group. */
export const OWN_DAYS = 5;

/** Whole days between two local days (YYYY-MM-DD), by the calendar. */
const dayN = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 864e5;

/**
 * Entries (each with `date`, newest first) by day: the OWN_DAYS newest days one group each, every older day
 * in one group «older». → [{ key, from, to, ago, older, entries }]; `ago` counts days before `today`.
 */
export function byDay(list, today, own = OWN_DAYS) {
  const days = [];
  for (const e of list) {
    const key = String(e.date).slice(0, 10);
    let d = days.at(-1);
    if (!d || d.key !== key) days.push((d = { key, from: key, to: key, older: false, entries: [] }));
    d.entries.push(e);
  }
  const out = days.slice(0, own);
  const rest = days.slice(own);
  if (rest.length) out.push({ key: 'older', from: rest.at(-1).key, to: rest[0].key, older: true, entries: rest.flatMap((d) => d.entries) });
  for (const g of out) g.ago = today ? Math.round(dayN(today) - dayN(g.to)) : null;
  return out;
}

/** Entries by month (YYYY-MM), newest first: [{ key, entries }]. `dateOf` reads an entry's day. */
export function byMonthOf(list, dateOf = (e) => e.date) {
  const out = [];
  for (const e of list) {
    const key = String(dateOf(e) ?? '').slice(0, 7);
    let m = out.at(-1);
    if (!m || m.key !== key) out.push((m = { key, entries: [] }));
    m.entries.push(e);
  }
  return out;
}

/** Which group you are in: the last one whose head passed `line` (tops in px from the viewport top). */
export function activeOf(tops, line) {
  let at = 0;
  tops.forEach((top, i) => {
    if (top <= line) at = i;
  });
  return at;
}

/** The rows a group shows: all when open wide, else the first `n`. */
export const shownRows = (rows, wide, n = SHOW_ROWS) => (wide || rows.length <= n + 1 ? rows : rows.slice(0, n));
