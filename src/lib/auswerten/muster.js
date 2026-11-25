/**
 * «Was tut mir gut?» (Noah 24.11.2026, «Auswerten neu»): two patterns that the data of the watch shows, found by plain rules,
 * as observation only, never as a cause. Pure functions over the day table (messwerte.js dayTable).
 *
 *   - bedtimeGroups: the HRV, the sleep and the deep sleep of the night, by the hour you went to bed (before 22:30,
 *     22:30–24:00, 24:00–01:30, after 01:30).
 *   - rideGroups: the HRV and the sleep of the night AFTER a day, by how long you rode that day (none, under 1 h, 1–3 h, over 3 h).
 *
 * A group with under MIN nights says nothing (no guessing). The callers always write «Beobachtung, keine Ursache».
 */
export const MIN_NIGHTS = 15;
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const median = (vals) => {
  const s = vals.filter((v) => fin(v) != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** «22:30» → minutes after noon, so that 23:00 < 00:30 < 03:00 (a time before noon counts as the next day). Null for a bad text. */
export function bedMinutes(text) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(text ?? ''));
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  if (!(v >= 0 && v < 1440)) return null;
  return v < 720 ? v + 1440 : v;
}

/** The bounds of the bedtime groups in minutes after noon: 22:30 = 1350, 24:00 = 1440, 01:30 = 1530. */
export const BED_BOUNDS = [1350, 1440, 1530];
/** The ride groups by hours on the bike that day. */
export const RIDE_BOUNDS = [1, 3];

const bedGroup = (b) => BED_BOUNDS.findIndex((x) => b < x) === -1 ? BED_BOUNDS.length : BED_BOUNDS.findIndex((x) => b < x);

/**
 * Per bedtime group { group 0–3, n, hrv, sleep, deep } (medians; null where a night has no value), or [] under two groups with MIN nights.
 * Each night is the row of the morning (the watch dates a night by the day you wake up): its HRV and sleep, `night.start` = the time you fell asleep.
 */
export function bedtimeGroups(table) {
  const by = [[], [], [], []];
  for (const row of table.values()) {
    const b = bedMinutes(row?.night?.start);
    if (b == null) continue;
    by[bedGroup(b)].push(row);
  }
  const out = by.map((rows, group) => ({ group, n: rows.length, hrv: median(rows.map((r) => r.hrv)), sleep: median(rows.map((r) => r.sleep)), deep: median(rows.map((r) => r.night?.deepMin)) }));
  return out.filter((g) => g.n >= MIN_NIGHTS && g.hrv != null).length >= 2 ? out : [];
}

/** The hours on the bike of one day: the Strava rides (kind «bike») with their moving time. */
export function rideHours(row) {
  const s = (row?.acts ?? []).filter((a) => a?.kind === 'bike' && !a.hidden).reduce((t, a) => t + (fin(Number(a.movingS)) ?? 0), 0);
  return s / 3600;
}

const rideGroup = (h) => (h <= 0 ? 'none' : h < RIDE_BOUNDS[0] ? 'short' : h < RIDE_BOUNDS[1] ? 'mid' : 'long');
export const RIDE_KEYS = ['none', 'short', 'mid', 'long'];

/**
 * Per ride group { key 'none'|'short'|'mid'|'long', n, hrv, sleep } for the night after the day (the row of the next day), medians;
 * [] when the groups «none» and «long» are both under MIN_NIGHTS (nothing to compare).
 * days: the day strings of the table, sorted (the caller passes [...table.keys()].sort() or null to let this sort).
 */
export function rideGroups(table, addDay) {
  const by = { none: [], short: [], mid: [], long: [] };
  for (const [day, row] of table) {
    const next = table.get(addDay(day, 1));
    if (!next || fin(next.hrv) == null) continue;
    by[rideGroup(rideHours(row))].push(next);
  }
  const out = RIDE_KEYS.map((key) => ({ key, n: by[key].length, hrv: median(by[key].map((r) => r.hrv)), sleep: median(by[key].map((r) => r.sleep)) }));
  const g = (k) => out.find((x) => x.key === k);
  return g('none').n >= MIN_NIGHTS && g('long').n >= MIN_NIGHTS ? out : [];
}
