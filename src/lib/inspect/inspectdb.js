/**
 * «Velo-Inspektion»: the writes, each with what Undo needs.
 * - an inspection is saved as a draft while it runs (done: false), so it can be continued later;
 * - «Fertig» marks it done, writes the part history entries (chain %, rotor mm …) and turns «Fix myself» and
 *   «Bike shop» into problems (maintenance, source 'Inspection'): the shop ones land in the workshop order.
 * - Noah 19.10.2026 «2a»: a measured part that is soon or already worn (chain, pads, rotor) goes on the
 *   wishlist (items, ownership 'wishlist'), with about how many km and days are left; switchable per bike.
 * All in one transaction; Undo puts everything back.
 */
import { logPart, PART, wishFor } from '../care.js';
import { classify } from '../problems.js';
import { nextNumber } from '../notes.js';
import { nextId } from '../gear.js';
import { t, dateOf } from '../i18n.svelte.js';
import { finishPlan, wearTrend, kmPerDay, kmToDate, bikeSettings } from './inspect.js';

/**
 * The measured values of one point over time: the done inspections of the bike, plus the part's own checks
 * in the same unit (the chain checker), without the ones an inspection wrote. → wearTrend input.
 */
export function wearOf(bikeParts, inspections, bikeId, b, current) {
  const part = (bikeParts ?? []).find((x) => x.key === b.part) ?? null;
  const same = PART[b.part]?.unit && PART[b.part].unit === b.measure?.unit;
  const own = same && part ? { ...part, history: (part.history ?? []).filter((h) => !h.inspectionId) } : null;
  const extra = [...(inspections ?? []).filter((x) => x?.bikeId === bikeId && x.done), current]
    .map((x) => ({ km: x?.km, value: (x?.results ?? []).find((r) => r.id === b.pointId)?.value }))
    .filter((v) => typeof v.km === 'number' && typeof v.value === 'number');
  return wearTrend(own, { limit: b.measure?.limit, low: !!b.measure?.low, extra });
}

/** The wishlist note: what the inspection saw and about when the part is needed. */
export function buyNote(b, trend, perDay, today) {
  if (b.state === 'worn') return t('From the inspection: worn, replace it now.');
  if (trend == null) return t('From the inspection: soon worn.');
  const date = kmToDate(trend.kmLeft, perDay, today);
  return date ? t('From the inspection: about {km} km left, needed around {date}.', { km: trend.kmLeft, date: dateOf(date) }) : t('From the inspection: about {km} km left.', { km: trend.kmLeft });
}

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
  return db.transaction('rw', [db.inspections, db.bikes, db.maintenance, db.items, db.kmBook], async () => {
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
    // «2a»: soon or worn parts on the wishlist (not twice: wishFor skips a name already there)
    const wishes = [];
    if (bike && plan.buy.length && bikeSettings(bike).buy) {
      const items = await db.items.toArray();
      const done = (await db.inspections.where('bikeId').equals(bike.id).toArray()).filter((x) => x.id !== insp.id);
      const perDay = kmPerDay(await db.kmBook.where('bikeId').equals(bike.id).toArray(), bike.id, insp.date);
      for (const b of plan.buy) {
        const part = parts.find((x) => x.key === b.part) ?? { key: b.part };
        const item = wishFor(part, bike, items, nextId(items, 'bike'));
        if (!item) continue;
        item.note = `${buyNote(b, b.state === 'worn' ? null : wearOf(parts, done, bike.id, b, insp), perDay, insp.date)} ${item.note}`;
        item.updatedAt = now;
        await db.items.add(item);
        items.push(item);
        wishes.push(item.id);
      }
    }
    await db.inspections.put({ ...insp, done: true, doneAt: now, tasks, wishes });
    return { id: insp.id, before, bike: bike ?? null, tasks, wishes };
  });
}

/** Undo «Fertig»: the inspection as before (a draft or nothing), the bike's parts, the problems gone. */
export async function undoFinish(db, snap) {
  return db.transaction('rw', [db.inspections, db.bikes, db.maintenance, db.items], async () => {
    if (snap.before) await db.inspections.put(snap.before);
    else await db.inspections.delete(snap.id);
    if (snap.bike) await db.bikes.update(snap.bike.id, { parts: snap.bike.parts ?? [] });
    if (snap.tasks?.length) await db.maintenance.bulkDelete(snap.tasks);
    if (snap.wishes?.length) await db.items.bulkDelete(snap.wishes);
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
