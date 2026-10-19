/**
 * Paket U «Rennen» › Plan (Noah 19.10.2026 17:23 «genau diese Infos im Frontend», «1b 2a und b»):
 * the overview of one race, fed only from the user's own race data:
 * - summaryOf: finish, Sundays, night 1, depot day, the biggest gaps without a shop
 * - recommend: which of the three ways and why
 * - CASES / casesOf: the 40 ideas, each with its result for this race (or where to fill it in)
 * - scenarios: saved sets of assumptions, played through side by side
 * Pure functions; texts come back already translated through the `t` you pass in.
 */
import { localOf, countdown, climbsOf, samples, countriesOf, COUNTRY, sameRace, stomachList, trainingPlan, addDay } from './race.js';
import { biggestGaps } from './files.js';
import { dryStretches, exitStations } from './outside.js';
import { laundryPlan, careAfter, PAPERS } from './more.js';
import { simulate, assumptionsOf } from './strategy.js';
import { sunTimes } from '../blockplan.js';

const hhmm = (ms) => localOf(ms).slice(11, 16);
const dayN = (sim, km) => (sim?.days ?? []).find((d) => km <= d.toKm)?.n ?? null;
const r1 = (x) => Math.round(x * 10) / 10;
const hText = (h) => {
  const a = Math.floor(h);
  const m = Math.round((h - a) * 60);
  return m === 60 ? `${a + 1} h` : m ? `${a} h ${String(m).padStart(2, '0')}` : `${a} h`;
};

/**
 * The summary card. sim = the chosen way played through. → { finish, days, rideH, sundays: [{ n, day,
 * fromKm, toKm, shops }], night1: { bed, place, km, arrive } | null, depot: { n, at, km, name } | null,
 * gaps: [{ fromKm, toKm, km }] (shop gaps, longest 3) }
 */
export function summaryOf({ sim, pois = [], km = 0 }) {
  if (!sim?.days?.length) return null;
  const shopsIn = (a, b) => pois.filter((p) => (p.kind === 'shop' || p.kind === 'fuel') && p.km >= a && p.km <= b).length;
  const sundays = sim.days.filter((d) => d.sunday).map((d) => ({ n: d.n, day: localOf(d.leave).slice(0, 10), fromKm: d.fromKm, toKm: d.toKm, shops: shopsIn(d.fromKm, d.toKm) }));
  const d1 = sim.days.length > 1 ? sim.days[0] : null;
  const depotPoi = pois.find((p) => p.kind === 'depot');
  let depot = null;
  if (depotPoi) {
    const n = dayN(sim, depotPoi.km);
    const d = sim.days.find((x) => x.n === n);
    const f = d && d.toKm > d.fromKm ? (depotPoi.km - d.fromKm) / (d.toKm - d.fromKm) : 0;
    depot = d ? { n, at: d.leave + (d.arrive - d.leave) * Math.max(0, Math.min(1, f)), km: Math.round(depotPoi.km), name: depotPoi.name || '' } : null;
  }
  return {
    finish: sim.finish,
    days: sim.days.length,
    rideH: sim.days.reduce((s, d) => s + d.rideH, 0),
    sundays,
    night1: d1 ? { bed: d1.bed, place: d1.place, km: d1.toKm, arrive: d1.arrive } : null,
    depot,
    gaps: pois.length ? biggestGaps(pois, km, ['shop'], 3) : [],
  };
}

/**
 * Which way fits best, and why. A calm score: your «good for my head» counts most; late hotels, days
 * over 18 h, nights without any place and extra kilos count against it; the finish a little.
 * → { way, reasons: [text] } or null.
 */
export function recommend(sims = [], t = (k) => k) {
  const ok = sims.filter((s) => s?.done && s.days?.length);
  if (!ok.length) return null;
  const fastest = Math.min(...ok.map((s) => s.totalH));
  const score = (s) => (s.mind ?? 3) * 2 - s.lateNights - 2 * s.days.filter((d) => d.dayH > 18).length - 2 * s.days.filter((d) => d.bed === 'tent' && !d.placeId).length - s.kg * 0.5 - (s.totalH - fastest) / 12;
  const best = [...ok].sort((a, b) => score(b) - score(a))[0];
  const reasons = [];
  const heaviest = Math.max(...ok.map((s) => s.kg));
  if (best.kg < heaviest) reasons.push(t('{kg} kg less to carry than the heaviest way.', { kg: r1(heaviest - best.kg) }));
  const hotel = ok.find((s) => s.way === 'hotel');
  const bivy = best.days.filter((d) => d.bed === 'bivy').length;
  if (best.way === 'mixed' && bivy && hotel) reasons.push(tnLike(t, bivy, 'Solves {n} night without a hotel in reach with the bivy.', 'Solves {n} nights without a hotel in reach with the bivy.'));
  if (best.totalH - fastest < 0.5) reasons.push(t('The fastest of the three ways.'));
  else reasons.push(t('Finishes {h} after the fastest way.', { h: hText(best.totalH - fastest) }));
  if (best.mind != null) reasons.push(t('Good for your head: {n} of 5.', { n: best.mind }));
  if (!best.lateNights) reasons.push(t('Every hotel is reached before the check-in time.'));
  return { way: best.way, reasons };
}
const tnLike = (t, n, one, many) => t(n === 1 ? one : many, { n });

/* ---------- the 40 cases ---------- */

/** The 40 ideas: number, title (English key), the part where you work on it. */
export const CASES = [
  [1, 'Race schedule', 'strategy', 'stages'], [2, 'Supply map', 'route', 'food'], [3, 'Sleep plan', 'ride', 'ride-sleep'], [4, 'Mandatory kit', 'prepare', 'prep-rules'],
  [5, 'Weather along the route', 'route', 'wx'], [6, 'Stop analysis', 'after', 'after-stops'], [7, 'Dress rehearsal and countdown', 'prepare', 'prep-countdown'], [8, 'Ways out and trains', 'route', 'exit'],
  [9, 'Comfort at night', 'route', 'night'], [10, 'Food log', 'ride', 'ride-food'], [11, 'Rig comparison', 'prepare', 'prep-rig'], [12, 'Countries', 'route', 'countries'],
  [13, 'Light plan', 'route', 'light'], [14, 'Contact points', 'ride', 'ride-contacts'], [15, 'Recovery', 'after', 'after-recovery'], [16, 'Year after year', 'after', 'after-years'],
  [17, 'Race mode', 'ride', 'ride-next', true], [18, 'Ride on or sleep?', 'ride', 'ride-sleep'], [19, 'Dry stretches', 'route', 'dry'], [20, 'Climbs by time of day', 'route', 'climbs'],
  [21, 'Drop bags', 'prepare', 'prep-dropbags'], [22, 'Bike check', 'after', 'after-bike'], [23, 'My why', 'prepare', 'prep-why'], [24, 'Race report', 'after', 'after-report'],
  [25, 'Cut-off calculator', 'ride', 'ride-next', true], [26, 'Stomach test', 'prepare', 'prep-stomach'], [27, 'Beds in reach', 'route', 'beds'], [28, 'Bad weather plan', 'prepare', 'prep-badweather'],
  [29, 'Mini goals', 'ride', 'ride-next', true], [30, 'Sun protection', 'route', 'uv'], [31, 'Rest day', 'strategy', 'stages', true], [32, 'Training for the race', 'prepare', 'prep-training'],
  [33, 'Briefing sheet', 'prepare', 'prep-brief'], [34, 'Puncture plan by surface', 'prepare', 'prep-spares'], [35, 'Main roads at night', 'route', 'busy'], [36, 'Total weight per day', 'prepare', 'prep-weight'],
  [37, 'Laundry plan', 'prepare', 'prep-laundry'], [38, 'Section analysis', 'after', 'after-sections'], [39, 'Tools fit the bike', 'prepare', 'prep-tool'], [40, 'Paperwork', 'prepare', 'prep-papers'],
].map(([n, title, part, box, core = false]) => ({ n, title, part, box, core }));
/** The box id → its case numbers (a box can hold several cases). */
export const CASES_OF = CASES.reduce((m, c) => ((m[c.box] ??= []).push(c.n), m), {});
/** The groups of the overview «All 40 functions». */
export const CASE_GROUPS = [
  { key: 'strategy', name: 'Strategy' },
  { key: 'prepare', name: 'Prepare' },
  { key: 'route', name: 'Along the route' },
  { key: 'ride', name: 'Race mode' },
  { key: 'after', name: 'After the race' },
];

/**
 * Each case with its result for this race. c = { race, stored, trip, trips, races, route, pois, sim,
 * sims, plan, today, fromRides }. → [{ n, title (translated), part, text, open }] where open = nothing to
 * show yet (text then says what to fill in).
 */
export function casesOf(c, t = (k) => k) {
  const km = c.route?.km ?? 0;
  const pois = c.pois ?? [];
  const sim = c.sim;
  const days = sim?.days ?? [];
  const race = c.race ?? {};
  const prof = c.route?.profile ?? [];
  const top = c.route?.maxM ?? (prof.length ? Math.max(...prof.map((p) => p[1] ?? 0)) : null);
  const has = (k) => pois.some((p) => p.kind === k);
  const startDay = race.start ? race.start.slice(0, 10) : c.trip?.startDate;
  const cd = startDay && c.today ? countdown(startDay, c.today) : null;
  const rideH = days.reduce((s, d) => s + d.rideH, 0);
  const first = c.route?.line?.[0];
  const sun = (day) => (first ? sunTimes(day, first[0], first[1]) : null);
  const kmList = (gs) => gs.map((g) => t('km {a}–{b} ({k} km)', { a: g.fromKm, b: g.toKm, k: g.km })).join(', ');
  const fx = {
    1: () => days.length && t('{n} days, finish {when}. Longest day: day {d} with {h} riding.', { n: days.length, when: `${localOf(sim.finish).slice(0, 10)} ${hhmm(sim.finish)}`, ...(() => { const d = [...days].sort((a, b) => b.rideH - a.rideH)[0]; return { d: d.n, h: hText(d.rideH) }; })() }),
    2: () => pois.length && (biggestGaps(pois, km, ['shop'], 3).length ? t('Longest stretches without a shop: {list}.', { list: kmList(biggestGaps(pois, km, ['shop'], 3)) }) : ''),
    3: () => days.length > 1 && t('Nights: {h} hotel, {b} bivy, {c} tent. Sleep in total {s}.', { h: days.slice(0, -1).filter((d) => d.bed === 'hotel').length, b: days.slice(0, -1).filter((d) => d.bed === 'bivy').length, c: days.slice(0, -1).filter((d) => d.bed === 'tent').length, s: hText(sim.sleepH) }),
    4: () => race.rules?.length && t('{n} rules entered; compare them with your packing list.', { n: race.rules.length }),
    5: () => days.length && t('{n} days on the road; highest point {m} m. The forecast comes 16 days before.', { n: days.length, m: Math.round(top ?? 0) }),
    6: () => c.fromRides?.pausePct != null && t('Your stops so far: {p} % on top of the riding time.', { p: c.fromRides.pausePct }),
    7: () => cd && cd.days > 0 && t('{w} weeks to the start. Dress rehearsal by {date}.', { w: cd.weeks, date: cd.probeBy }),
    8: () => has('station') && t('{n} stations near the route.', { n: exitStations(pois).length }),
    9: () => days.length > 1 && (() => { const out = days.slice(0, -1).filter((d) => d.bed !== 'hotel'); return out.length ? t('{n} nights outside; the first at km {km}.', { n: out.length, km: out[0].toKm }) : t('Every night in a bed.'); })(),
    10: () => rideH > 0 && t('About {h} riding × 400 kcal ≈ {kcal} kcal (estimate).', { h: Math.round(rideH), kcal: (Math.round((rideH * 400) / 1000) * 1000).toLocaleString('de-CH') }),
    11: () => (c.sims ?? []).length && t('Sleeping kit: {list}.', { list: c.sims.map((s) => `${t(WAY_NAME[s.way])} ${r1(s.kg)} kg`).join(', ') }),
    12: () => c.route?.line?.length && (() => {
      const codes = countriesOf(samples(c.pts ?? [], 50, 30).map((p) => ({ lat: p.lat ?? p[0], lon: p.lon ?? p[1] })));
      const sun2 = days.filter((d) => d.sunday).map((d) => t('day {n}', { n: d.n })).join(', ');
      return t('Countries: {list}. Sundays in the plan: {sun}.', { list: codes.map((x) => t(COUNTRY[x]?.name ?? x)).join(', ') || '–', sun: sun2 || t('none') });
    })(),
    13: () => days.length && first && (() => {
      const late = days.filter((d) => { const s = sun(localOf(d.leave).slice(0, 10)); return s && d.arrive > s.set; });
      return late.length ? t('{n} days end after sunset: {list}.', { n: late.length, list: late.map((d) => t('day {n}', { n: d.n })).join(', ') }) : t('Every day ends in daylight.');
    })(),
    14: () => race.contacts?.length && t('{n} entries.', { n: race.contacts.length }),
    15: () => c.trip?.endDate && c.today > c.trip.endDate && t('Resting pulse and sleep for 7 days after the race, as an observation.'),
    16: () => { const n = sameRace(c.trip, c.trips ?? [], c.races ?? {}).filter((x) => x.id !== c.trip?.id).length; return n ? t('{n} earlier attempts in the app.', { n }) : t('The first attempt in the app.'); },
    17: () => pois.length && t('Ready: next shop, next bed and the km to it.'),
    18: () => days.length > 1 && (() => {
      const d = days.find((x) => x.bed !== 'hotel' && x.n < days.length);
      if (!d) return t('No hard choice in the plan: every night has a bed.');
      const next = pois.filter((p) => p.kind === 'sleep' && p.km > d.toKm).sort((a, b) => a.km - b.km)[0];
      return next ? t('Day {d} at km {km}: the next bed is {k} km further on.', { d: d.n, km: d.toKm, k: Math.round(next.km - d.toKm) }) : t('Day {d} at km {km}: no bed further on.', { d: d.n, km: d.toKm });
    })(),
    19: () => pois.length && (() => { const s = dryStretches(pois, km, 30).sort((a, b) => b.km - a.km); return s.length ? t('{n} stretches over 30 km without water; longest {list}.', { n: s.length, list: kmList(s.slice(0, 2)) }) : t('No stretch over 30 km without water.'); })(),
    20: () => prof.length && c.plan?.etaOf && (() => {
      const cl = climbsOf(prof, 300).sort((a, b) => b.gain - a.gain)[0];
      if (!cl) return t('No big climb.');
      const at = c.plan.etaOf(cl.fromKm);
      return t('Biggest climb km {a}–{b} (+{g} m), about {time} on day {d}.', { a: cl.fromKm, b: cl.toKm, g: cl.gain, time: hhmm(at), d: dayN(sim, cl.fromKm) ?? '–' });
    })(),
    21: () => { const s = summaryOf({ sim, pois, km }); return s?.depot ? t('Depot at km {km}: day {d}, about {time}.', { km: s.depot.km, d: s.depot.n, time: hhmm(s.depot.at) }) : race.dropBags?.length ? t('{n} drop bags planned.', { n: race.dropBags.length }) : ''; },
    22: () => km > 0 && t('After {km} km: {list}.', { km: Math.round(km), list: careAfter({ km }).slice(0, 2).map((x) => t(x)).join(', ') }),
    23: () => race.why?.length && t('{n} sentences ready for a hard moment.', { n: race.why.length }),
    24: () => t('Made after the race from the plan, what happened and the food log.'),
    25: () => days.length && (sim.lateNights ? t('{n} nights reach the hotel after the check-in time.', { n: sim.lateNights }) : t('Every hotel before the check-in time.')),
    26: () => race.stomach?.length && t('{n} foods tried, {g} went well.', { n: race.stomach.length, g: stomachList(race.stomach).filter((x) => x.verdict === 'good').length }),
    27: () => days.length && has('sleep') && (() => {
      const none = days.slice(0, -1).filter((d) => !pois.some((p) => p.kind === 'sleep' && p.km >= d.fromKm && p.km <= d.toKm + 5));
      return none.length ? t('No bed on the stage of {list}.', { list: none.map((d) => t('day {n}', { n: d.n })).join(', ') }) : t('Beds on every stage.');
    })(),
    28: () => has('shelter') && t('{n} shelters along the route.', { n: pois.filter((p) => p.kind === 'shelter').length }),
    29: () => pois.length && km > 0 && t('A stop about every {k} km.', { k: Math.max(1, Math.round(km / Math.max(1, pois.filter((p) => ['shop', 'food', 'fuel', 'water'].includes(p.kind)).length))) }),
    30: () => top != null && top > 0 && t('Highest point {m} m: the UV is stronger up high, cream every 2–3 h.', { m: Math.round(top) }),
    31: () => days.length > 2 && (() => { const d = [...days].slice(0, -1).sort((a, b) => a.rideH - b.rideH)[0]; return t('Shortest day: day {d} with {h} riding, a «short day» instead of a rest day.', { d: d.n, h: hText(d.rideH) }); })(),
    32: () => cd && cd.days > 0 && days.length && (() => { const p = trainingPlan(startDay, c.today, km / days.length); const top2 = p.length ? Math.max(...p.map((w) => w.longKm)) : 0; const b2b = p.find((w) => w.b2b); return top2 ? t('Long rides up to {km} km; back-to-back weekends from {date}.', { km: top2, date: b2b?.week ?? addDay(startDay, -42) }) : ''; })(),
    33: () => t('One page with the plan, beds, depot and gaps, also as a PDF.'),
    34: () => '',
    35: () => days.length && first && (() => { const late = days.filter((d) => { const s = sun(localOf(d.leave).slice(0, 10)); return s && d.arrive > s.set + 36e5; }); return late.length ? t('{n} days with riding in the dark: check the main roads there.', { n: late.length }) : t('Hardly any riding at night in the plan.'); })(),
    36: () => pois.length && (() => { const g = biggestGaps(pois, km, ['shop'], 1)[0]; return g ? t('Heaviest at km {a}: {k} km without a shop follow.', { a: g.fromKm, k: g.km }) : ''; })(),
    37: () => days.length > 2 && (() => { const hotelDays = days.filter((d) => d.bed === 'hotel').map((d) => d.n); const w = laundryPlan({ days: days.length, hotelDays }).washes; return w.length ? t('Wash on {list}.', { list: w.map((x) => t('day {n}', { n: x.day })).join(', ') }) : t('Two sets are enough without washing.'); })(),
    38: () => c.route?.sectors?.length && t('{n} sections to compare plan and actual.', { n: c.route.sectors.length }),
    39: () => '',
    40: () => t('{n} things: registration, fee, tracker, insurance, beds, each with a reminder.', { n: PAPERS.length }),
  };
  const OPEN = {
    2: 'Load the stops under «Along the route».', 4: 'Enter the rules under «Prepare».', 6: 'Connect Strava or record rides.',
    8: 'Load the places from OpenStreetMap under «Along the route».', 14: 'Note them after each day in «Race mode».', 15: 'Shows after the race.',
    21: 'Add a depot as a stop or a drop bag under «Prepare».', 23: 'Write your sentence in «Race mode».', 26: 'Rate foods in training under «Prepare».',
    28: 'Load the places from OpenStreetMap under «Along the route».', 34: 'Load the surfaces under «Along the route».', 39: 'Enter the bolt sizes of your bike under «Prepare».',
  };
  return CASES.map((x) => {
    let text = '';
    try {
      text = fx[x.n]?.() || '';
    } catch {
      text = '';
    }
    const open = !text;
    return { ...x, title: t(x.title), text: open ? t(OPEN[x.n] ?? (km ? 'Set the start day under «Strategy».' : 'Load the route under «Prepare» first.')) : text, open };
  });
}
const WAY_NAME = { hotel: 'Hotels only', mixed: 'Mixed: hotel or bivy', tent: 'Tent' };

/* ---------- scenarios (Noah «2a und b») ---------- */

/** What a scenario keeps: your assumptions, own ones, nights you set, the way, start and goal. */
export const SCENARIO_FIELDS = ['assume', 'ownAssume', 'fixedNights', 'way', 'start', 'targetDays'];
export function scenarioFrom(stored = {}, name = '', id = '') {
  const s = { id, text: name };
  for (const f of SCENARIO_FIELDS) if (stored[f] != null) s[f] = structuredClone(stored[f]);
  return s;
}
/** A scenario back into the race (the fields it does not have are cleared). */
export function applyScenario(cur = {}, sc = {}) {
  const out = { ...cur };
  for (const f of SCENARIO_FIELDS) {
    if (sc[f] != null) out[f] = structuredClone(sc[f]);
    else delete out[f];
  }
  return out;
}
/** Play a scenario through: → the simulate() result of its way, or null. */
export function playScenario(sc, { km, profile, pois, fromRides, trip }) {
  const start = sc.start || (trip?.startDate ? `${trip.startDate}T${trip.rideStart || '06:00'}` : '');
  if (!start || !(km > 0)) return null;
  return simulate({ km, profile, pois, start, way: sc.way ?? 'mixed', as: assumptionsOf(sc, fromRides), own: sc.ownAssume ?? [], fixed: sc.fixedNights ?? {} });
}
