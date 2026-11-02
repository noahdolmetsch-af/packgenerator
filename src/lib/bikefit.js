/**
 * «Welches Velo passt zur Tour?» (idea C3 of «App denkt mit», Noah 02.11.2026 «3b»): on top of the bike
 * comparison (choice.js bikeChoice) one sentence says which bike fits this trip best and why, and each
 * bike gets the plain reasons for and against. Only facts the app has: the bags against the gear, the care
 * that is due before the start, the weight on a climbing route. A suggestion, nothing is changed here.
 * Pure functions, tested in tests/bikefit.test.js.
 */

/** From this many climbing metres per km a route counts as hilly. */
export const HILLY_M_PER_KM = 15;

/**
 * rows: bikeChoice rows; trip: the trip (route.km, route.gainM).
 * → { best: bikeId | null, why: [kind], byBike: { [id]: { score, pros: [kind], cons: [kind] } } }
 * kinds: pros 'room' | 'care' | 'light'; cons 'tight' | 'late' | 'soon'.
 * best is null when there is only one bike or no bike is clearly ahead (the current bike wins a tie).
 */
export function bikeFit(rows = [], trip = null) {
  const km = Number(trip?.route?.km) || 0;
  const hilly = km > 0 && (Number(trip?.route?.gainM) || 0) / km >= HILLY_M_PER_KM;
  const byBike = {};
  for (const r of rows) {
    const pros = [];
    const cons = [];
    if (r.full) cons.push('tight');
    else if (r.gearL != null && r.volumeL > 0) pros.push('room');
    if (r.late) cons.push('late');
    else if (r.care?.soon?.length) cons.push('soon');
    else pros.push('care');
    if (hilly && r.lightest && r.totalG && !r.missing) pros.push('light');
    const w = { tight: -3, late: -2, soon: -1, room: 1, care: 1, light: 2 };
    byBike[r.bike.id] = { score: [...pros, ...cons].reduce((s, k) => s + w[k], 0), pros, cons };
  }
  if (rows.length < 2) return { best: null, why: [], byBike };
  const order = [...rows].sort((a, b) => byBike[b.bike.id].score - byBike[a.bike.id].score || Number(b.current) - Number(a.current));
  const [first, second] = order;
  const clear = byBike[first.bike.id].score > byBike[second.bike.id].score;
  return { best: clear ? first.bike.id : null, why: clear ? byBike[first.bike.id].pros : [], byBike };
}
