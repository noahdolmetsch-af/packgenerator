/**
 * Paket M #223 «Heutige Tour im Abend-Rückblick bewerten»: on the evening of a trip day, the evening
 * review asks «How was the trip today?» (1–10), while everything is fresh. The answer goes into the
 * trip's debrief (a draft is made when there is none): d.evening = { [day]: score }. The debrief and
 * the Tour-Tagebuch show it later.
 */
import { tripEnd } from '../tripstate.js';
import { newDebrief } from '../debrief.js';

/** The trip that runs today (started, not past its last day, not skipped or archived), else null. */
export function tripToday(trips = [], today) {
  return (
    trips
      .filter((x) => x && !x.skipped && !x.archivedAt && x.startDate && x.startDate <= today && (tripEnd(x) ?? x.startDate) >= today)
      .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0] ?? null
  );
}

/** The debrief with today's score set (null takes it back). Keeps everything else as it is. */
export function rateEvening(debrief, trip, day, score, now = new Date().toISOString()) {
  const d = debrief ? structuredClone(debrief) : newDebrief(trip, now);
  const ev = { ...(d.evening ?? {}) };
  if (score == null) delete ev[day];
  else ev[day] = Math.max(1, Math.min(10, Math.round(score)));
  return { ...d, evening: ev, updatedAt: now };
}

/**
 * Einzelidee Heute 4 (UC-159-I1 «Bewertung zerlegen dürfen», Noah 25.10.2026): a low score (POOR_FROM or
 * less) may say what it was about, without a questionnaire: the experience, the planning and how the body
 * felt, each «good», «so-so» or «hard», all optional. d.eveningParts = { [day]: { exp, plan, body } }.
 */
export const POOR_FROM = 5;
export const PARTS = [
  { key: 'exp', name: 'Experience' },
  { key: 'plan', name: 'Planning' },
  { key: 'body', name: 'Body' },
];
export const MARKS = [
  { key: 'good', name: 'good|rating' },
  { key: 'mid', name: 'so-so' },
  { key: 'hard', name: 'hard|rating' },
];
const MARK_KEYS = MARKS.map((m) => m.key);

/** The parts of a day, cleaned: { exp?, plan?, body? } (only known marks). */
export function partsOf(debrief, day) {
  const p = debrief?.eveningParts?.[day];
  if (!p || typeof p !== 'object') return {};
  return Object.fromEntries(PARTS.filter((x) => MARK_KEYS.includes(p[x.key])).map((x) => [x.key, p[x.key]]));
}

/** The debrief with one part of the day set (a second tap on the same mark takes it back). */
export function rateEveningPart(debrief, trip, day, part, mark, now = new Date().toISOString()) {
  if (!PARTS.some((x) => x.key === part)) return debrief;
  const d = debrief ? structuredClone(debrief) : newDebrief(trip, now);
  const all = { ...(d.eveningParts ?? {}) };
  const cur = { ...partsOf(d, day) };
  if (!MARK_KEYS.includes(mark) || cur[part] === mark) delete cur[part];
  else cur[part] = mark;
  if (Object.keys(cur).length) all[day] = cur;
  else delete all[day];
  const next = { ...d, eveningParts: all, updatedAt: now };
  if (!Object.keys(all).length) delete next.eveningParts;
  return next;
}
