/**
 * «Alles selbst bearbeiten» (Noah 19.10.2026: «alle daten können vom nutzer selber hinzugefügt, umbenannt
 * oder gelöscht werden»): a bike can always be deleted, also when trips use it.
 *
 * The delete window (GroupDeleteSheet) asks where its trips go (a template naming a deleted bike simply offers none): «Ohne Velo» (first choice)
 * or another bike. What belongs to the bike alone goes with it: its km book, workshop visits, photos and
 * care tasks. Everything comes back with «Undo» (one snapshot, one transaction).
 */

const TABLES = ['bikes', 'trips', 'kmBook', 'visits', 'photos', 'maintenance'];
const tablesOf = (db) => TABLES.filter((n) => db[n]).map((n) => db[n]);

/** How much is linked to the bike: { trips, km, visits, photos, tasks }. */
export async function bikeLinks(db, id) {
  const of = async (name) => (db[name] ? db[name].filter((x) => x.bikeId === id).count() : 0);
  return {
    trips: await of('trips'),
    km: await of('kmBook'),
    visits: await of('visits'),
    photos: await of('photos'),
    tasks: await of('maintenance'),
  };
}

/** The trip moved to `to` (a bike record) or to no bike. Pure, for tests. */
export function moveTrip(trip, to) {
  return to ? { ...trip, bikeId: to.id, bike: to.name } : { ...trip, bikeId: null, bike: null };
}

/**
 * Deletes the bike. to: the id of the bike that gets its trips, or null (no bike).
 * → the snapshot for undoDeleteBike, or null when the bike is not there.
 */
export async function deleteBike(db, id, to = null) {
  return db.transaction('rw', tablesOf(db), async () => {
    const bike = await db.bikes.get(id);
    if (!bike) return null;
    const target = to && to !== id ? await db.bikes.get(to) : null;
    const mine = async (name) => (db[name] ? db[name].filter((x) => x.bikeId === id).toArray() : []);
    const snap = { bike, trips: await mine('trips'), kmBook: await mine('kmBook'), visits: await mine('visits'), photos: await mine('photos'), maintenance: await mine('maintenance') };
    if (snap.trips.length) await db.trips.bulkPut(snap.trips.map((x) => moveTrip(x, target)));
    for (const name of ['kmBook', 'visits', 'photos', 'maintenance']) {
      if (snap[name].length) await db[name].bulkDelete(snap[name].map((x) => x.id));
    }
    await db.bikes.delete(id);
    return snap;
  });
}

/** Undo of deleteBike: the bike and everything linked to it as it was. */
export async function undoDeleteBike(db, snap) {
  if (!snap?.bike) return;
  await db.transaction('rw', tablesOf(db), async () => {
    await db.bikes.put(snap.bike);
    for (const name of ['trips', 'kmBook', 'visits', 'photos', 'maintenance']) {
      if (snap[name]?.length) await db[name].bulkPut(snap[name]);
    }
  });
}
