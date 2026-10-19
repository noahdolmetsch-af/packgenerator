/**
 * Package G (#157, #158): writing the Fitbit export plan (fitbitexport.js planImport) in one go, and
 * taking it back. Only rows that are not there yet are written; «Rückgängig» removes exactly those.
 */

/** Writes the plan's new entries and sessions in one transaction → { entryIds, sessionIds }. */
export async function applyPlan(db, plan) {
  const entries = JSON.parse(JSON.stringify(plan?.entries ?? []));
  const sessions = JSON.parse(JSON.stringify(plan?.sessions ?? []));
  let out = { entryIds: [], sessionIds: [] };
  await db.transaction('rw', db.flowLog, db.flowSessions, async () => {
    const [oldE, oldS] = await Promise.all([db.flowLog.bulkGet(entries.map((e) => e.id)), db.flowSessions.bulkGet(sessions.map((s) => s.id))]);
    const e = entries.filter((_, i) => !oldE[i]);
    const s = sessions.filter((_, i) => !oldS[i]);
    if (e.length) await db.flowLog.bulkPut(e);
    if (s.length) await db.flowSessions.bulkPut(s);
    out = { entryIds: e.map((x) => x.id), sessionIds: s.map((x) => x.id) };
  });
  return out;
}

/** «Rückgängig»: removes exactly what applyPlan added. */
export async function undoPlan(db, added) {
  await db.transaction('rw', db.flowLog, db.flowSessions, async () => {
    if (added?.entryIds?.length) await db.flowLog.bulkDelete(added.entryIds);
    if (added?.sessionIds?.length) await db.flowSessions.bulkDelete(added.sessionIds);
  });
}
