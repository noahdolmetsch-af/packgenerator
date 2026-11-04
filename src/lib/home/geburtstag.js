/**
 * «Velo-Geburtstag» (Noah 03.11.2026 «b», Paket C idea 21): on the day a bike was bought, a year or more ago,
 * Today congratulates: «Your Gravel turns 2 today. You have ridden 6'428 km together.»
 * A bike bought on 29 February has its birthday on 28 February in the years without one.
 * The km are the km of the bike as stored (bike.km); without them the line stops after the first sentence.
 * Pure functions, tested in tests/geburtstag.test.js.
 */

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** The bikes with a birthday on `today` (YYYY-MM-DD): [{ bike, years, km }] with years >= 1; km a number or null. */
export function bikeBirthdays(bikes = [], today) {
  const T = DAY.exec(today ?? '');
  if (!T) return [];
  const [ty, tm, td] = [Number(T[1]), Number(T[2]), Number(T[3])];
  const out = [];
  for (const bike of bikes) {
    const B = DAY.exec(bike?.bought ?? '');
    if (!B) continue;
    const [by, bm, bd] = [Number(B[1]), Number(B[2]), Number(B[3])];
    const years = ty - by;
    if (years < 1) continue;
    const dd = bm === 2 && bd === 29 && !isLeap(ty) ? 28 : bd;
    if (bm !== tm || dd !== td) continue;
    out.push({ bike, years, km: typeof bike.km === 'number' && bike.km > 0 ? Math.round(bike.km) : null });
  }
  return out;
}
