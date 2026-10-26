/**
 * Gruppenfahrt für Events (Noah 26.10.2026 «4a»): suggestions for «Who has what with them» from your own
 * packing list: the tour running now or the next one, what is packed (or all of it when nothing is packed
 * yet). Read only on this device; only what you tap goes to the group.
 */
import { localDay } from '../localday.js';
import { tripEnd } from '../tripstate.js';
import { nameOf } from '../i18n.svelte.js';

export async function packSuggestions(db, today = localDay()) {
  const trips = (await db.trips.toArray()).filter((x) => !x.skipped && x.startDate && x.entries?.length);
  const running = trips.find((x) => x.startDate <= today && (tripEnd(x) ?? x.startDate) >= today);
  const next = trips.filter((x) => x.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const trip = running ?? next;
  if (!trip) return [];
  const packed = trip.entries.filter((e) => e.packed);
  const ids = [...new Set((packed.length ? packed : trip.entries).map((e) => e.itemId).filter(Boolean))];
  const items = await db.items.bulkGet(ids);
  return [...new Set(items.filter(Boolean).map((i) => String(nameOf(i) ?? '').trim()).filter(Boolean))].slice(0, 60);
}
