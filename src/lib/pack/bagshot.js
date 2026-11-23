/**
 * Bikepacking-Vorschlag K1 «Taschen-Fotos» (Noah 23.11.2026): one photo per bag of a trip, taken on the packing
 * day, so that you see what lies where at night, tired, in the rain. The photos live in db.photos (field
 * `bagShot`, no bikeId, so the bike pages and the album never show them); no new table, no Dexie version.
 * Pure functions; the page parts are BagShot.svelte (Pack) and the box «What lies where» (race mode).
 * Tested in tests/bagshot.test.js.
 */

/** The photos of the bags of one trip: { slot: photo }, the newest photo of a bag wins. */
export function bagShotsOf(photos = [], tripId = '') {
  const out = {};
  for (const p of photos) {
    if (!p?.bagShot || !p.data || p.tripId !== tripId || !p.slot) continue;
    const old = out[p.slot];
    if (!old || String(p.addedAt ?? '').localeCompare(String(old.addedAt ?? '')) > 0) out[p.slot] = p;
  }
  return out;
}

/** A new row for db.photos: the photo of one bag (slot) of a trip; name = the bag's name at that moment. */
export function newBagShot({ tripId, slot, name = '', data, day = '', now = new Date() }) {
  return {
    id: `bagshot-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    bikeId: null,
    tripId,
    slot,
    bagShot: true,
    name: String(name).replace(/\s+/g, ' ').trim().slice(0, 60),
    main: false,
    data,
    day,
    addedAt: now.toISOString(),
  };
}

/** The bags of a trip that have a photo, in the order of the given bag list: [{ slot, name, photo }]. */
export function bagShotList(photos = [], tripId = '', slots = []) {
  const by = bagShotsOf(photos, tripId);
  const order = slots.filter((s) => by[s]);
  for (const s of Object.keys(by)) if (!order.includes(s)) order.push(s);
  return order.map((slot) => ({ slot, name: by[slot].name, photo: by[slot] }));
}
