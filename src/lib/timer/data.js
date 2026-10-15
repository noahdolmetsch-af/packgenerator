/**
 * «Timer» (Z2, Z5): the timer log with the meditation sessions, one query for the timer page, its log
 * and the tile on Heute. A meditation runs on the meditation page's session (it keeps counting there);
 * the log shows it next to the timers (Z5 «Meditation · Countdown · ruhig, Vögel gehört»).
 */
import { liveQuery } from 'dexie';
import { db } from '../db.js';
import { mergeLog } from '../timer.js';
import { noteOf } from '../flowmed.js';

export const MED_ACT = 'meditation';

export function timerLogQuery() {
  return liveQuery(async () => {
    const [rows, log, sessions] = await Promise.all([db.timerLog.toArray(), db.flowLog.where('actId').equals(MED_ACT).toArray(), db.flowSessions.where('actId').equals(MED_ACT).toArray()]);
    const det = new Map(sessions.map((s) => [s.id, s]));
    const med = log.filter((e) => Number(e.min) > 0).map((e) => ({ id: e.id, day: e.day, at: e.at ?? null, min: Number(e.min), note: noteOf(det.get(e.id)).note }));
    return mergeLog(rows, med);
  });
}
