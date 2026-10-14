/**
 * E3 «Strava-Verbindung» (mockups S1–S5 approved 12.10.2026): Strava activities from the server
 * (api/strava.js, step=activities) as the rides the km ledger already knows from the CSV import,
 * so planImport assigns them the same way (Strava bike name = app bike name).
 * No UI here; the screens come with the E3 release.
 */
import { CYCLING, zurichDay, signals, planImport, dupOf, makeEntry, counts } from './kmbook.js';

const VIRTUAL = /virtual|indoor|trainer/i;

/** Strava's «GravelRide» as the CSV writes it («Gravel Ride»). */
export const typeName = (t) => String(t ?? '').replace(/^E(?=[A-Z])/, 'E-').replace(/([a-z])([A-Z])/g, '$1 $2');

/**
 * activities: the server's trimmed list; bikes: the server's gear list ({ id, name }).
 * Returns { rides, other } like parseStravaCsv: rides of the bike kind, other = how many were no ride.
 */
export function toRides(activities, bikes = []) {
  const names = Object.fromEntries((bikes ?? []).map((b) => [b.id, b.name]));
  const rides = [];
  let other = 0;
  for (const a of activities ?? []) {
    const type = typeName(a.type);
    const gear = a.gearId ? names[a.gearId] ?? '' : '';
    const date = a.start ? zurichDay(a.start) : null;
    if (!date || !Number.isFinite(a.km)) continue;
    if (!CYCLING.test(type) || ((VIRTUAL.test(type) || a.trainer) && !gear)) {
      other++;
      continue;
    }
    rides.push({ source: 'strava', date, time: a.start, km: a.km, name: a.name ?? '', type, gear, gearId: a.gearId ?? null, stravaId: String(a.id), device: a.device ?? '', profile: '', sensors: [], hrAvg: a.hrAvg ?? null, hrMax: a.hrMax ?? null, hm: Number.isFinite(a.hm) ? a.hm : null });
  }
  return { rides, other };
}

/**
 * Rides whose Strava bike changed since the app took them (answer 4b: the app asks, with a clear
 * notice). known: ledger entries with stravaId and gear; returns [{ entry, ride }].
 */
export function gearChanges(known, rides) {
  const byId = new Map((known ?? []).filter((e) => e.stravaId).map((e) => [String(e.stravaId), e]));
  return (rides ?? []).filter((r) => byId.has(r.stravaId) && (byId.get(r.stravaId).gear ?? '') !== (r.gear ?? '') && r.gear).map((r) => ({ entry: byId.get(r.stravaId), ride: r }));
}

/* ---------- v0.116.0 «Strava-Verbindung»: one fetch → ledger entries, questions, a summary ---------- */

/** Settings (decisions 1a and 2a, Noah 12.10.2026): how to fetch, what to do with a ride without a bike. */
export const FETCH_MODES = ['auto', 'button'];
export const NO_BIKE_MODES = ['check', 'auto'];
/** Automatic fetch at most every 15 minutes (decision 1a). */
export const AUTO_EVERY_MS = 15 * 60 * 1000;
/** Every fetch looks at the last 30 days again for a changed bike (server answer 3a). */
export const RECHECK_DAYS = 30;

const r1 = (n) => Math.round(n * 10) / 10;

/**
 * The bike suggested for a ride without a bike in Strava: the ride type rule (when there is one), else
 * the bike with the most counted rides of that ride type in the ledger. → { bikeId, why, n } or null.
 */
export function suggestBike(ride, { bikes = [], rules = [], entries = [] }) {
  const s = signals(ride, { bikes, rules });
  if (s.type.length === 1) return { bikeId: s.type[0], why: 'rule', n: 0 };
  const type = String(ride.type ?? '').trim().toLowerCase();
  if (!type) return null;
  const votes = {};
  for (const e of entries) {
    if (e.kind !== 'ride' || !counts(e) || !e.bikeId || String(e.type ?? '').trim().toLowerCase() !== type) continue;
    if (bikes.some((b) => b.id === e.bikeId)) votes[e.bikeId] = (votes[e.bikeId] ?? 0) + 1;
  }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return best ? { bikeId: best[0], why: 'usual', n: best[1] } : null;
}

/** The first day that is looked at again for a changed bike: 30 days before `from` (an ISO time). */
export function recheckFrom(from) {
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return null;
  return zurichDay(new Date(d.getTime() - RECHECK_DAYS * 864e5).toISOString());
}

/**
 * One fetch (decisions 2a, 3b, 4b; server answer 3a) as what the app writes:
 * - entries: the new ledger entries (source strava): counted when the bike is clear, open («Zum
 *   Prüfen») with the suggested bike otherwise; rides already in the ledger (same Strava id or the
 *   same ride from the CSV) and rides before a bike's start value are left out and counted only;
 * - updates: [{ id, changes }] for known entries (the Strava id on a CSV ride; a ride waiting in
 *   «Zum Prüfen» that has a bike in Strava now; a new Strava bike name that still means the same bike);
 * - changes: rides whose Strava bike now means another app bike: the app asks (never moves them alone);
 * - counts and perBike for the summary (S2) and the tile on Today (S4).
 * noBike: 'check' (default) or 'auto'; ignore: Strava gear ids that do not count; checkFrom: the first
 * day looked at again for a changed bike (null: none).
 */
export function planSync({ activities = [], gear = [], bikes = [], rules = [], entries = [], noBike = 'check', ignore = [], checkFrom = null, importId = null }, now = new Date()) {
  const { rides, other } = toRides(activities, gear);
  const skip = new Set((ignore ?? []).map(String));
  const ctx = { bikes, rules };
  const byId = new Map(entries.filter((e) => e.stravaId).map((e) => [String(e.stravaId), e]));
  const counts0 = { found: rides.length, known: 0, inStart: 0, assigned: 0, check: 0, other, ignored: 0 };
  const seen = [];
  const fresh = [];
  const updates = [];
  for (const r of rides) {
    if (byId.has(r.stravaId)) {
      counts0.known++;
      seen.push(r);
      const old = byId.get(r.stravaId);
      const ch = {};
      if (r.hrAvg != null && (old.hrAvg ?? null) !== r.hrAvg) Object.assign(ch, { hrAvg: r.hrAvg, hrMax: r.hrMax });
      // «Werte überall» (WU1–WU4): the climbing of a ride fetched before the app kept it
      if (r.hm != null && (old.hm ?? null) !== r.hm) ch.hm = r.hm;
      if (Object.keys(ch).length) updates.push({ id: old.id, changes: ch });
    } else if (r.gearId && skip.has(String(r.gearId))) counts0.ignored++;
    else fresh.push(r);
  }

  // a changed Strava bike (decision 4b), only on the days looked at again
  const changes = [];
  const recent = checkFrom ? seen.filter((r) => r.date >= checkFrom) : [];
  for (const { entry, ride } of gearChanges([...byId.values()], recent)) {
    if (entry.state === 'removed' || entry.kind !== 'ride') continue;
    const ignored = !!ride.gearId && skip.has(String(ride.gearId));
    const to = ignored ? null : signals(ride, ctx).gear;
    if (!ignored && !to) continue; // a Strava bike the app does not know: nothing to move it to
    if (entry.state === 'open') {
      updates.push({ id: entry.id, changes: to ? { bikeId: to, gear: ride.gear, state: 'counted', by: 'gear', sure: 'likely', reason: null } : { gear: ride.gear, state: 'removed' } });
    } else if (to === entry.bikeId) {
      updates.push({ id: entry.id, changes: { gear: ride.gear } });
    } else {
      changes.push({ id: ride.stravaId, entryId: entry.id, date: entry.date, km: entry.km, name: entry.name || ride.name || '', fromBike: entry.bikeId ?? null, toBike: to, fromGear: entry.gear ?? '', toGear: ride.gear });
    }
  }

  const plan = planImport(fresh, { bikes, rules, entries });
  const out = [];
  const perBike = {};
  const add = (row, fields) => {
    const r = row.ride;
    const e = makeEntry({ date: r.date, time: r.time, km: r.km, kind: 'ride', source: 'strava', name: r.name, device: r.device, gear: r.gear, type: r.type ?? '', stravaId: r.stravaId, hrAvg: r.hrAvg, hrMax: r.hrMax, hm: r.hm, importId, ...fields }, now);
    out.push(e);
    if (e.state === 'counted' && e.bikeId) {
      const p = (perBike[e.bikeId] ??= { n: 0, km: 0 });
      p.n++;
      p.km = r1(p.km + e.km);
    }
  };
  for (const row of plan.rows) {
    if (row.dup === 'merged') {
      counts0.known++;
      continue;
    }
    if (row.dup === 'known') {
      counts0.known++;
      const old = entries.find((e) => e.id === row.of);
      if (old && !old.stravaId && !old.span) updates.push({ id: old.id, changes: { stravaId: row.ride.stravaId, ...(row.ride.hrAvg != null ? { hrAvg: row.ride.hrAvg, hrMax: row.ride.hrMax } : {}), ...(row.ride.hm != null ? { hm: row.ride.hm } : {}) } });
      continue;
    }
    if (!row.ride.gear) {
      const sug = suggestBike(row.ride, { bikes, rules, entries });
      if (dupOf(plan, row, sug ? { bikeId: sug.bikeId } : {})) {
        counts0.inStart++;
        continue;
      }
      if (noBike === 'auto' && sug) {
        counts0.assigned++;
        add(row, { bikeId: sug.bikeId, by: 'type', sure: 'likely', state: 'counted' });
      } else {
        counts0.check++;
        add(row, { bikeId: sug?.bikeId ?? null, by: sug ? 'type' : null, sure: 'unclear', state: 'open', reason: { code: 'none', gear: '', profile: '', suggest: sug } });
      }
      continue;
    }
    if (row.dup === 'start') {
      counts0.inStart++;
      continue;
    }
    if (row.sure === 'unclear') {
      counts0.check++;
      add(row, { bikeId: row.bikeId, by: row.by, sure: 'unclear', state: 'open', reason: row.reason });
    } else {
      counts0.assigned++;
      add(row, { bikeId: row.bikeId, by: row.by, sure: row.sure, state: 'counted' });
    }
  }
  const km = r1(Object.values(perBike).reduce((s, p) => s + p.km, 0));
  return { entries: out, updates, changes, counts: counts0, perBike, km };
}

/** Pending questions merged: a newer question about the same ride replaces the older one. */
export function mergeChanges(old = [], fresh = []) {
  const ids = new Set(fresh.map((c) => c.entryId));
  return [...old.filter((c) => !ids.has(c.entryId)), ...fresh];
}

/** The server's error code as a short sentence (English key for t()). */
export const ERROR_TEXT = {
  strava_busy: 'Strava is busy (too many requests). Try again in 15 minutes.',
  strava_login_needed: 'Strava needs a new login. Tap «Connect with Strava» once more.',
  not_connected: 'Strava is not connected any more. Connect again.',
  unauthorized: 'This device is not connected any more. Connect again.',
  not_set_up: 'The Strava connection is not set up on the server yet.',
  network: 'No connection to the server. Try again later.',
  denied: 'The Strava login was cancelled.',
  scope: 'Strava did not allow reading the rides. Connect again and leave «View data about your activities» on.',
  other_athlete: 'This server belongs to another Strava account.',
  expired: 'The login took too long. Try again.',
};
export const errorText = (code) => ERROR_TEXT[code] ?? 'Strava answered with an error. Try again later.';
