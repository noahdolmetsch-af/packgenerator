/**
 * Data cleanup (Noah 14.10.2026, thread «Daten einmal bereinigen», answers 1a and 3a).
 *
 * Runs on every start and after an import, after the other updates (tidy.js). Each step only
 * changes records that still need it, so a second run changes nothing. Before the first change a
 * full copy of the data is kept in the "meta" table (never exported), like the demo and the Excel
 * import do, so nothing gets lost.
 *
 * 1. Bikes of the first Excel (by their IDs): their order and extra names become fields on the bike
 *    (bike.order, bike.aliases), and the repairs of the Excel sheet "Wartung" get their bike
 *    (task.bikeId). Before, these were lists in the code.
 * 2. Old kits: they became templates and sets in v0.26.0 (updates.js kitTemplates2026, which runs
 *    before, also for the kits of an older backup). The kits table and item.kits are emptied.
 * 3. Weight checks of the Excel: no page showed them. They become one kept note, then the table
 *    is emptied.
 * 4. Old building block fields: the blocks hold the same since v0.33.0 and v0.66.0, so the old set
 *    keys, role 'standard' / 'optional' and always go from the items (role 'worn' stays: «Am Körper»).
 *
 * The tables kits and weightChecks stay in the schema, empty, so every older backup still opens.
 */
import { buildBackup } from './backup.js';
import { isOldSetKey } from './gear.js';
import { oldFieldsPatch } from './blocks2026.js';
import { t } from './i18n.svelte.js';

/** Key in the "meta" table: the copy of all data from before the first cleanup step. Never exported. */
export const CLEANUP_BACKUP = 'cleanupBackup';
export const WEIGHT_NOTE_ID = 'note-weight-checks';

/**
 * The bike IDs of the first Excel import. Only these IDs are matched, other data gets nothing.
 * order: their place on screen (array position; Noah 13.10.2026 «1a»: Canyon Lux, Factor LS, Scale,
 * Spark); aliases: words in a note that mean this bike; subjects: the bike names in the Excel sheet
 * "Wartung". oldOrder: the order the first run of 0.131.0 wrote (Scale first, the old list in the
 * code); a bike that still has it gets the new place once. Can go once every device has run the cleanup.
 */
const EXCEL_BIKES = [
  { id: 'canyon-world-cup', aliases: ['canyon', 'lux'], subjects: [], oldOrder: 4 },
  { id: 'factor-ls', aliases: ['factor', 'gravel'], subjects: ['Factor'], oldOrder: 3 },
  { id: 'scott-hardtail', aliases: ['hardtail', 'scale'], subjects: ['Hardtail'], oldOrder: 1 },
  { id: 'fully', aliases: ['fully', 'spark'], subjects: ['Full suspension', 'Fully'], oldOrder: 2 },
];

/** Step 1, pure: the bike and task changes ({ bikes: [[id, patch]], tasks: [[id, patch]] }). */
export function excelBikeChanges(bikes, tasks) {
  const out = { bikes: [], tasks: [] };
  const have = new Set(bikes.map((b) => b.id));
  EXCEL_BIKES.forEach((x, n) => {
    const bike = bikes.find((b) => b.id === x.id);
    if (!bike) return;
    const patch = {};
    if (bike.order == null || bike.order === x.oldOrder) patch.order = n + 1;
    if (bike.aliases == null) patch.aliases = [...x.aliases];
    if (Object.keys(patch).length) out.bikes.push([bike.id, patch]);
  });
  for (const task of tasks) {
    if (task.bikeId || !task.subject) continue;
    const x = EXCEL_BIKES.find((b) => b.subjects.includes(task.subject) && have.has(b.id));
    if (x) out.tasks.push([task.id, { bikeId: x.id }]);
  }
  return out;
}

/** Step 4, pure: an item without the old block fields, or null when it has none. */
export function withoutOldFields(item) {
  // Old set keys only once blocksplit.js has mapped them (item.split2026); before, they are still needed.
  const oldSets = !!item.split2026;
  const patch = oldFieldsPatch(item);
  const flags = ['always', 'kits', 'lightSetDone'].some((k) => k in item);
  if (!oldSets && !Object.keys(patch).length && !flags) return null;
  const { always, kits, lightSetDone, ...rest } = item;
  const out = { ...rest, ...patch };
  if (oldSets) {
    out.sets = (out.sets ?? []).filter((k) => !isOldSetKey(k));
    delete out.split2026;
  }
  return out;
}

/** Step 3, pure: the lines of the weight checks note, one per check. */
export function weightCheckLines(rows) {
  return rows.map((r) => {
    const g = r.adoptedG != null ? `${r.adoptedG} g` : '';
    return ['- ' + String(r.item ?? '').trim(), g, r.decision, r.online, r.logbook ? `${t('Logbook')}: ${r.logbook}` : '', r.sources, r.link]
      .filter((s) => s && String(s).trim())
      .join(' · ');
  });
}

/**
 * Run the cleanup. Returns what changed: { bikes, tasks, items, kits, weightChecks } (counts).
 * Gets the backup in before the first write.
 */
export async function cleanupData(db) {
  const res = { bikes: 0, tasks: 0, items: 0, kits: 0, weightChecks: 0 };
  let kept = !!(await db.table('meta').get(CLEANUP_BACKUP));
  const keep = async () => {
    if (kept) return;
    kept = true;
    await db.table('meta').put({ key: CLEANUP_BACKUP, at: new Date().toISOString(), backup: await buildBackup(db) });
  };

  // 2 (the kits are templates already: updates.js ran before)
  if ((res.kits = await db.kits.count())) {
    await keep();
    await db.kits.clear();
  }

  // 1
  const ch = excelBikeChanges(await db.bikes.toArray(), await db.maintenance.toArray());
  if (ch.bikes.length || ch.tasks.length) {
    await keep();
    await db.transaction('rw', db.bikes, db.maintenance, async () => {
      for (const [id, patch] of ch.bikes) await db.bikes.update(id, patch);
      for (const [id, patch] of ch.tasks) await db.maintenance.update(id, patch);
    });
    res.bikes = ch.bikes.length;
    res.tasks = ch.tasks.length;
  }

  // 3
  const checks = await db.weightChecks.toArray();
  if (checks.length) {
    await keep();
    await db.transaction('rw', db.notes, db.weightChecks, async () => {
      const old = await db.notes.get(WEIGHT_NOTE_ID);
      const lines = weightCheckLines(checks).filter((l) => !(old?.text ?? '').split('\n').includes(l));
      const now = new Date().toISOString();
      if (old) {
        if (lines.length) await db.notes.update(WEIGHT_NOTE_ID, { text: [old.text, ...lines].filter(Boolean).join('\n'), editedAt: now });
      } else {
        await db.notes.put({ id: WEIGHT_NOTE_ID, kind: 'note', status: 'kept', at: now, editedAt: now, title: t('Weight checks from the Excel'), text: lines.join('\n'), topic: 'gear', pinned: false, photo: null });
      }
      await db.weightChecks.clear();
    });
    res.weightChecks = checks.length;
  }

  // 4
  const items = (await db.items.toArray()).map(withoutOldFields).filter(Boolean);
  if (items.length) {
    await keep();
    await db.items.bulkPut(items);
    res.items = items.length;
  }
  return res;
}
