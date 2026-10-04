/**
 * Round C answer 3: when an item is replaced by a new one, every place that used the old one
 * now uses the new one: trips (packing lists and ready checks), bags linked to it, bike mounts.
 * A trip that already has the new item keeps its own entry and drops the old one.
 */
export function swapInTrip(trip, oldId, newId) {
  const hasNew = trip.entries.some((e) => e.itemId === newId);
  const entries = hasNew ? trip.entries.filter((e) => e.itemId !== oldId) : trip.entries.map((e) => (e.itemId === oldId ? { ...e, itemId: newId, packed: false } : e));
  const ready = (trip.ready ?? []).map((r) => (r.itemId === oldId ? { ...r, itemId: newId } : r));
  return { entries, ready };
}

export async function replaceEverywhere(db, oldId, newId) {
  await db.transaction('rw', db.trips, db.containers, db.bikes, async () => {
    const uses = (t) => t.entries.some((e) => e.itemId === oldId) || (t.ready ?? []).some((r) => r.itemId === oldId);
    for (const t of await db.trips.filter(uses).toArray()) await db.trips.update(t.id, swapInTrip(t, oldId, newId));
    await db.containers.filter((c) => c.itemId === oldId).modify({ itemId: newId });
    await db.bikes.filter((b) => (b.fixtures ?? []).includes(oldId)).modify((b) => {
      b.fixtures = b.fixtures.map((id) => (id === oldId ? newId : id));
    });
  });
}
