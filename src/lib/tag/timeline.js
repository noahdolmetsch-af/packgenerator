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
 * → { allDay: [entry], untimed: [entry], blocks: [{ e, start, end, mins, guessed, col, cols }], from, to }
 *   allDay   holidays and trips (kind 'away'): a strip above the timeline
 *   untimed  entries without a clock time: a list above the timeline («Ohne Zeit»)
 *   blocks   entries with a time; col/cols tell the page how to put overlapping ones side by side
 *   from, to the hours the timeline shows (whole hours; wider than 06:00–23:00 when an entry is outside)
 */
export function layoutDay(entries = []) {
  const allDay = entries.filter((e) => e.kind === 'away');
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
  const from = Math.min(DAY_START, Math.floor(first / 60) * 60);
  const to = Math.max(DAY_END, Math.ceil(last / 60) * 60);
  return { allDay, untimed, blocks, from, to: Math.min(24 * 60, to) };
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

/** Minutes of the day for «now» (null on another day). */
export const nowMin = (day, today, now = new Date()) => (day === today ? now.getHours() * 60 + now.getMinutes() : null);

/** The seven days of the week that holds `day`, Monday first (YYYY-MM-DD, local days). */
export function weekOf(day, shift) {
  const wd = (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monday = shift(day, -wd);
  return Array.from({ length: 7 }, (_, i) => shift(monday, i));
}
