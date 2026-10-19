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
