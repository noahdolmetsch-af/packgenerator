/**
 * Paket Q Zusatz 3 «Für unterwegs offline speichern» (Noah 19.10.2026 «1-3 alle a»): before a trip one
 * button puts the newest weather of the trip, the alerts and news on this device. The packing list,
 * the bags and the checks are on the device anyway. Afterwards one line says what is saved and when.
 * Pure parts, tested in tests/offline.test.js; OfflineSave.svelte does the fetching.
 */

const plusDays = (day, n) => new Date(Date.UTC(...day.split('-').map((x, i) => (i === 1 ? x - 1 : +x))) + n * 864e5).toISOString().slice(0, 10);

/** Show the button: from 3 days before the start until the last day of the trip. */
export function offlineSoon(trip, today) {
  if (!trip?.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(trip.startDate)) return false;
  const end = plusDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1);
  return trip.startDate <= plusDays(today, 3) && end >= today;
}

/** The place for the weather: the trip's start place, else the home place (both need lat and lon). */
export const offlinePlace = (trip, home) => [trip?.place, home].find((p) => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))) ?? null;

/**
 * What the line says after saving: { text, vars } (English key). parts: { weather, alerts, news } each
 * true when it was saved.
 */
export function offlineLine(parts = {}) {
  const got = ['weather', 'alerts', 'news'].filter((k) => parts[k]);
  if (!got.length) return { text: 'Nothing could be loaded. The packing list and your checks are on the device anyway.' };
  const NAME = { weather: 'the weather', alerts: 'the alerts', news: 'the news' };
  return { text: 'Saved for the way: {what} and your packing list.', vars: { what: got.map((k) => NAME[k]) } };
}
