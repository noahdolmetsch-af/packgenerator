/**
 * Data updates Noah asked for in the chat, applied once on every device.
 * Each update checks the data itself before it changes anything, and only touches
 * the fields it names, so weights or notes you entered in the app stay as they are.
 */

const now = () => new Date().toISOString();

/**
 * 4.10.2026, answer 1 and 2: what is really mounted on each bike.
 * Four bikes: Scott Scale (the Excel "Hardtail"), Scott Spark (the Excel "Fully"),
 * Factor LS (the Excel "Gravel" is the same bike) and the newly ordered Canyon Lux World Cup.
 * Factor: frame bag, top tube bag, 2 bottles. Scott Scale: top tube bag, full frame bag, 2 food pouches.
 * Scott Spark: 2 food pouches, full frame bag. Canyon Lux World Cup: 2 bottle cages, tool bag.
 * Garmin mount and Quad Lock stay on all bikes. The 13 kg from the logbook become a note only.
 */
async function bikeSetups2026(db) {
  if (!(await db.bikes.get('scott-hardtail')) || (await db.bikes.get('canyon-world-cup'))) return false;
  await db.transaction('rw', db.items, db.containers, db.bikes, db.trips, async () => {
    // A full frame bag is new in the gear list (to weigh), plus the two bottle cages as places.
    if (!(await db.items.get('TA14'))) {
      await db.items.put({
        id: 'TA14', name: 'Full frame bag', brand: '', model: '', category: 'bags', weightG: null, qty: 1, weightStatus: 'missing',
        carry: 'bike', defaultBag: 'frame', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'],
        note: 'Added 4.10.2026: on the Scott Scale and the Scott Fully.', updatedAt: now(),
      });
    }
    const bags = [
      { id: 'bag-TA14', name: 'Full frame bag', slot: 'frame', volumeL: null, itemId: 'TA14', pieces: 1, note: '' },
      { id: 'bag-cage1', name: 'Bottle cage (down tube)', slot: 'cage1', volumeL: 0.75, itemId: (await db.items.get('BK04')) ? 'BK04' : null, pieces: 1, note: 'Holds one bottle' },
      { id: 'bag-cage2', name: 'Bottle cage (seat tube)', slot: 'cage2', volumeL: 0.75, itemId: (await db.items.get('BK04')) ? 'BK04' : null, pieces: 1, note: 'Holds one bottle' },
    ];
    for (const b of bags) if (!(await db.containers.get(b.id))) await db.containers.put(b);

    const fixtures = ['BK02', 'BK01'].filter(Boolean); // Garmin mount, Quad Lock
    const scott = await db.bikes.get('scott-hardtail');
    await db.bikes.update('scott-hardtail', {
      name: 'Scott Scale',
      type: 'Hardtail',
      setup: { top: 'bag-TA06', frame: 'bag-TA14', pouchL: 'bag-TA08-L', pouchR: 'bag-TA08-R' },
      fixtures,
      // The logbook value is only a hint now; a weight typed in the app stays.
      ...(scott.weightG === 13000 ? { weightG: null } : {}),
      weightNote: 'About 13 kg (logbook). Weigh it.',
    });
    if (await db.bikes.get('fully')) {
      await db.bikes.update('fully', { name: 'Scott Spark', type: 'Full suspension', setup: { frame: 'bag-TA14', pouchL: 'bag-TA08-L', pouchR: 'bag-TA08-R' }, fixtures });
    }
    const gravel = await db.bikes.get('gravel');
    const factor = await db.bikes.get('factor-ls');
    if (factor) {
      // "Gravel" in the Excel is the Factor LS: its notes join the Factor, then the duplicate goes.
      const use = [factor.use, gravel?.use].filter((u) => u && u !== '-').join('; ');
      const openPoints = [factor.openPoints, gravel?.openPoints].filter((u) => u && u !== '-').join('; ');
      await db.bikes.update('factor-ls', {
        type: 'Road / gravel', use, openPoints,
        gearing: factor.gearing?.length ? factor.gearing : gravel?.gearing ?? [],
        setup: { frame: 'bag-TA07', top: 'bag-TA06', cage1: 'bag-cage1', cage2: 'bag-cage2' }, fixtures,
      });
      if (gravel) {
        await db.trips.filter((t) => t.bikeId === 'gravel').modify({ bikeId: 'factor-ls', bike: 'Factor LS' });
        await db.bikes.delete('gravel');
      }
    }
    const slots = (await db.bikes.get('scott-hardtail')).slots;
    await db.bikes.put({
      id: 'canyon-world-cup', name: 'Canyon Lux World Cup', type: 'Full suspension', use: 'Newly ordered (October 2026)', gearing: [], openPoints: '',
      weightG: null, slots, setup: { cage1: 'bag-cage1', cage2: 'bag-cage2', tool: 'bag-TA09' }, fixtures,
    });
  });
  return true;
}

/** 4.10.2026, answer 4: a "Light" overnight set with the lights for riding in the dark. */
async function lightSet2026(db) {
  const ids = ['LI01', 'LI02', 'LI03'];
  const todo = (await db.items.bulkGet(ids)).filter((i) => i && !i.sets?.includes('light') && !i.lightSetDone);
  for (const i of todo) await db.items.update(i.id, { sets: [...(i.sets ?? []), 'light'], lightSetDone: true });
  return todo.length > 0;
}

export const UPDATES = [bikeSetups2026, lightSet2026];

export async function applyUpdates(db) {
  for (const update of UPDATES) await update(db);
}
