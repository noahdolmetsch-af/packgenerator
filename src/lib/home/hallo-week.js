/**
 * Gruss C «Letzte 7 Tage» (Noah 05.11.2026 «alle umsetzen»): the seven last days as small dots in the greeting's window,
 * observation only: one neutral colour, a day without an answer stays an empty ring, no good or bad, no streak, no count of misses.
 * Pure parts (tested in tests/hallo-week.test.js); the window reads the answers of `hallo.gaht` from the one history.
 */
import { MOODS } from './hallo.js';

/** The calendar day `n` days before `day` (YYYY-MM-DD; calendar arithmetic, no 24-hour steps). */
export function daysBefore(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * The seven days ending on `today`, oldest first: { day, key, label, v } with the face of the latest answer of the day
 * (key null when nothing was answered). `rows` are rows of abAnswers (any question; only `hallo.gaht` counts); `faces` the faces as the user has them.
 */
export function weekDots(rows = [], today, faces = MOODS) {
  const byDay = new Map();
  for (const r of rows) {
    if (r?.qid !== 'hallo.gaht' || typeof r.value !== 'string') continue;
    const old = byDay.get(r.day);
    if (!old || String(r.at ?? '') > String(old.at ?? '')) byDay.set(r.day, r);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const day = daysBefore(today, 6 - i);
    const key = byDay.get(day)?.value ?? null;
    const f = key ? faces.find((x) => x.key === key) : null;
    return { day, key: key ? key : null, label: f?.label ?? key ?? '', v: f?.v ?? (key ? 0.5 : null) };
  });
}

/** How many of the seven days have an answer. */
export const answeredDays = (dots) => dots.filter((d) => d.key).length;
