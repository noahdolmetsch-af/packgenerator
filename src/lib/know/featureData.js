/**
 * v0.110.0 Design-Refresh P10 (I11): what «What the app can do» (Features.svelte, v0.96.0) and
 * Ich › Was ist neu (WasNeu.svelte) read to know which functions you used: the records, the counts
 * and the backup state, in one place (moved here from Features.svelte, unchanged).
 */
import { db } from '../db.js';
import { usedTips, TIPS_KEY } from '../tips.js';
import { seenOf } from '../features.js';
import { HOME_PLACE } from '../know.js';
import { paceOf, PACE_KEY } from '../pace.js';
import { TEMPLATES_KEY } from '../templates.js';
import { SETS_KEY } from '../sets.js';
import { LAST_BACKUP } from '../backup.js';
import { demoState } from '../demo.js';
import { standalone } from '../install.js';

/** Everything the used marks need (for a liveQuery). */
export async function featureData() {
  const [trips, items, bikes, visits, debriefs, notesN, setting, file, folder, demo, counts] = await Promise.all([
    db.trips.toArray(),
    db.items.toArray(),
    db.bikes.toArray(),
    db.visits.toArray(),
    db.debriefs.toArray(),
    db.notes.count(),
    db.settings.bulkGet([TIPS_KEY, HOME_PLACE, PACE_KEY, TEMPLATES_KEY, SETS_KEY]),
    db.meta.get(LAST_BACKUP),
    db.meta.get('backupFolder'),
    demoState(db),
    Promise.all([db.rides.count(), db.events.count(), db.learnings.count(), db.kmBook.filter((r) => !!r.importId).count(), db.maintenance.count(), db.flowLog.count(), db.flowChecks.count(), db.flowStars.count(), db.flowSessions.count()]),
  ]);
  const [tips, home, pace, tpl, sets] = setting.map((r) => r?.value ?? null);
  const [rides, events, learnings, imports, problems, flowLog, flowChecks, flowStars, flowSessions] = counts;
  const n = { trips: trips.length, rides, events, learnings, imports, problems, visits: visits.length, flowLog, flowChecks, flowStars, flowSessions, notes: notesN };
  return { trips, items, bikes, visits, debriefs, notesN, tips, homePlace: home, pace: paceOf(pace), templates: tpl ?? [], sets: sets ?? [], lastBackup: file?.at ?? folder?.lastWrite ?? null, demo, counts: n, folder: !!folder };
}

const langSet = () => {
  try {
    return localStorage.getItem('lang') != null;
  } catch {
    return false;
  }
};

/** The functions used: the tips the data shows (or tapped) and the own entries seen. Set of ids. */
export const usedOf = (d) => (d ? new Set([...usedTips({ ...d, langSet: langSet(), standalone: standalone() }), ...seenOf({ counts: d.counts, folder: d.folder, play: !!d.demo?.play })]) : new Set());
