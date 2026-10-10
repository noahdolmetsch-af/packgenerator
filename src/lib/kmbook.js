/**
 * v0.68.0 «Q1 Jeder km zählt» (Noah 10.10.2026, answers 1–9 a, Q1.1–Q1.7 a): the ride ledger.
 *
 * Every bike has a ledger instead of one km counter that a new value overwrote. Each entry is a
 * change of the bike's km with a date and a source: a ride (from a FIT file, the Strava CSV or by
 * hand), the start value, a new reading («the bike has 2'300 km now»: the difference) or a
 * correction with a reason. The bike's km are the sum of the entries that count; bike.km and
 * bike.kmDate stay as a copy of that sum, so every place that reads them works as before.
 *
 * Which ride belongs to which bike is the hard part (two Garmin units, profiles per bike type, the
 * Strava default bike). The rule never guesses silently: signals in this order, Sensor › Strava bike ›
 * profile rule › ride type rule › you. A contradiction, an unusual distance or no bike at all makes a
 * ride unclear: it waits in «Assign rides» and counts only after you confirmed it.
 *
 * Pure functions, tested in tests/kmbook.test.js. The database side is kmbookdb.js.
 */
import { localDay } from './localday.js';
import { t, num, dateOf } from './i18n.svelte.js';

/** Entry kinds: a ride, the start value, a new reading (difference), a correction with a reason. */
export const KINDS = ['ride', 'start', 'reading', 'correction'];
/** Where the km come from. sync: the counter changed outside the ledger (an older app or backup). */
export const SOURCES = ['fit', 'csv', 'hand', 'strava', 'sync'];
/** How sure the bike is: by a sensor, likely (Strava bike or one profile), unclear, or chosen by you. */
export const SURE = ['sure', 'likely', 'unclear', 'user'];
/** Where the bike came from (Q1.4 «woher»). type: a rule for the ride type (v0.69.1, «Gravel Ride» → a bike). */
export const BY = ['sensor', 'gear', 'profile', 'type', 'user'];

const r1 = (n) => Math.round(n * 10) / 10;
export const counts = (e) => e?.state === 'counted';
/** Entries newest first: by date, then by when they were written. */
export const newestFirst = (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || (b.at ?? '').localeCompare(a.at ?? '') || String(b.id).localeCompare(String(a.id));

/** The entries of one bike. */
export const ofBike = (entries, bikeId) => (entries ?? []).filter((e) => e.bikeId === bikeId);

/** The km of a bike: the sum of its counted entries (one decimal), and the date of the newest. */
export function bikeKm(entries, bikeId) {
  const mine = ofBike(entries, bikeId).filter(counts);
  if (!mine.length) return { km: null, kmDate: null, exact: null };
  const exact = r1(mine.reduce((s, e) => s + (Number(e.km) || 0), 0));
  const kmDate = mine.reduce((d, e) => (e.date > d ? e.date : d), '');
  return { km: Math.round(exact), kmDate: kmDate || null, exact };
}

/** The bike's km on a day (all counted entries up to and including it), e.g. for a part's start point. */
export function kmOn(entries, bikeId, date) {
  const mine = ofBike(entries, bikeId).filter((e) => counts(e) && e.date <= date);
  return mine.length ? Math.round(mine.reduce((s, e) => s + (Number(e.km) || 0), 0)) : null;
}

/**
 * The rows of a bike's ledger, newest first, each with the bike's km after it (`after`, counted
 * entries only; an open or left-out entry has after = null).
 */
export function ledgerRows(entries, bikeId) {
  const mine = ofBike(entries, bikeId);
  const oldest = [...mine].sort((a, b) => -newestFirst(a, b));
  let run = 0;
  const after = new Map();
  for (const e of oldest) {
    if (!counts(e)) continue;
    run = r1(run + (Number(e.km) || 0));
    after.set(e.id, run);
  }
  return [...mine].sort(newestFirst).map((e) => ({ ...e, after: after.has(e.id) ? after.get(e.id) : null }));
}

/** How many entries of each kind a ledger has: rides, hand entries, corrections, open, left out. */
export function ledgerCounts(entries, bikeId) {
  const mine = ofBike(entries, bikeId);
  return {
    rides: mine.filter((e) => e.kind === 'ride' && counts(e)).length,
    hand: mine.filter((e) => e.source === 'hand' && e.kind !== 'start' && e.kind !== 'correction' && counts(e)).length,
    corrections: mine.filter((e) => e.kind === 'correction' && counts(e)).length,
    open: mine.filter((e) => e.state === 'open'),
    removed: mine.filter((e) => e.state === 'removed').length,
    all: mine.length,
  };
}

let seq = 0;
/** A new entry id: «km-» + time + a counter (unique on this device). */
export const entryId = (now = Date.now()) => `km-${now.toString(36)}-${(seq++).toString(36)}`;

/** A new entry with all fields set (missing ones empty). */
export function makeEntry(fields, now = new Date()) {
  return {
    id: fields.id ?? entryId(now.getTime()),
    bikeId: fields.bikeId ?? null,
    date: fields.date ?? localDay(now),
    time: fields.time ?? null,
    km: r1(Number(fields.km) || 0),
    kind: fields.kind ?? 'ride',
    source: fields.source ?? 'hand',
    name: fields.name ?? '',
    device: fields.device ?? '',
    serial: fields.serial ?? null,
    profile: fields.profile ?? '',
    sensors: fields.sensors ?? [],
    gear: fields.gear ?? '',
    type: fields.type ?? '',
    stravaId: fields.stravaId ?? null,
    by: fields.by ?? null,
    sure: fields.sure ?? (fields.state === 'open' ? 'unclear' : 'user'),
    state: fields.state ?? 'counted',
    reason: fields.reason ?? null,
    note: fields.note ?? '',
    importId: fields.importId ?? null,
    inclusive: !!fields.inclusive,
    span: fields.span ?? null,
    tripId: fields.tripId ?? null,
    at: fields.at ?? now.toISOString(),
  };
}

/**
 * Migration (Q1 step 1): a bike with a km counter and no ledger gets its counter as the opening
 * entry, dated like the counter. Rides on that day are part of it already (inclusive). Returns the
 * entry or null (no counter, or the ledger has entries).
 */
export function openingEntry(bike, entries, today = localDay()) {
  if (typeof bike?.km !== 'number' || ofBike(entries, bike.id).length) return null;
  return makeEntry({ id: `km-open-${bike.id}`, bikeId: bike.id, date: bike.kmDate ?? today, km: bike.km, kind: 'start', source: 'hand', by: 'user', sure: 'user', note: 'Earlier counter', inclusive: true });
}

/**
 * The counter changed outside the ledger (an older app version or an older backup wrote bike.km):
 * a visible entry «sync» with the difference, so nothing changes silently. null when they agree.
 */
export function syncEntry(bike, entries, today = localDay()) {
  if (typeof bike?.km !== 'number' || !ofBike(entries, bike.id).length) return null;
  const { km } = bikeKm(entries, bike.id);
  if (km == null || Math.abs(bike.km - km) < 0.5) return null;
  return makeEntry({ bikeId: bike.id, date: bike.kmDate ?? today, km: bike.km - km, kind: 'reading', source: 'sync', by: 'user', sure: 'user', note: 'Counter changed outside the ride ledger' });
}

/** A new reading («the bike has N km now»): an entry with the difference, or null when nothing changes. */
export function readingEntry(entries, bikeId, total, { date = localDay(), source = 'hand', note = '' } = {}) {
  const { exact } = bikeKm(entries, bikeId);
  if (exact == null) return makeEntry({ bikeId, date, km: total, kind: 'start', source, note, by: 'user', sure: 'user' });
  const diff = r1(total - exact);
  if (Math.abs(diff) < 0.05) return null;
  return makeEntry({ bikeId, date, km: diff, kind: 'reading', source, note, by: 'user', sure: 'user' });
}

/** When the ledger of a bike starts: rides before it (or on its day, for a migrated counter) are in the start value. */
export function ledgerStart(entries, bikeId) {
  const starts = ofBike(entries, bikeId).filter((e) => e.kind === 'start' && e.state !== 'removed').sort((a, b) => a.date.localeCompare(b.date));
  return starts[0] ? { date: starts[0].date, inclusive: !!starts[0].inclusive } : null;
}
/** Is a ride on this day already part of the bike's start value? */
export const inStart = (start, date) => !!start && (date < start.date || (start.inclusive && date === start.date));

/**
 * A trip's km from the debrief (answer: no km counted twice): one entry for the whole trip, with its
 * days as span. Rides imported later on those days and that bike are «already in» (planImport);
 * a debrief after the rides were imported adds nothing (tripRidesIn).
 */
export function tripSpan(trip, end) {
  if (!trip?.startDate) return null;
  return [trip.startDate, end && end >= trip.startDate ? end : trip.startDate];
}
/** The counted rides of a bike on a trip's days. */
export const tripRidesIn = (entries, bikeId, span) => (span ? ofBike(entries, bikeId).filter((e) => e.kind === 'ride' && counts(e) && !e.span && e.date >= span[0] && e.date <= span[1]) : []);
const inSpan = (e, date) => !!e.span && date >= e.span[0] && date <= e.span[1];

/* ---------- files: Strava CSV and FIT ---------- */

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const pad = (n) => String(n).padStart(2, '0');
/** A UTC time as the calendar day in Zurich (the app's home). */
export function zurichDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Strava's «Oct 4, 2026, 7:12:33 AM» (UTC) as ISO; «2026-10-04 07:12:33» (Garmin, local) gives null. */
export function stravaTime(s) {
  const m = String(s ?? '').match(/([A-Za-z]{3})[a-z]*\.? (\d{1,2}), (\d{4}),? (\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?/i);
  if (!m || !MONTHS[m[1].toLowerCase()]) return null;
  let h = Number(m[4]);
  if (m[7]) h = (h % 12) + (/p/i.test(m[7]) ? 12 : 0);
  return `${m[3]}-${pad(MONTHS[m[1].toLowerCase()])}-${pad(m[2])}T${pad(h)}:${m[5]}:${m[6] ?? '00'}Z`;
}

/** One CSV line into cells (quotes allowed). */
function cells(line, sep) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') (cur += '"'), i++;
      else q = !q;
    } else if (c === sep && !q) out.push(cur), (cur = '');
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
/** CSV text into lines, keeping line breaks inside quotes (Strava's descriptions have them). */
function csvLines(text) {
  const out = [];
  let cur = '';
  let q = false;
  for (const c of text.replace(/^﻿/, '')) {
    if (c === '"') q = !q;
    if ((c === '\n' || c === '\r') && !q) {
      if (cur.trim()) out.push(cur);
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
const toNum = (s) => {
  const v = String(s ?? '').replace(/[^\d.,-]/g, '');
  if (!v) return NaN;
  return Number(/,\d{3}(\.|$)/.test(v) ? v.replace(/,/g, '') : v.replace(',', '.'));
};
const isoDay = (s) => {
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return null;
};

/** Ride types that count for a bike; Strava's virtual rides only when they have a bike. */
export const CYCLING = /ride|cycl|bike|velo|rad\b|gravel|mountain/i;
const VIRTUAL = /virtual|indoor|trainer/i;

/**
 * The Strava export activities.csv (or Garmin Connect's CSV): every activity with its date, start
 * time (Strava: UTC → the Zurich day), km, name, type, the bike («Activity Gear») and the id.
 * Returns { rides, other } (other: activities that are no ride, e.g. runs).
 */
export function parseStravaCsv(text) {
  const lines = csvLines(String(text ?? ''));
  if (lines.length < 2) throw new Error(t('The file has no activities in it.'));
  const sep = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const head = cells(lines[0], sep).map((h) => h.toLowerCase());
  const col = (re) => head.findIndex((h) => re.test(h));
  const iDate = col(/^(activity date|date|datum|start time)$/);
  const iDist = col(/^(distance|distanz|strecke)( \(km\))?$/);
  const iName = col(/^(activity name|title|titel|name)$/);
  const iType = col(/^(activity type|type|aktivitätstyp)$/);
  const iGear = col(/^(activity gear|gear|ausrüstung)$/);
  const iId = col(/^(activity id|id)$/);
  if (iDate < 0 || iDist < 0) throw new Error(t('Date or distance column not found. Use the CSV export of Strava or Garmin Connect.'));
  const metres = /\(m\)|meter/.test(head[iDist]);
  const rides = [];
  let other = 0;
  for (const line of lines.slice(1)) {
    const c = cells(line, sep);
    const raw = c[iDate] ?? '';
    const time = stravaTime(raw);
    const date = time ? zurichDay(time) : isoDay(raw);
    const n = toNum(c[iDist]);
    if (!date || !Number.isFinite(n)) continue;
    const type = iType >= 0 ? c[iType] ?? '' : '';
    const gear = iGear >= 0 ? c[iGear] ?? '' : '';
    if (type && (!CYCLING.test(type) || (VIRTUAL.test(type) && !gear))) {
      other++;
      continue;
    }
    rides.push({ source: 'csv', date, time, km: r1(metres ? n / 1000 : n), name: iName >= 0 ? c[iName] ?? '' : '', type, gear, stravaId: iId >= 0 && c[iId] ? String(c[iId]) : null, device: '', profile: '', sensors: [] });
  }
  return { rides, other };
}

/* FIT: Garmin's binary activity file. Only what the ledger needs: the unit (file_id), its connected
   sensors (device_info), the profile name (sport), start time, sport and distance (session). */
const FIT_EPOCH = 631065600; // 1989-12-31T00:00:00Z in Unix seconds
const BASE = {
  0x00: [1, 'u8', 0xff], 0x01: [1, 's8', 0x7f], 0x02: [1, 'u8', 0xff], 0x83: [2, 's16', 0x7fff], 0x84: [2, 'u16', 0xffff],
  0x85: [4, 's32', 0x7fffffff], 0x86: [4, 'u32', 0xffffffff], 0x07: [1, 'str', null], 0x88: [4, 'f32', null], 0x89: [8, 'f64', null],
  0x0a: [1, 'u8', 0], 0x8b: [2, 'u16', 0], 0x8c: [4, 'u32', 0], 0x0d: [1, 'u8', 0xff], 0x8e: [8, 's64', null], 0x8f: [8, 'u64', null], 0x90: [8, 'u64', null],
};
/** Garmin units by product number (the FIT profile), for a readable name. */
export const GARMIN = { 2713: 'Edge 1030', 3121: 'Edge 530', 3122: 'Edge 830', 3570: 'Edge 1030 Plus', 3843: 'Edge 1040', 4061: 'Edge 540', 4062: 'Edge 840' };
/** ANT+ device types that belong to a bike (not the rider: no heart rate strap). */
const BIKE_SENSOR = { 11: 'power', 121: 'speed', 122: 'cadence', 123: 'speed', 34: 'shifting', 40: 'radar', 35: 'light' };
const SPORT_CYCLING = new Set([2, 21]); // cycling, e-biking
/**
 * v0.69.1: the ride type of a FIT file in Strava's words, so one «ride type» rule fits both files.
 * sport 2 cycling / 21 e-biking; sub_sport 46 gravel, 8 mountain, 9 downhill, 47 e-bike mountain,
 * 28 e-bike fitness, 6 and 58 indoor / virtual. Anything else is a plain «Ride».
 */
export function fitType(sport, sub) {
  if (sport !== 2 && sport !== 21) return '';
  if (sub === 47 || (sport === 21 && (sub === 8 || sub === 9))) return 'E-Mountain Bike Ride';
  if (sport === 21 || sub === 28) return 'E-Bike Ride';
  if (sub === 46) return 'Gravel Ride';
  if (sub === 8 || sub === 9) return 'Mountain Bike Ride';
  if (sub === 6 || sub === 58) return 'Virtual Ride';
  return 'Ride';
}

function readValue(dv, u8, p, size, type, little) {
  const [bsize, kind, invalid] = BASE[type] ?? [1, 'u8', null];
  if (kind === 'str') {
    let s = '';
    for (let i = 0; i < size && u8[p + i]; i++) s += String.fromCharCode(u8[p + i]);
    try {
      s = decodeURIComponent(escape(s));
    } catch {
      /* not UTF-8: keep the bytes as they are */
    }
    return s || null;
  }
  if (size < bsize) return null;
  let v;
  if (kind === 'u8') v = dv.getUint8(p);
  else if (kind === 's8') v = dv.getInt8(p);
  else if (kind === 'u16') v = dv.getUint16(p, little);
  else if (kind === 's16') v = dv.getInt16(p, little);
  else if (kind === 'u32') v = dv.getUint32(p, little);
  else if (kind === 's32') v = dv.getInt32(p, little);
  else if (kind === 'f32') v = dv.getFloat32(p, little);
  else if (kind === 'f64') v = dv.getFloat64(p, little);
  else return null; // 64-bit integers: not needed here
  return invalid != null && v === invalid ? null : v;
}

/**
 * One FIT file (ArrayBuffer or Uint8Array) → { source: 'fit', date, time, km, device, serial,
 * profile, sensors: [{ fp, kind }], sport }. Throws when it is no FIT file; a ride without a session
 * gets km null.
 */
export function parseFit(buffer, file = '') {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const hsize = u8[0];
  if (u8.length < 12 || hsize < 12 || String.fromCharCode(u8[8], u8[9], u8[10], u8[11]) !== '.FIT') throw new Error(t('This is not a FIT file.'));
  const end = Math.min(u8.length, hsize + dv.getUint32(4, true));
  const defs = {};
  const out = { fileId: null, devices: [], sport: null, session: null };
  let p = hsize;
  let guard = 0;
  while (p < end && guard++ < 2_000_000) {
    const h = u8[p++];
    if (!(h & 0x80) && h & 0x40) {
      const local = h & 0x0f;
      const little = u8[p + 1] === 0;
      const num = dv.getUint16(p + 2, little);
      const n = u8[p + 4];
      p += 5;
      const fields = [];
      for (let i = 0; i < n; i++, p += 3) fields.push({ num: u8[p], size: u8[p + 1], type: u8[p + 2] });
      let devSize = 0;
      if (h & 0x20) {
        const nd = u8[p++];
        for (let i = 0; i < nd; i++, p += 3) devSize += u8[p + 1];
      }
      defs[local] = { num, little, fields, devSize };
      continue;
    }
    const local = h & 0x80 ? (h >> 5) & 0x03 : h & 0x0f;
    const def = defs[local];
    if (!def) throw new Error(t('The FIT file is damaged.'));
    const want = def.num === 0 || def.num === 12 || def.num === 18 || def.num === 23;
    const msg = {};
    for (const f of def.fields) {
      if (want) msg[f.num] = readValue(dv, u8, p, f.size, f.type, def.little);
      p += f.size;
    }
    p += def.devSize;
    if (!want) continue;
    if (def.num === 0 && !out.fileId) out.fileId = msg;
    else if (def.num === 23) out.devices.push(msg);
    else if (def.num === 12 && !out.sport) out.sport = msg;
    else if (def.num === 18 && !out.session) out.session = msg;
  }
  const fid = out.fileId ?? {};
  const s = out.session ?? {};
  const startSec = s[2] ?? fid[4] ?? null;
  const time = startSec != null ? new Date((startSec + FIT_EPOCH) * 1000).toISOString().replace('.000Z', 'Z') : null;
  const head = out.devices.find((d) => d[0] === 0) ?? {};
  const product = fid[2] ?? head[4] ?? null;
  const device = fid[8] || head[27] || (fid[1] === 1 || fid[1] == null ? GARMIN[product] : null) || (product != null ? `${t('Unit')} ${product}` : '');
  const sensors = [];
  for (const d of out.devices) {
    if (d[0] === 0 || d[25] === 5 || d[25] === 4) continue; // the unit itself, its own sensors (GPS, barometer)
    const kind = BIKE_SENSOR[d[1]];
    if (d[1] != null && !kind) continue; // a heart rate strap goes with the rider, not with a bike
    const fp = d[3] ? d[3].toString(16).toUpperCase() : d[21] ? `ANT${d[21].toString(16).toUpperCase()}` : null;
    if (fp && !sensors.some((x) => x.fp === fp)) sensors.push({ fp, kind: kind ?? 'sensor' });
  }
  const sport = s[5] ?? out.sport?.[0] ?? null;
  const sub = s[6] ?? out.sport?.[1] ?? null;
  return {
    source: 'fit',
    file,
    date: time ? zurichDay(time) : null,
    time,
    km: s[9] != null ? r1(s[9] / 100 / 1000) : null,
    name: '',
    type: fitType(sport ?? 2, sub),
    gear: '',
    stravaId: null,
    device: device || '',
    serial: fid[3] ? String(fid[3]) : null,
    profile: out.sport?.[3] || s[110] || '',
    sensors,
    cycling: sport == null || SPORT_CYCLING.has(sport),
  };
}

/** A sensor's short name: «…4F2A». */
export const sensorShort = (fp) => `…${String(fp ?? '').slice(-4)}`;

/* ---------- duplicates ---------- */

const minutes = (iso) => (iso ? Date.parse(iso) / 60000 : null);
/**
 * Two records of the same ride: the same day, km within 1 km or 3 %, and (when both have a start
 * time) at most 30 minutes apart. The same Strava id is always the same ride.
 */
export function sameRide(a, b) {
  if (a.stravaId && b.stravaId) return a.stravaId === b.stravaId;
  if (a.date !== b.date || a.km == null || b.km == null) return false;
  if (Math.abs(a.km - b.km) > Math.max(1, 0.03 * Math.max(a.km, b.km))) return false;
  const ta = minutes(a.time);
  const tb = minutes(b.time);
  return ta == null || tb == null || Math.abs(ta - tb) <= 30;
}

/** Two records of one ride as one: the CSV gives the name, the bike and the id, the FIT file the unit, profile and sensors. */
export function mergeRides(a, b) {
  const fit = a.source === 'fit' ? a : b.source === 'fit' ? b : null;
  const pick = (k) => a[k] || b[k] || '';
  return {
    ...a,
    source: fit ? 'fit' : a.source,
    km: fit?.km ?? a.km ?? b.km,
    time: fit?.time ?? a.time ?? b.time,
    name: pick('name'),
    type: pick('type'),
    gear: pick('gear'),
    stravaId: a.stravaId ?? b.stravaId ?? null,
    device: pick('device'),
    serial: a.serial ?? b.serial ?? null,
    profile: pick('profile'),
    sensors: [...(a.sensors ?? []), ...(b.sensors ?? []).filter((s) => !(a.sensors ?? []).some((x) => x.fp === s.fp))],
    merged: [...(a.merged ?? [a]), ...(b.merged ?? [b])],
  };
}

/* ---------- rules and assignment ---------- */

const same = (x, y) => String(x ?? '').trim().toLowerCase() === String(y ?? '').trim().toLowerCase() && String(x ?? '').trim() !== '';

/**
 * The rules (Q1.5, changeable at any time), each { id, kind: 'sensor' | 'profile' | 'gear' | 'type', value, bikeIds }.
 * Without a gear rule a Strava bike matches a bike of the same name; without a profile rule a
 * profile named like a bike matches that bike (answer 9a: one Garmin profile per bike, named like it).
 * v0.69.1: a type rule (the ride type, «Gravel Ride» → a bike) only counts when you made one: no
 * name fallback, nothing pre-filled.
 */
export function signals(ride, { bikes, rules = [] }) {
  const exists = (id) => bikes.some((b) => b.id === id);
  const sensorRule = rules.find((r) => r.kind === 'sensor' && (ride.sensors ?? []).some((s) => same(s.fp, r.value)));
  const sensor = sensorRule ? sensorRule.bikeIds.find(exists) ?? null : null;
  let gear = null;
  if (ride.gear) {
    const r = rules.find((x) => x.kind === 'gear' && same(x.value, ride.gear));
    gear = r ? r.bikeIds.find(exists) ?? null : bikes.find((b) => same(b.name, ride.gear) || same(b.stravaName, ride.gear))?.id ?? null;
  }
  let profile = [];
  if (ride.profile) {
    const r = rules.find((x) => x.kind === 'profile' && same(x.value, ride.profile));
    profile = r ? r.bikeIds.filter(exists) : bikes.filter((b) => same(b.name, ride.profile)).map((b) => b.id);
  }
  let type = [];
  if (ride.type) {
    const r = rules.find((x) => x.kind === 'type' && same(x.value, ride.type));
    type = r ? r.bikeIds.filter(exists) : [];
  }
  return { sensor, gear, gearUnknown: !!ride.gear && !gear, profile, type };
}

/**
 * The bike of one ride, never guessed silently: { bikeId, by, sure, reason }.
 * Sensor (sure) › Strava bike (likely) › one profile rule (likely) › one ride type rule (likely, v0.69.1)
 * › you. Any contradiction between the signals, a ride much longer than usual on that bike, or no
 * bike: unclear, with the reason.
 * usual: { [bikeId]: [km of earlier rides] } for the distance check.
 */
export function assignRide(ride, ctx) {
  const s = signals(ride, ctx);
  const name = (id) => id;
  let out;
  if (s.sensor) {
    out = { bikeId: s.sensor, by: 'sensor', sure: 'sure', reason: null };
    if (s.gear && s.gear !== s.sensor) out = { ...out, sure: 'unclear', reason: { code: 'conflict', by: 'gear', said: name(s.gear), bike: s.sensor } };
    else if (s.profile.length && !s.profile.includes(s.sensor)) out = { ...out, sure: 'unclear', reason: { code: 'conflict', by: 'profile', said: s.profile[0], bike: s.sensor, profile: ride.profile } };
  } else if (s.gear) {
    out = { bikeId: s.gear, by: 'gear', sure: 'likely', reason: null };
    if (s.profile.length && !s.profile.includes(s.gear)) out = { ...out, sure: 'unclear', reason: { code: 'conflict', by: 'profile', said: s.profile[0], bike: s.gear, profile: ride.profile, strava: true } };
  } else if (s.profile.length === 1) {
    out = { bikeId: s.profile[0], by: 'profile', sure: 'likely', reason: null };
  } else if (s.profile.length > 1) {
    // v0.69.1: a ride type rule for exactly one of these bikes tells them apart
    const one = s.type.length === 1 && s.profile.includes(s.type[0]);
    out = one ? { bikeId: s.type[0], by: 'type', sure: 'likely', reason: null } : { bikeId: null, by: 'profile', sure: 'unclear', reason: { code: 'several', bikes: s.profile, profile: ride.profile } };
  } else if (s.type.length === 1) {
    out = { bikeId: s.type[0], by: 'type', sure: 'likely', reason: null };
  } else {
    out = { bikeId: null, by: null, sure: 'unclear', reason: { code: 'none', gear: s.gearUnknown ? ride.gear : '', profile: ride.profile ?? '' } };
  }
  // v0.69.1: the ride type rule says another bike than the sensor, Strava or the profile: please check
  if (out.bikeId && out.by !== 'type' && out.sure !== 'unclear' && s.type.length && !s.type.includes(out.bikeId)) {
    out = { ...out, sure: 'unclear', reason: { code: 'conflict', by: 'type', from: out.by, said: s.type[0], bike: out.bikeId, type: ride.type } };
  }
  // Plausibility: a hint, never a decision. Much longer than every earlier ride on that bike: please check.
  const earlier = out.bikeId && out.sure !== 'unclear' ? ctx.usual?.[out.bikeId] ?? [] : [];
  if (earlier.length >= 3 && ride.km != null) {
    const max = Math.max(...earlier);
    if (ride.km > Math.max(max * 1.5, max + 15)) out = { ...out, sure: 'unclear', reason: { code: 'long', bike: out.bikeId, under: Math.ceil(max / 10) * 10 } };
  }
  return out;
}

/** The km of the counted rides per bike (for the distance check). */
export function usualKm(entries) {
  const out = {};
  for (const e of entries ?? []) if (e.kind === 'ride' && counts(e) && e.bikeId) (out[e.bikeId] ??= []).push(e.km);
  return out;
}

/**
 * Plan an import (Q1.3, Q1.4): the records of all files → one row per ride.
 * rows: [{ key, ride, bikeId, by, sure, reason, dup: null | 'merged' | 'known' | 'start', of }]
 *   merged: a second record of a ride in these files (it is merged into the first);
 *   known: already in the ledger; start: before the bike's start value (already counted in it).
 * strava: { [bikeId]: { km, date } } the bike totals in Strava (all activities with that bike).
 */
export function planImport(records, { bikes, rules = [], entries = [] }) {
  const rides = [];
  const merged = [];
  for (const r of records.filter((x) => x && x.date && x.km != null && x.cycling !== false)) {
    const i = rides.findIndex((x) => sameRide(x, r));
    if (i >= 0) {
      merged.push({ ride: r, into: i });
      rides[i] = mergeRides(rides[i], r);
    } else rides.push(r);
  }
  const usual = usualKm(entries);
  const ctx = { bikes, rules, usual };
  const rows = rides.map((ride, n) => {
    const a = assignRide(ride, ctx);
    const known = (entries ?? []).find((e) => e.kind === 'ride' && e.state !== 'removed' && (sameRide(e, ride) || (a.bikeId && e.bikeId === a.bikeId && counts(e) && inSpan(e, ride.date))));
    const start = a.bikeId ? ledgerStart(entries, a.bikeId) : null;
    const dup = known ? 'known' : inStart(start, ride.date) ? 'start' : null;
    return { key: `r${n}`, ride, ...a, dup, of: known?.id ?? null };
  });
  const extra = merged.map((m, n) => ({ key: `m${n}`, ride: m.ride, bikeId: rows[m.into].bikeId, by: null, sure: null, reason: null, dup: 'merged', of: rows[m.into].key }));
  // Strava's own totals per bike: every activity with that bike in the CSV.
  const strava = {};
  for (const r of records.filter((x) => x?.source === 'csv' && x.gear)) {
    const id = signals({ gear: r.gear }, ctx).gear;
    if (!id) continue;
    const s = (strava[id] ??= { km: 0, date: '' });
    s.km = r1(s.km + (r.km ?? 0));
    if (r.date > s.date) s.date = r.date;
  }
  return { rows: [...rows, ...extra], strava };
}

/**
 * v0.72.0 «Feinschliff» (D1a, Noah 10.10.2026): each ride type of the files that no «Ride type» rule
 * knows yet, asked once («Which bike do you ride for «Gravel Ride»?»); the answer becomes a rule.
 * Nothing is pre-filled from the type itself: the suggestion is the bike that sensor, Strava or the
 * profile gave most rides of that type (else none). Returns [{ kind: 'type', value, n, guess }],
 * most rides first. rows: planImport(…).rows; rules: the import rules.
 */
export function typeHints(rows = [], rules = []) {
  const found = new Map(); // lower-case type → { value, n, votes }
  for (const r of rows) {
    if (r.dup === 'merged') continue;
    const value = String(r.ride?.type ?? '').trim();
    if (!value || rules.some((u) => u.kind === 'type' && same(u.value, value))) continue;
    const m = found.get(value.toLowerCase()) ?? { value, n: 0, votes: {} };
    m.n += 1;
    if (r.bikeId && r.by && r.by !== 'type' && r.sure !== 'unclear') m.votes[r.bikeId] = (m.votes[r.bikeId] ?? 0) + 1;
    found.set(value.toLowerCase(), m);
  }
  return [...found.values()]
    .map((m) => ({ kind: 'type', value: m.value, n: m.n, guess: Object.entries(m.votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '' }))
    .sort((a, b) => b.n - a.n || a.value.localeCompare(b.value));
}

/** Rows that will be written (new rides), and the ones to check first (unclear). */
export const newRows = (plan) => plan.rows.filter((r) => !r.dup || r.take);
export const toCheck = (plan) => newRows(plan).filter((r) => r.sure === 'unclear');

/**
 * The import's rows (with your choices) → ledger entries. A choice: { bikeId } (you picked a bike:
 * by you, counts), { confirm: true } (you confirmed the proposal), { take: true } on a duplicate
 * («import anyway»). Unclear rows without a choice are written as open: they wait and do not count.
 */
export function importEntries(plan, choices = {}, importId, now = new Date()) {
  const out = [];
  for (const row of plan.rows) {
    const c = choices[row.key] ?? {};
    if (row.dup && !c.take) continue;
    if (row.dup === 'merged') continue;
    const r = row.ride;
    let bikeId = row.bikeId;
    let by = row.by;
    let sure = row.sure;
    let state = sure === 'unclear' ? 'open' : 'counted';
    if (c.bikeId !== undefined && c.bikeId !== row.bikeId) {
      bikeId = c.bikeId;
      by = 'user';
      sure = 'user';
      state = bikeId ? 'counted' : 'open';
    } else if (c.confirm && bikeId) {
      by = row.sure === 'unclear' ? 'user' : by;
      sure = row.sure === 'unclear' ? 'user' : sure;
      state = 'counted';
    }
    if (c.bikeId === null) state = 'open';
    out.push(
      makeEntry(
        {
          bikeId, date: r.date, time: r.time, km: r.km, kind: 'ride', source: r.source, name: r.name, device: r.device, serial: r.serial,
          profile: r.profile, sensors: (r.sensors ?? []).map((s) => s.fp), gear: r.gear, type: r.type ?? '', stravaId: r.stravaId, by, sure, state,
          reason: state === 'open' ? row.reason : null, importId,
        },
        now,
      ),
    );
  }
  return out;
}

/* ---------- control: weekly reconcile, Q1 status, monthly report ---------- */

/**
 * Per bike: what the app says and what Strava says (bike.strava from the last CSV import), the
 * difference, and the open rides that may explain it (Q1.6). → [{ bike, app, strava, date, diff, open, explained }]
 */
export function reconcile(bikes, entries) {
  return bikes.map((bike) => {
    const app = bikeKm(entries, bike.id).exact;
    const st = bike.strava ?? null;
    const diff = st && app != null ? r1(st.km - app) : null;
    const open = ofBike(entries, bike.id).filter((e) => e.state === 'open');
    const openKm = r1(open.reduce((s, e) => s + e.km, 0));
    return { bike, app, strava: st?.km ?? null, date: st?.date ?? null, diff, open, explained: diff != null && open.length > 0 && Math.abs(openKm - diff) < 1 };
  });
}
/** A bike's km match Strava: the difference is under half a km (Strava rounds each ride). */
export const matches = (diff) => diff != null && Math.abs(diff) < 0.5;

/** The ISO week of a day, «2026-W41»: the weekly card comes once per week. */
export function isoWeek(day) {
  const d = new Date(`${day}T00:00:00Z`);
  const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd + 3);
  const y = d.getUTCFullYear();
  const w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${pad(w)}`;
}

/**
 * The start point of a part (Q1 point 2): the last time it was mounted, with the date and the bike's
 * km then. carried: km the part already had (it came from another bike). null when there is none,
 * or when its km are not known.
 */
export function partStart(part) {
  const h = (part?.history ?? []).filter((x) => x.action === 'replace' && x.result !== 'needed' && x.date);
  const last = h.at(-1);
  if (!last || typeof last.km !== 'number') return null;
  return { date: last.date, km: last.km, carried: typeof last.carried === 'number' ? last.carried : 0, from: last.from ?? null, start: !!last.start, entry: last };
}
/** The km on a part: what it brought along plus the bike's km since it was mounted. */
export function partKm(bike, part) {
  const s = partStart(part);
  if (!s || typeof bike?.km !== 'number') return null;
  return Math.max(0, bike.km - s.km) + s.carried;
}

/**
 * Q1 «Lückenlose km» for one bike: four points, each { ok, key, … }, and the state
 * 'done' (all four), 'almost' (one or two open) or 'open'.
 * parts: the bike's main parts (the ones a start point is asked for).
 */
export function q1Status(bike, entries, parts) {
  const rec = reconcile([bike], entries)[0];
  const mine = ofBike(entries, bike.id);
  const missing = parts.filter((p) => !partStart(p));
  const carried = parts.filter((p) => partStart(p)?.carried > 0);
  const points = [
    { key: 'strava', ok: matches(rec.diff) && !rec.open.length, diff: rec.diff, app: rec.app, strava: rec.strava, date: rec.date, open: rec.open.length },
    { key: 'start', ok: !missing.length, missing },
    { key: 'source', ok: mine.every((e) => e.source && e.date), n: mine.length },
    { key: 'carry', ok: true, carried },
  ];
  const open = points.filter((p) => !p.ok).length;
  return { points, state: open === 0 ? 'done' : open <= 2 ? 'almost' : 'open', missing };
}

/**
 * The monthly report line per bike (answer 4a): the difference to Strava, parts without a start
 * point, the last source. month: «2026-09».
 */
export function monthReport(bikes, entries, partsOf, month) {
  return bikes.map((bike) => {
    const q = q1Status(bike, entries, partsOf(bike));
    const last = ofBike(entries, bike.id).filter((e) => e.state !== 'removed' && e.date.slice(0, 7) <= month).sort(newestFirst)[0] ?? null;
    const rides = ofBike(entries, bike.id).filter((e) => e.kind === 'ride' && counts(e) && e.date.startsWith(month));
    return { bike, diff: q.points[0].diff, missing: q.missing.length, last, rides: rides.length, km: r1(rides.reduce((s, e) => s + e.km, 0)), state: q.state };
  });
}

/** The month before a day: «2026-10-05» → «2026-09». */
export function prevMonth(day) {
  const [y, m] = day.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
}

/* ---------- words (the page shows them; English keys, German in i18n/de/kmbook.js) ---------- */

export const SOURCE_NAME = { fit: 'FIT file', csv: 'Strava CSV', hand: 'By hand', strava: 'Strava', sync: 'Counter' };
export const SURE_NAME = { sure: 'sure', likely: 'likely', unclear: 'unclear', user: 'by you' };
export const BY_NAME = { sensor: 'Sensor', gear: 'Strava bike', profile: 'Profile rule', type: 'Ride type rule', user: 'by you' };

/** Why a ride is unclear, as one sentence. nameOf: bike id → name. */
export function reasonText(reason, nameOf = (id) => id) {
  if (!reason) return '';
  if (reason.code === 'conflict' && reason.by === 'type') {
    const v = { bike: nameOf(reason.bike), said: nameOf(reason.said), type: reason.type };
    if (reason.from === 'sensor') return t('Contradiction: the sensor says {bike}, the rule for the ride type «{type}» says {said}.', v);
    if (reason.from === 'gear') return t('Contradiction: Strava says {bike}, the rule for the ride type «{type}» says {said}.', v);
    return t('Contradiction: the profile says {bike}, the rule for the ride type «{type}» says {said}.', v);
  }
  if (reason.code === 'conflict' && reason.by === 'gear') return t('Contradiction: the sensor says {bike}, Strava says {said}.', { bike: nameOf(reason.bike), said: nameOf(reason.said) });
  if (reason.code === 'conflict' && reason.strava) return t('Contradiction: Strava says {bike}, the rule for {profile} says {said}.', { bike: nameOf(reason.bike), said: nameOf(reason.said), profile: reason.profile });
  if (reason.code === 'conflict') return t('Contradiction: the sensor says {bike}, the profile {profile} says {said}.', { bike: nameOf(reason.bike), said: nameOf(reason.said), profile: reason.profile });
  if (reason.code === 'several') return t('The profile {profile} fits {bikes}: only Strava or a sensor can tell.', { profile: reason.profile, bikes: reason.bikes.map(nameOf).join(' · ') });
  if (reason.code === 'long') return t('Longer than usual: with {bike} mostly under {km} km.', { bike: nameOf(reason.bike), km: num(reason.under) });
  // v0.69.1 G: a Strava ride has no profile: no «rule for the profile «–»»
  if (reason.gear && !reason.profile) return t('Strava bike «{gear}» is unknown here.', { gear: reason.gear });
  if (reason.gear) return t('Strava bike «{gear}» is unknown here, no rule for the profile «{profile}».', { gear: reason.gear, profile: reason.profile });
  if (reason.profile) return t('No bike in Strava, no rule for the profile «{profile}».', { profile: reason.profile });
  return t('No bike in Strava, no profile.');
}

/** The note of a non-ride entry in words. */
export function entryTitle(e) {
  if (e.kind === 'start') return e.note === 'Earlier counter' ? t('Start value: the earlier counter') : t('Start value');
  if (e.kind === 'reading') return e.source === 'sync' ? t('Counter changed outside the ledger') : e.source === 'strava' ? t('Strava value taken over') : t('New reading');
  if (e.kind === 'correction') return t('Correction');
  return e.name || t('Ride');
}

/** «Edge 1040 · Profile Gravel · Sensor …4F2A». */
export function entryDetail(e) {
  if (e.kind === 'correction') return e.note ? t('Reason: {why}', { why: e.note }) : '';
  if (e.kind === 'start') return e.note === 'Earlier counter' ? t('from the km counter before {date}', { date: dateOf(e.date) }) : e.note && e.note !== 'Start value' ? e.note : t('km at the purchase');
  if (e.kind === 'reading') return e.note && e.note !== 'Counter changed outside the ride ledger' ? e.note : '';
  if (e.tripId) return t('the whole trip, from the debrief');
  const parts = [e.device, e.profile ? t('Profile {name}', { name: e.profile }) : '', ...(e.sensors ?? []).slice(0, 1).map((fp) => `${t('Sensor')} ${sensorShort(fp)}`), e.by === 'type' && e.type ? t('Ride type {type}', { type: e.type }) : ''].filter(Boolean);
  if (!parts.length && e.source === 'hand') return t('entered by hand');
  if (!parts.length && e.gear) return t('Strava bike {gear}', { gear: e.gear });
  return parts.join(' · ');
}
