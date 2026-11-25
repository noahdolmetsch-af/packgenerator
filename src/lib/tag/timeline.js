/**
 * «Mein Tag» (Noah 23.11.2026): one day as a timeline, made from the entries of `buildWeek` (src/lib/woche.js).
 * There is no second calculation: what stands on a day in Woche, Heute and Abhaken is what stands here.
 * Pure rules, no page. The page is src/pages/Tag.svelte.
 *
 * An entry has { id, kind: 'away'|'date'|'sport'|'bike'|'todo', time: 'HH:MM' or '', sub: { mins }, mins, own, done, href }.
 * Only own items, the training plan and the fixed Aktiv dates know how long they take; a calendar date has a start only.
 * It gets the usual length and says so (`guessed`), so the page never shows an end time that nobody knows.
 */

export const DAY_START = 6 * 60; // the timeline starts at 06:00 …
export const DAY_END = 23 * 60; // … and ends at 23:00, unless an entry is outside
/** How long an entry lasts when nothing says so (minutes). */
export const DEFAULT_MINS = { date: 60, sport: 60, bike: 30, todo: 30 };
export const MIN_MINS = 15; // shown at least this tall, so it can be tapped
export const HOUR_PX = 72; // pixels of an hour with an entry (or «now») in it …
export const EMPTY_PX = 36; // … and of an empty hour (Noah 24.11.2026: empty hours take less room)

export const toMin = (hhmm) => (/^\d{2}:\d{2}$/.test(String(hhmm ?? '')) ? Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3)) : null);
export const pad = (n) => String(n).padStart(2, '0');
export const fmtMin = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

/** The length of an entry in minutes and whether it is only the usual length. */
export function lengthOf(e) {
  const known = Number(e?.sub?.mins ?? e?.mins);
  if (Number.isFinite(known) && known >= 5) return { mins: Math.min(480, Math.round(known)), guessed: false };
  return { mins: DEFAULT_MINS[e?.kind] ?? 30, guessed: true };
}

/**
 * The day as blocks.
 * → { allDay: [entry], bands: [entry], untimed: [entry], blocks: [{ e, start, end, mins, guessed, col, cols }], from, to }
 *   allDay   holidays and trips (kind 'away'): a strip above the timeline
 *   bands    dates of the outside calendar that last all day, also for several days (kind 'date', `allDay`, no time):
 *            a band across the top (Noah 24.11.2026). They stay in `untimed` too, so «Heute laut Plan» lists them as before;
 *            the page shows `untimed` without the bands
 *   untimed  entries without a clock time: a list above the timeline («Ohne Zeit»)
 *   blocks   entries with a time; col/cols tell the page how to put overlapping ones side by side
 *   from, to the hours the timeline shows (whole hours; wider than 06:00–23:00 when an entry is outside;
 *          with `now` (minutes, today only) it starts one hour before it, but never later than the first entry)
 */
export function layoutDay(entries = [], { now = null } = {}) {
  const allDay = entries.filter((e) => e.kind === 'away');
  const bands = entries.filter((e) => e.kind === 'date' && e.allDay && toMin(e.time) == null);
  const untimed = [];
  const blocks = [];
  for (const e of entries) {
    if (e.kind === 'away') continue;
    const s = toMin(e.time);
    if (s == null) {
      untimed.push(e);
      continue;
    }
    const { mins, guessed } = lengthOf(e);
    const end = Math.min(24 * 60, s + Math.max(mins, MIN_MINS));
    blocks.push({ e, start: s, end, mins: Math.min(mins, 24 * 60 - s), guessed, col: 0, cols: 1 });
  }
  blocks.sort((a, b) => a.start - b.start || b.end - a.end);

  // overlapping blocks form a group; inside a group each block takes the first free column
  let group = [];
  let groupEnd = -1;
  const close = () => {
    const cols = group.reduce((n, b) => Math.max(n, b.col + 1), 1);
    for (const b of group) b.cols = cols;
    group = [];
  };
  for (const b of blocks) {
    if (group.length && b.start >= groupEnd) {
      close();
      groupEnd = -1;
    }
    const used = new Set(group.filter((x) => x.end > b.start).map((x) => x.col));
    let c = 0;
    while (used.has(c)) c++;
    b.col = c;
    group.push(b);
    groupEnd = Math.max(groupEnd, b.end);
  }
  if (group.length) close();

  const first = blocks.length ? Math.min(...blocks.map((b) => b.start)) : DAY_START;
  const last = blocks.length ? Math.max(...blocks.map((b) => b.end)) : DAY_END;
  // on today the view starts one hour before «now» (earlier hours stay one scroll up, and an earlier entry always shows)
  const start = now == null ? DAY_START : Math.max(DAY_START, Math.floor((now - 60) / 60) * 60);
  const from = blocks.length ? Math.min(start, Math.floor(first / 60) * 60) : start;
  const to = Math.max(DAY_END, Math.ceil(last / 60) * 60);
  return { allDay, bands, untimed, blocks, from, to: Math.min(24 * 60, to) };
}

/**
 * «Heute laut Plan» (Noah 23.11.2026 «B»): the next blocks of today, from the same entries as the timeline.
 * What is running now and what comes later, in order, then entries without a time (only when there is room).
 * A block that is over is not listed again (the timeline still shows it); a ticked one that still runs stays, with its tick. Holidays and trips (kind 'away') are not blocks.
 * → { items: [{ e, state: 'now'|'next'|'untimed', start, end }], more } (`more` = how many fit not into `max`)
 */
export function nextBlocks(entries = [], now = 0, max = 4) {
  const lay = layoutDay(entries);
  const timed = lay.blocks
    .filter((b) => b.end > now)
    .map((b) => ({ e: b.e, state: b.start <= now ? 'now' : 'next', start: b.start, end: b.end }));
  const untimed = lay.untimed.filter((e) => !e.done).map((e) => ({ e, state: 'untimed', start: null, end: null }));
  const all = [...timed, ...untimed];
  return { items: all.slice(0, Math.max(0, max)), more: Math.max(0, all.length - Math.max(0, max)) };
}

/**
 * The vertical rows of the timeline (Noah 24.11.2026 «leere Stunden kompakter»): an hour with an entry in it, or with «now»,
 * is HOUR_PX tall, an empty hour only EMPTY_PX. Returns the rows and the two conversions the page needs, both piecewise linear:
 * pos(minute) → pixel from the top, at(pixel) → minute (to place and drag entries). Rows come from the entries as they are
 * saved, never from a block that is being dragged, so the layout holds still while dragging.
 * → { rows: [{ from, to, y, h, empty }], height, pos, at }
 */
export function hourRows(blocks = [], { from, to, now = null, hh = HOUR_PX, empty = EMPTY_PX } = {}) {
  const rows = [];
  let y = 0;
  for (let h = from; h < to; h += 60) {
    const busy = blocks.some((b) => b.start < h + 60 && b.end > h) || (now != null && now >= h && now < h + 60);
    const px = busy ? hh : empty;
    rows.push({ from: h, to: h + 60, y, h: px, empty: !busy });
    y += px;
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pos = (m) => {
    const x = clamp(m, from, to);
    const r = rows.find((q) => x <= q.to) ?? rows.at(-1);
    return r ? r.y + ((x - r.from) / 60) * r.h : 0;
  };
  const at = (p) => {
    const v = clamp(p, 0, y);
    const r = rows.find((q) => v <= q.y + q.h) ?? rows.at(-1);
    return r ? r.from + ((v - r.y) / r.h) * 60 : from;
  };
  return { rows, height: y, pos, at };
}

/** Whether a block is over today (its end is before «now»; `now` is null on other days, so nothing is over). */
export const isOver = (b, now) => now != null && b.end <= now;

/** Minutes of the day for «now» (null on another day). */
export const nowMin = (day, today, now = new Date()) => (day === today ? now.getHours() * 60 + now.getMinutes() : null);

/** The seven days of the week that holds `day`, Monday first (YYYY-MM-DD, local days). */
export function weekOf(day, shift) {
  const wd = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monday = shift(day, -wd);
  return Array.from({ length: 7 }, (_, i) => shift(monday, i));
}
