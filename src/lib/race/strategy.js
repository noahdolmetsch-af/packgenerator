/**
 * Paket U «Rennen» › Strategie (Noah 19.10.2026 17:08–17:12): play the race through like in the chat.
 * «Ich möchte die Strategie im Frontend genau wie hier durchspielen können und sehen, welche Annahmen
 * dahinter stecken und diese auch ändern und ergänzen können.»
 *
 * - The pace comes from your own rides (Strava activities and your recorded rides): flat speed and
 *   climbing rate, fitted on the longer rides; the stops from moving vs. elapsed time.
 * - Three ways to sleep side by side: hotels only, mixed (hotel when one is in reach, else bivy) and
 *   tent. Each day ends at a place to sleep that fits the way (a hotel before its check-in time …).
 * - Every assumption is a row you see, change, reset and complete with your own.
 *
 * race.assume = { [key]: value } (your changes; missing = the suggestion), race.ownAssume = [{ id, name,
 * kind: 'minDay'|'min100'|'pct'|'note', value }]. Pure functions, tested in tests/race.test.js.
 */
import { effortOf, msOf, addDay, localOf, CLIMB_KM_PER_M } from './race.js';

/** The three ways to sleep. */
export const WAYS = [
  { key: 'hotel', name: 'Hotels only' },
  { key: 'mixed', name: 'Mixed: hotel or bivy' },
  { key: 'tent', name: 'Tent' },
];

/**
 * The assumptions as the app comes. group: what it is about; unit for the field; src: where the
 * suggestion comes from ('rides' = your rides when there are enough, else 'standard').
 */
export const ASSUMPTIONS = [
  // learning (Noah 19.10.2026 17:13 and «3b»): loaded and light are two different things. The race uses the
  // loaded values; the light ones from your rides are shown for comparison («775 light, 650 loaded»).
  { key: 'flatKmh', group: 'pace', name: 'Speed on the flat with race luggage', unit: 'km/h', def: 25, min: 8, max: 45, step: 0.5, src: 'loaded' },
  { key: 'climbMh', group: 'pace', name: 'Climbing rate with race luggage', unit: 'm/h', def: 650, min: 200, max: 1500, step: 10, src: 'loaded' },
  { key: 'pausePct', group: 'pace', name: 'Stops (food, water, photos) on top of the riding time', unit: '%', def: 25, min: 0, max: 100, step: 1, src: 'standard' },
  { key: 'fatiguePct', group: 'body', name: 'Slower overall from tiredness', unit: '%', def: 10, min: 0, max: 40, step: 1, src: 'standard' },
  { key: 'bivyTiredPct', group: 'body', name: 'Slower the day after a bivy night', unit: '%', def: 3, min: 0, max: 20, step: 1, src: 'standard' },
  { key: 'tentTiredPct', group: 'body', name: 'Slower the day after a tent night', unit: '%', def: 1, min: 0, max: 20, step: 1, src: 'standard' },
  { key: 'kgPct', group: 'body', name: 'Slower per extra kilo of sleeping kit', unit: '%', def: 1, min: 0, max: 3, step: 0.1, src: 'standard' },
  { key: 'startAt', group: 'day', name: 'Start in the morning', unit: 'time', def: '06:00', src: 'standard' },
  { key: 'maxRideH', group: 'day', name: 'Riding hours a day at most (without stops)', unit: 'h', def: 11, min: 4, max: 22, step: 0.5, src: 'standard' },
  { key: 'stopBy', group: 'day', name: 'Stop riding at the latest', unit: 'time', def: '23:00', src: 'standard' },
  { key: 'bedOffKm', group: 'day', name: 'A bed counts up to this far from the route', unit: 'km', def: 1.5, min: 0, max: 10, step: 0.5, src: 'standard' },
  { key: 'checkInBy', group: 'hotel', name: 'Hotel check-in at the latest', unit: 'time', def: '21:30', src: 'standard' },
  { key: 'hotelSleepH', group: 'hotel', name: 'Sleep in a hotel', unit: 'h', def: 7, min: 2, max: 10, step: 0.5, src: 'standard' },
  { key: 'hotelMorningMin', group: 'hotel', name: 'Checking in and out, breakfast', unit: 'min', def: 60, min: 0, max: 180, step: 5, src: 'standard' },
  { key: 'hotelKg', group: 'hotel', name: 'Sleeping kit with hotels (change of clothes)', unit: 'kg', def: 0.3, min: 0, max: 5, step: 0.1, src: 'standard' },
  { key: 'hotelChf', group: 'hotel', name: 'Hotel night', unit: 'CHF', def: 140, min: 0, max: 500, step: 5, src: 'standard' },
  { key: 'bivySleepH', group: 'bivy', name: 'Sleep in the bivy', unit: 'h', def: 5.5, min: 1, max: 9, step: 0.5, src: 'standard' },
  { key: 'bivyMorningMin', group: 'bivy', name: 'Laying out and packing up the bivy', unit: 'min', def: 30, min: 0, max: 90, step: 5, src: 'standard' },
  { key: 'bivyKg', group: 'bivy', name: 'Emergency bivy (bivy sack; the down jacket comes anyway)', unit: 'kg', def: 0.5, min: 0, max: 6, step: 0.1, src: 'standard' },
  { key: 'tentSleepH', group: 'tent', name: 'Sleep in the tent', unit: 'h', def: 6, min: 1, max: 10, step: 0.5, src: 'standard' },
  { key: 'tentMorningMin', group: 'tent', name: 'Pitching and packing up the tent', unit: 'min', def: 50, min: 0, max: 120, step: 5, src: 'standard' },
  { key: 'tentKg', group: 'tent', name: 'Tent kit (tent, quilt, mat, pillow)', unit: 'kg', def: 2.2, min: 0, max: 8, step: 0.1, src: 'standard' },
  { key: 'campChf', group: 'tent', name: 'Campground night', unit: 'CHF', def: 25, min: 0, max: 100, step: 5, src: 'standard' },
  { key: 'mindHotel', group: 'mind', name: 'Good for my head: hotels', unit: '1–5', def: 4, min: 1, max: 5, step: 1, src: 'standard' },
  { key: 'mindMixed', group: 'mind', name: 'Good for my head: mixed', unit: '1–5', def: 4, min: 1, max: 5, step: 1, src: 'standard' },
  { key: 'mindTent', group: 'mind', name: 'Good for my head: tent', unit: '1–5', def: 3, min: 1, max: 5, step: 1, src: 'standard' },
];
export const ASSUME = Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, a]));
export const ASSUME_GROUPS = [
  { key: 'pace', name: 'Pace' },
  { key: 'body', name: 'Body' },
  { key: 'day', name: 'The day' },
  { key: 'hotel', name: 'Hotel' },
  { key: 'bivy', name: 'Bivy' },
  { key: 'tent', name: 'Tent' },
  { key: 'mind', name: 'Head' },
  { key: 'own', name: 'My own assumptions' },
];
export const OWN_KINDS = [
  { key: 'minDay', name: 'Minutes every day' },
  { key: 'min100', name: 'Minutes every 100 km' },
  { key: 'pct', name: 'Faster or slower in %' },
  { key: 'note', name: 'Only a note' },
];

/**
 * Pace from your rides: Strava activities [{ id, kind, km, hm, movingS, elapsedS }] and recorded rides
 * [{ id, km, gainM, movingH, totalH }]. Rides of 40 km or more; least squares on hours = km/v + metres/c.
 * Loaded and light apart (learning 17:13, «775 light, 650 loaded»): a ride is loaded when isLoaded(ride)
 * says so (a day of a multi-day trip, or marked by you).
 * → { light: fit|null, loaded: fit|null, pausePct, n } with fit = { flatKmh, climbMh, n, longest }
 */
export function paceFromRides(acts = [], rides = [], isLoaded = () => false) {
  const rows = [
    ...acts.filter((a) => (a.kind === 'ride' || a.kind === 'bike' || /ride/i.test(a.type ?? '')) && !a.trainer && a.km >= 40 && a.movingS > 0).map((a) => ({ id: a.id, day: a.day, km: a.km, up: a.hm ?? 0, h: a.movingS / 3600, tot: (a.elapsedS ?? a.movingS) / 3600 })),
    ...rides.filter((r) => r.km >= 40 && r.movingH > 0).map((r) => ({ id: r.id, day: r.date, km: r.km, up: r.gainM ?? 0, h: r.movingH, tot: r.totalH ?? r.movingH })),
  ];
  const loaded = rows.filter((r) => isLoaded(r));
  const light = rows.filter((r) => !isLoaded(r));
  const tot = rows.reduce((s, r) => s + r.tot, 0);
  const mov = rows.reduce((s, r) => s + r.h, 0);
  return {
    light: fitPace(light),
    loaded: fitPace(loaded),
    pausePct: mov > 0 && rows.length >= 3 ? Math.round(Math.max(0, Math.min(100, ((tot - mov) / mov) * 100))) : null,
    n: rows.length,
  };
}
function fitPace(rows) {
  if (rows.length < 3) return null;
  let skk = 0;
  let suu = 0;
  let sku = 0;
  let skh = 0;
  let suh = 0;
  for (const r of rows) {
    skk += r.km * r.km;
    suu += r.up * r.up;
    sku += r.km * r.up;
    skh += r.km * r.h;
    suh += r.up * r.h;
  }
  const det = skk * suu - sku * sku;
  let a = null;
  let b = null;
  if (det > 1e-6) {
    a = (skh * suu - suh * sku) / det;
    b = (suh * skk - skh * sku) / det;
  }
  // a climbing rate outside 250–1500 m/h means the rides were too alike: keep 650 m/h, fit only the flat
  if (!(a > 0) || !(b > 0) || 1 / b < 250 || 1 / b > 1500) {
    const c = ASSUME.climbMh.def;
    a = rows.reduce((s, r) => s + r.km * (r.h - r.up / c), 0) / skk;
    b = 1 / c;
  }
  return {
    flatKmh: Math.round(Math.max(8, Math.min(45, 1 / a)) * 2) / 2,
    climbMh: Math.round(Math.max(250, Math.min(1500, 1 / b)) / 5) * 5,
    n: rows.length,
    longest: Math.max(...rows.map((r) => r.km)),
  };
}

/** Is a ride loaded? A day of a trip of 2 or more days, or one you marked (ids). */
export function loadedBy(trips = [], marked = []) {
  const days = new Set();
  for (const t of trips) {
    if (!t.startDate || !(Number(t.days) >= 2) || t.skipped) continue;
    for (let i = 0; i < Number(t.days); i++) days.add(addDay(t.startDate, i));
  }
  const ids = new Set(marked.map(String));
  return (r) => ids.has(String(r.id)) || days.has(r.day);
}

/**
 * The assumptions in use: yours, else from your loaded rides (when 3 or more), else the standard.
 * fromRides: paceFromRides(). → { [key]: { value, src: 'yours'|'loaded'|'rides'|'standard' } }
 */
export function assumptionsOf(race = {}, fromRides = null) {
  const own = race.assume ?? {};
  const out = {};
  for (const a of ASSUMPTIONS) {
    if (own[a.key] != null && own[a.key] !== '') out[a.key] = { value: own[a.key], src: 'yours' };
    else if (a.src === 'loaded' && fromRides?.loaded?.[a.key] != null) out[a.key] = { value: fromRides.loaded[a.key], src: 'loaded' };
    else if (a.key === 'pausePct' && fromRides?.pausePct != null) out[a.key] = { value: fromRides.pausePct, src: 'rides' };
    else out[a.key] = { value: a.def, src: 'standard' };
  }
  return out;
}
const v = (as, k) => (typeof as[k] === 'object' && as[k] != null && 'value' in as[k] ? as[k].value : as[k]);
/** A place to sleep a way accepts: hotel = a bed (not a campground), tent = a campground. */
export function bedKind(p) {
  const s = String(p.sub ?? p.sym ?? '').toLowerCase();
  if (/camp/.test(s)) return 'camp';
  return 'bed';
}

/**
 * Play the race through for one way of sleeping.
 * In: km (total), profile [[km, m]], pois (with kind 'sleep'), start 'YYYY-MM-DDTHH:MM', way, as
 * (assumptions, values or { value }), own (own assumptions), baseKg (bike and luggage without the sleep setup, for
 * the weight line only). → { way, days: [{ n, fromKm, toKm, rideH, leave, arrive, place, bed, late }],
 * finish (ms), totalH, sleepH, kg, kmPerDay, mind, done }
 */
export function simulate({ km, profile = [], pois = [], start, way = 'hotel', as = {}, own = [], fixed = {} }) {
  const t0 = msOf(start);
  if (!(km > 0) || !Number.isFinite(t0)) return null;
  const eff = effortOf(profile, km);
  const gainAt = (k) => (eff.at(k) - k) / CLIMB_KM_PER_M; // metres up from the start to km k
  const flat = (Number(v(as, 'flatKmh')) || ASSUME.flatKmh.def) * (Number(v(as, 'loadFlatPct')) || 100) / 100;
  const climbRate = (Number(v(as, 'climbMh')) || ASSUME.climbMh.def) * (Number(v(as, 'loadClimbPct')) || 100) / 100;
  const pause = (Number(v(as, 'pausePct')) || 0) / 100;
  const bedOff = Number(v(as, 'bedOffKm'));
  const fatigue = (Number(v(as, 'fatiguePct')) || 0) / 100;
  const kgPct = (Number(v(as, 'kgPct')) || 0) / 100;
  const maxRide = (Number(v(as, 'maxRideH')) || 12) * 36e5;
  const startAt = v(as, 'startAt') || '06:00';
  const kit = { hotel: Number(v(as, 'hotelKg')) || 0, bivy: Number(v(as, 'bivyKg')) || 0, tent: Number(v(as, 'tentKg')) || 0 };
  const setupKg = way === 'hotel' ? kit.hotel : way === 'tent' ? kit.tent : Math.max(kit.hotel, kit.bivy);
  const ownPct = own.filter((o) => o.kind === 'pct').reduce((s, o) => s + (Number(o.value) || 0), 0) / 100;
  const ownDayMin = own.filter((o) => o.kind === 'minDay').reduce((s, o) => s + (Number(o.value) || 0), 0);
  const own100 = own.filter((o) => o.kind === 'min100').reduce((s, o) => s + (Number(o.value) || 0), 0);
  // the kilos of sleeping kit above the lightest way slow you down
  const kgSlow = kgPct * Math.max(0, setupKg - Math.min(kit.hotel, kit.bivy, kit.tent));
  const nightOf = (bed) => {
    const k = bed === 'hotel' ? 'hotel' : bed === 'tent' ? 'tent' : 'bivy';
    return { sleepH: Number(v(as, `${k}SleepH`)) || 0, morning: Number(v(as, `${k}MorningMin`)) || 0, tired: bed === 'hotel' ? 0 : (Number(v(as, `${k}TiredPct`)) || 0) / 100 };
  };
  // riding time for one km (Naismith: the flat part plus the metres up), slower by tiredness, kit and your own %
  const kmMs = (k, extra) => {
    const to = Math.min(km, k + 1);
    const up = Math.max(0, gainAt(to) - gainAt(k));
    const h = (to - k) / flat + up / climbRate;
    return (h * (1 + fatigue + extra + kgSlow) / (1 + ownPct) + ((to - k) * own100) / 6000) * 36e5;
  };
  const sleeps = pois.filter((p) => p.kind === 'sleep' && (!Number.isFinite(bedOff) || !(p.offKm > bedOff))).sort((a, b) => a.km - b.km);
  const days = [];
  let pos = 0;
  let t = t0;
  let tired = 0; // extra % from the last nights
  let sleepTot = 0;
  let chf = 0;
  for (let n = 1; pos < km - 0.05 && n <= 40; n++) {
    const leave = t;
    // ride as far as the day allows, remember when you pass each km
    const marks = [{ km: pos, at: t }];
    let k = pos;
    let tt = t + ownDayMin * 6e4;
    let ride = 0;
    const today = dayOfLocal(leave);
    const atClock = (hhmm, from) => {
      let ms = msOf(`${today}T${hhmm}`);
      if (ms <= from) ms += 864e5; // a time after midnight (stop at 01:00) belongs to the same riding day
      return ms;
    };
    const dayEnd = atClock(v(as, 'stopBy') || '23:30', leave);
    const checkInMs = atClock(v(as, 'checkInBy') || '21:30', leave);
    while (k < km) {
      const step = Math.min(1, km - k);
      const dt = kmMs(k, tired);
      // the stops come along with the riding (pausePct of the riding time)
      const next = tt + dt * (1 + pause);
      const late = next > dayEnd;
      if (ride + dt > maxRide || late || next - leave > 22 * 36e5) break;
      ride += dt;
      tt = next;
      k += step;
      marks.push({ km: k, at: tt });
    }
    if (k >= km - 0.05) {
      days.push({ n, upM: Math.round(gainAt(km) - gainAt(pos)), sunday: new Date(leave).getDay() === 0, fromKm: Math.round(pos), toKm: Math.round(km), rideH: ride / 36e5, dayH: (tt - leave) / 36e5, leave, arrive: tt, place: 'Finish', bed: 'finish', late: false });
      t = tt;
      pos = km;
      break;
    }
    // where to sleep
    const at = (x) => marks.reduce((best, m) => (m.km <= x ? m : best), marks[0]).at + 0;
    const inReach = sleeps.filter((p) => p.km > pos + 5 && p.km <= k);
    let place = null;
    let bed = 'bivy';
    let late = false;
    const hotelOk = (p) => bedKind(p) === 'bed' && at(p.km) <= checkInMs;
    if (way === 'hotel') {
      const ok = inReach.filter(hotelOk);
      place = ok.at(-1) ?? null;
      // the next bed after where the day ends: worth riding on when it is reached before the latest stop
      const ahead = sleeps.find((p) => p.km > k && bedKind(p) === 'bed');
      const aheadAt = ahead ? marks.at(-1).at + (ahead.km - k) * kmMs(k, tired) * (1 + pause) : Infinity;
      if (ahead && aheadAt <= dayEnd && (!place || ahead.km - place.km > 40)) {
        place = ahead;
        late = aheadAt > checkInMs;
      }
      if (!place) {
        // nothing in reach: the last bed passed, else the next one, even if late
        place = inReach.filter((p) => bedKind(p) === 'bed').at(-1) ?? ahead ?? null;
        late = true;
      }
      bed = 'hotel';
    } else if (way === 'tent') {
      const camp = inReach.filter((p) => bedKind(p) === 'camp').at(-1) ?? null;
      place = camp && camp.km >= k - 25 ? camp : null; // else wild: wherever the day ends
      bed = 'tent';
    } else {
      const ok = inReach.filter(hotelOk);
      const ahead = sleeps.find((p) => p.km > k && bedKind(p) === 'bed');
      const aheadAt = ahead ? marks.at(-1).at + (ahead.km - k) * kmMs(k, tired) * (1 + pause) : Infinity;
      if (ahead && aheadAt <= checkInMs && ahead.km - k <= 25) {
        place = ahead;
        bed = 'hotel';
      } else if (ok.length && ok.at(-1).km >= k - 25) {
        place = ok.at(-1);
        bed = 'hotel';
      }
    }
    // a night you set yourself (learning: «Nacht 1 offen lassen»): 'bivy' = wherever the day ends
    if (fixed[n] === 'bivy') {
      place = null;
      bed = 'bivy';
      late = false;
    }
    let endKm = place ? place.km : k;
    if (place && place.km > k) {
      // a late hotel further on: ride on to it
      let x = k;
      while (x < place.km) {
        tt += kmMs(x, tired) * (1 + pause);
        x += Math.min(1, place.km - x);
      }
      endKm = place.km;
    }
    const arrive = place && place.km <= k ? at(place.km) : tt;
    const dayH = (arrive - leave) / 36e5;
    days.push({ n, upM: Math.round(gainAt(endKm) - gainAt(pos)), sunday: new Date(leave).getDay() === 0, fromKm: Math.round(pos), toKm: Math.round(endKm), rideH: Math.min(ride / 36e5, dayH), dayH, leave, arrive, place: place?.name || '', placeId: place?.id ?? null, bed, late: bed === 'hotel' && (late || arrive > checkInMs) });
    const night = nightOf(bed);
    sleepTot += night.sleepH;
    chf += bed === 'hotel' ? Number(v(as, 'hotelChf')) || 0 : bed === 'tent' && place ? Number(v(as, 'campChf')) || 0 : 0;
    // the next start: after the sleep and the morning, not before the morning start time
    let wake = arrive + night.sleepH * 36e5 + night.morning * 6e4;
    // the next riding day starts in the morning (not in the middle of the night after a short day)
    const earliest = msOf(`${addDay(dayOfLocal(arrive), 1)}T${startAt}`);
    if (wake < earliest) wake = earliest;
    t = wake;
    tired = night.tired;
    pos = endKm;
  }
  const finish = t;
  const ways = { hotel: 'mindHotel', mixed: 'mindMixed', tent: 'mindTent' };
  return {
    way,
    days,
    finish,
    totalH: (finish - t0) / 36e5,
    sleepH: sleepTot,
    kg: setupKg,
    kmPerDay: days.length ? Math.round(km / days.length) : 0,
    mind: Number(v(as, ways[way])) || null,
    lateNights: days.filter((d) => d.late).length,
    chf,
    risks: risksOf(way, days, kit),
    done: pos >= km - 0.05,
  };
}
/** Short notes on what could go wrong with a way (English keys with vars). */
function risksOf(way, days, kit) {
  const out = [];
  const late = days.filter((d) => d.late).length;
  if (late) out.push(['{n} nights the hotel is reached after the check-in time: call ahead.', { n: late }]);
  const bivy = days.filter((d) => d.bed === 'bivy').length;
  if (way === 'mixed' && bivy) out.push(['{n} nights without a hotel in reach: the bivy kit comes along all the way.', { n: bivy }]);
  const wild = days.filter((d) => d.bed === 'tent' && !d.placeId).length;
  if (wild) out.push(['{n} nights without a campground in reach: wild camping is not allowed everywhere.', { n: wild }]);
  if (way === 'tent') out.push(['The tent is {kg} kg more to carry up every climb.', { kg: Math.round((kit.tent - kit.hotel) * 10) / 10 }]);
  const long = days.filter((d) => d.dayH > 18).length;
  if (long) out.push(['{n} days longer than 18 hours: tiredness and crashes come at night.', { n: long }]);
  return out;
}
const dayOfLocal = (ms) => localOf(ms - 4 * 36e5).slice(0, 10); // a «day» runs until 04:00 the next morning

/**
 * The time plan of the other parts from a played-through way: the nights are the off blocks, so every
 * stage ends at its place to sleep (learning 1: «der Zeitplan muss nach Schlafplätzen einrasten»).
 * → { start, end, blocks } for schedule(race, km, profile, own), or null.
 */
export function planBlocks(sim) {
  if (!sim?.days?.length) return null;
  const blocks = [];
  for (let i = 0; i < sim.days.length - 1; i++) {
    const d = sim.days[i];
    blocks.push({ from: d.arrive, to: sim.days[i + 1].leave, kind: 'sleep', n: i, bed: d.bed, place: d.place });
  }
  return { start: sim.days[0].leave, end: sim.finish, blocks };
}

/**
 * The same as schedule() (race.js), but exact per stage: inside a day the time runs with the effort
 * (climbs slower) from leave at fromKm to arrive at toKm. → the plan the other parts use.
 */
export function simPlan(sim, km, profile = []) {
  const own = planBlocks(sim);
  if (!own) return null;
  const eff = effortOf(profile, km);
  const days = sim.days.map((d) => ({ ...d, e0: eff.at(d.fromKm), e1: eff.at(d.toKm) }));
  const etaOf = (k) => {
    const x = Math.max(0, Math.min(k, km));
    const d = days.find((y) => x <= y.toKm) ?? days.at(-1);
    const e = eff.at(x);
    const f = d.e1 > d.e0 ? Math.max(0, Math.min(1, (e - d.e0) / (d.e1 - d.e0))) : 1;
    return d.leave + (d.arrive - d.leave) * f;
  };
  const kmAt = (ms) => {
    if (ms <= days[0].leave) return 0;
    for (const d of days) {
      if (ms < d.leave) return d.fromKm;
      if (ms <= d.arrive) return eff.km(d.e0 + (d.e1 - d.e0) * ((ms - d.leave) / Math.max(1, d.arrive - d.leave)));
    }
    return km;
  };
  const rideH = days.reduce((s2, d) => s2 + (d.arrive - d.leave) / 36e5, 0);
  const cal = [];
  for (let day = localOf(own.start).slice(0, 10); day <= localOf(own.end).slice(0, 10); day = addDay(day, 1)) {
    const a = Math.max(own.start, msOf(`${day}T00:00`));
    const b = Math.min(own.end, msOf(`${addDay(day, 1)}T00:00`));
    cal.push({ day, km: Math.round(kmAt(b) - kmAt(a)), from: kmAt(a), to: kmAt(b) });
  }
  return { start: own.start, end: own.end, kmh: km / rideH, rideH, offH: (own.end - own.start) / 36e5 - rideH, blocks: own.blocks, etaOf, kmAt, days: cal, stages: sim.days, way: sim.way, fromStrategy: true, gain: eff.gain ?? null };
}

/** All three ways side by side. */
export const compareWays = (input) => WAYS.map((w) => simulate({ ...input, way: w.key }));

/** The finish as 'D days H h' (days counted from the start). */
export function raceTime(h) {
  if (!Number.isFinite(h)) return { d: 0, h: 0 };
  return { d: Math.floor(h / 24), h: Math.round(h % 24) };
}
export { addDay };
