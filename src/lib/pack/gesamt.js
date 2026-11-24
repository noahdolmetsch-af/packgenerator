/**
 * «Gesamtgewicht» (Noah 23.11.2026 «1a», Thread «Packen nach Taschen am Bike ausbauen»): the weight of a trip in steps,
 * each step one line: only the items, with the bags, with the bike, with you. The numbers come from tripStats
 * (trips.js); nothing is stored. A trip without a bike has no line «With the bike».
 *
 * Every row: { key, g (the total up to here), add (what this step adds), missing (parts without a weight), estimate }.
 * The worn bags (Back, Hip) are part of «On me» in tripStats, so «only the items» takes them out and «with the bags» puts
 * them back, nothing is counted twice.
 */

/** The rows of the total weight; `bike`: does the trip have a bike. A row that adds nothing and has nothing missing stays. */
export function totalRows(stats, { bike = true } = {}) {
  if (!stats) return [];
  const items = (stats.gearG ?? 0) + (stats.onMeG ?? 0) - (stats.wornBagsG ?? 0);
  const rows = [{ key: 'items', g: items, add: items, missing: stats.unweighed ?? 0, estimate: false }];
  const bagsAdd = (stats.wornBagsG ?? 0) + (stats.bagsG ?? 0);
  rows.push({ key: 'bags', g: items + bagsAdd, add: bagsAdd, missing: rows[0].missing + (stats.bagsMissing ?? 0) + (stats.wornBagsMissing ?? 0), estimate: false });
  if (bike) {
    const add = stats.bikeG ?? 0;
    rows.push({ key: 'bike', g: rows.at(-1).g + add, add, missing: rows.at(-1).missing + (add ? 0 : 1), estimate: stats.bikeKind === 'estimate' });
  }
  if ((stats.riderG ?? 0) > 0) {
    const last = rows.at(-1);
    rows.push({ key: 'rider', g: last.g + stats.riderG, add: stats.riderG, missing: last.missing, estimate: last.estimate });
  }
  return rows;
}
