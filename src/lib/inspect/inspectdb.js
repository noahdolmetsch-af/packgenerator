/**
 * «Velo-Inspektion»: the writes, each with what Undo needs.
 * - an inspection is saved as a draft while it runs (done: false), so it can be continued later;
 * - «Fertig» marks it done, writes the part history entries (chain %, rotor mm …) and turns «Fix myself» and
 *   «Bike shop» into problems (maintenance, source 'Inspection'): the shop ones land in the workshop order.
 * All in one transaction; Undo puts everything back.
 */
import { logPart, PART } from '../care.js';
import { classify } from '../problems.js';
import { nextNumber } from '../notes.js';
import { finishPlan } from './inspect.js';

let seq = 0;
export const newInspectionId = (now = Date.now()) => `insp-${now.toString(36)}-${(seq++).toString(36)}`;

/** The open draft of this bike and level, or a new one (not saved yet). */
export async function draftFor(db, bike, level, today, now = Date.now()) {
  const open = (await db.inspections.where('bikeId').equals(bike.id).toArray()).filter((x) => !x.done && x.level === level).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  return open ?? { id: newInspectionId(now), bikeId: bike.id, date: today, level, km: typeof bike.km === 'number' ? bike.km : null, done: false, results: [], by: 'self' };
}

/** Save the draft as it is now. */
export const saveDraft = (db, insp) => db.inspections.put(insp);

/**
 * Finish an inspection. points: its checklist (allPoints); name(p): the shown name of a point.
 * → the Undo snapshot { id, before, bike, tasks: [ids] }.
 */
export async function finishInspection(db, insp, points, { name, prefix = 'Inspection', now = new Date().toISOString() } = {}) {
  return db.transaction('rw', [db.inspections, db.bikes, db.maintenance], async () => {
    const before = (await db.inspections.get(insp.id)) ?? null;
    const bike = await db.bikes.get(insp.bikeId);
    const plan = finishPlan(insp, points, { partUnit: (k) => PART[k]?.unit ?? '', name, prefix });
    let parts = bike?.parts ?? [];
    for (const x of plan.parts) parts = logPart(parts, x.key, x.entry);
    if (bike && plan.parts.length) await db.bikes.update(bike.id, { parts });
    const rows = await db.maintenance.toArray();
    let next = nextNumber(rows);
    const tasks = [];
    for (const pr of plan.problems) {
      const c = classify(pr.text);
      const id = next++;
      await db.maintenance.add({
        id, area: 'Bike', bikeId: insp.bikeId, subject: bike?.name ?? '', task: pr.text, category: 'Repair', source: 'Inspection',
        logDate: insp.date, leadWeeks: null, priority: pr.fix === 'shop' ? 'high' : 'medium', status: 'open', note: '', done: false,
        photo: pr.photo ?? null, topic: c.topic, fix: pr.fix, part: pr.part ?? c.part, dueDate: null, beforeRide: false, inspectionId: insp.id, createdAt: now,
      });
      tasks.push(id);
    }
    await db.inspections.put({ ...insp, done: true, doneAt: now, tasks });
    return { id: insp.id, before, bike: bike ?? null, tasks };
  });
}

/** Undo «Fertig»: the inspection as before (a draft or nothing), the bike's parts, the problems gone. */
export async function undoFinish(db, snap) {
  return db.transaction('rw', [db.inspections, db.bikes, db.maintenance], async () => {
    if (snap.before) await db.inspections.put(snap.before);
    else await db.inspections.delete(snap.id);
    if (snap.bike) await db.bikes.update(snap.bike.id, { parts: snap.bike.parts ?? [] });
    if (snap.tasks?.length) await db.maintenance.bulkDelete(snap.tasks);
  });
}

/**
 * Delete an inspection (from the history). The problems it made stay (they are their own things now);
 * the part entries it wrote go too (marked with its id). → the Undo snapshot { insp, bike }.
 */
export async function deleteInspection(db, id) {
  return db.transaction('rw', [db.inspections, db.bikes], async () => {
    const insp = await db.inspections.get(id);
    if (!insp) return null;
    const bike = await db.bikes.get(insp.bikeId);
    if (bike?.parts?.some((p) => (p.history ?? []).some((h) => h.inspectionId === id))) {
      await db.bikes.update(bike.id, { parts: bike.parts.map((p) => ({ ...p, history: (p.history ?? []).filter((h) => h.inspectionId !== id) })) });
    }
    await db.inspections.delete(id);
    return { insp, bike: bike ?? null };
  });
}

export async function restoreInspection(db, snap) {
  if (!snap?.insp) return;
  await db.transaction('rw', [db.inspections, db.bikes], async () => {
    await db.inspections.put(snap.insp);
    if (snap.bike) await db.bikes.update(snap.bike.id, { parts: snap.bike.parts ?? [] });
  });
}
