/**
 * Paket P4 «Aktiv» (mockups E4, E5; Noah 21.10.2026 «alle offenen Mockups freigegeben»):
 *
 *   E4 «Diesen Tag merken»: at the end of the evening review a good day can be kept as a recipe («Morgens
 *   Ruhe, nachmittags raus, abends Freunde»). Wohl › «Das tut mir gut» shows the kept days; «Am Samstag
 *   wiederholen» plans one again (the morning check of that day shows it), «kurze Version» keeps only the
 *   first part. Settings record «wohl.goodDays»: [{ id, day, text, again? }].
 *
 *   E5 «Gewünscht und erlebt»: every area of the balance ring as a bar (what you lived the last 7 days) with
 *   the wish as a mark, and − / + to change the wish in steps of 10 (the same record as the wished mix).
 *
 * Pure functions, tested in tests/gutertag.test.js.
 */
import { addDays } from './flow.js';
import { weekdayOf } from './yogastudio.js';

export const GOOD_DAYS_KEY = 'wohl.goodDays';
const MAX = 50;
const dayOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d ?? '');
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);

/** The kept days, newest first. */
export function goodDaysOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && x.id && dayOk(x.day) && clean(x.text))
    .map((x) => ({ id: String(x.id), day: x.day, text: clean(x.text), ...(dayOk(x.again) ? { again: x.again } : {}) }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

/** Keep a day (a day kept before is replaced, so a second tap changes the text). */
export function rememberDay(list, { day, text }, id = `gd-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`) {
  const all = goodDaysOf(list);
  const old = all.find((x) => x.day === day);
  const rest = all.filter((x) => x.day !== day);
  return goodDaysOf([{ ...(old ?? {}), id: old?.id ?? id, day, text: clean(text) }, ...rest]).slice(0, MAX);
}
export const renameGoodDay = (list, id, text) => (clean(text) ? goodDaysOf(list).map((x) => (x.id === id ? { ...x, text: clean(text) } : x)) : goodDaysOf(list));
export const dropGoodDay = (list, id) => goodDaysOf(list).filter((x) => x.id !== id);
/** Plan a kept day again on `day` (null takes the plan away). */
export const planAgain = (list, id, day) =>
  goodDaysOf(list).map((x) => {
    if (x.id !== id) return x;
    const { again, ...rest } = x;
    return dayOk(day) ? { ...rest, again: day } : rest;
  });

/** The next Saturday after today (a Saturday gives the one of next week). */
export function nextSaturday(today) {
  const wd = weekdayOf(today);
  return addDays(today, wd < 6 ? 6 - wd : 13 - wd);
}

/** The kept days planned for today. */
export const dueToday = (list, today) => goodDaysOf(list).filter((x) => x.again === today);

/** The short version: only the first part of the recipe, or null when it has only one part. */
export function shortVersion(text) {
  const parts = clean(text)
    .split(/\s*(?:,|;|·|\s\+\s|\sund\s|\sand\s)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 1 ? parts[0] : null;
}

/** The start text of «Diesen Tag merken»: the good parts the app saw (labels already in words). */
export const draftText = (labels = []) => labels.filter(Boolean).join(', ');

/* ---------- E5 «Gewünscht und erlebt» ---------- */

/** Every area: { key, value (0–100 or null), wish (0–100 or null), diff (value − wish) }. */
export function mixRows(cats = [], wish = {}) {
  return cats.map((c) => {
    const value = c.value == null ? null : Math.max(0, Math.min(100, Math.round(c.value)));
    const w = wish[c.key] == null ? null : wish[c.key];
    return { key: c.key, value, wish: w, diff: value != null && w != null ? value - w : null };
  });
}

/** The wish with one area moved by `step` (−10 / +10); a first step starts from 50. */
export function stepWish(wish = {}, key, step) {
  const from = wish[key] == null ? 50 : wish[key];
  return { ...wish, [key]: Math.max(0, Math.min(100, Math.round((from + step) / 10) * 10)) };
}

/** The summary line: the areas furthest under and over the wish (at least 15 apart), each at most 2. */
export function mixSummary(rows = []) {
  const known = rows.filter((r) => r.diff != null);
  const under = known.filter((r) => r.diff <= -15).sort((a, b) => a.diff - b.diff).slice(0, 2).map((r) => r.key);
  const over = known.filter((r) => r.diff >= 15).sort((a, b) => b.diff - a.diff).slice(0, 2).map((r) => r.key);
  return { under, over, known: known.length };
}
