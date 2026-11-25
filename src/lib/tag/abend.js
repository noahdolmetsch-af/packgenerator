/**
 * «Abend-Rückblick in einer Minute» (Noah 25.11.2026 «1-3», Idee 2): what is still open at the end of a day of «Mein Tag».
 * From 18:00 on today, and on every day before today, a closed line counts the open points; opened, each own point can go
 * «to tomorrow» (on an earlier day: «to today»), be ticked off or dropped, and a plan session leads to the tab «Tick off».
 * Pure rules, tested in tests/tag-abend.test.js; the page is src/pages/Tag.svelte.
 */
import { lengthOf, toMin } from './timeline.js';

export const EVENING_MIN = 18 * 60;
/**
 * The open points of `day`: [{ e, own }]. own: an entry of your own list (can be moved, ticked off, dropped); not own: a session of the
 * plan (only the way to «Tick off»). Not open: done ones, suggestions of the app, a timed entry that has not ended yet today, and
 * everything on a later day or before 18:00 today.
 */
export function eveningRows(entries = [], { day, today, now = 0, isOwn = () => false } = {}) {
  if (!day || !today || day > today || (day === today && now < EVENING_MIN)) return [];
  const rows = [];
  for (const e of entries) {
    if (!e || e.done) continue;
    const own = isOwn(e) && (e.kind === 'todo' || e.kind === 'date');
    const plan = !own && e.kind === 'sport' && !String(e.id).startsWith('tr:sug-');
    if (!own && !plan) continue;
    const s = toMin(e.time);
    if (day === today && s != null && s + lengthOf(e).mins > now) continue;
    rows.push({ e, own });
  }
  return rows;
}

/** Where «later» leads from `day`: tomorrow on today, today on an earlier day. */
export const laterDay = (day, today, shift) => (day < today ? today : shift(day, 1));
