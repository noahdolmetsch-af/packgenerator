/**
 * «Apple-Health-Export einlesen» (Noah 27.10.2026 «4a», thread «Geräte und Datenquellen»). A web app
 * cannot read Apple Health; the iPhone can export everything as one zip (Health app › your picture ›
 * «Export All Health Data»). This file turns that export into days of healthDays (health.js), the same
 * table the Fitbit connection fills, so every place that shows sleep, resting heart rate or steps
 * shows them for an iPhone too.
 *
 * Per day (the local day of the recording, as in the file):
 * - restingHr: mean of RestingHeartRate · hrvMs: mean of HeartRateVariabilitySDNN (Apple measures
 *   SDNN, Fitbit RMSSD; both are kept in hrvMs, the row says src 'apple')
 * - steps, kcalActive: per source summed, the day takes the source with most (iPhone and Watch count
 *   the same steps, adding them would count twice)
 * - sleep: the night counts to the day you woke up; asleep, deep, REM, light (core) and awake minutes,
 *   start and end; per night the source with most sleep. A sleep that ends after 14:00 is a nap, left out.
 * - vo2max, weightKg: the last value of the day
 * Workouts are counted for the preview only (they come in a later step).
 * Everything is read on this device. Pure parts are tested in tests/applehealth.test.js.
 */

const HK = 'HKQuantityTypeIdentifier';
const TYPES = {
  [`${HK}RestingHeartRate`]: 'rhr',
  [`${HK}HeartRateVariabilitySDNN`]: 'hrv',
  [`${HK}StepCount`]: 'steps',
  [`${HK}ActiveEnergyBurned`]: 'kcal',
  [`${HK}VO2Max`]: 'vo2',
  [`${HK}BodyMass`]: 'weight',
  HKCategoryTypeIdentifierSleepAnalysis: 'sleep',
};
const ASLEEP = { HKCategoryValueSleepAnalysisAsleep: 'light', HKCategoryValueSleepAnalysisAsleepUnspecified: 'light', HKCategoryValueSleepAnalysisAsleepCore: 'light', HKCategoryValueSleepAnalysisAsleepDeep: 'deep', HKCategoryValueSleepAnalysisAsleepREM: 'rem' };

const attr = (s, name) => {
  const m = s.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "'") : null;
};
/** «2026-06-14 07:00:00 +0200» → { day: '2026-06-14', hm: '07:00', ms } (ms: the moment, for durations). */
export function appleTime(s) {
  const m = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/.exec(String(s ?? '').trim());
  if (!m) return null;
  const off = (m[5] === '-' ? -1 : 1) * (Number(m[6]) * 60 + Number(m[7]));
  const ms = Date.parse(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`) - off * 60000;
  return { day: m[1], hm: `${m[2]}:${m[3]}`, h: Number(m[2]), ms };
}

/** A collector: feed it lines (or whole start tags), then days() gives the rows. */
export function appleCollector() {
  const mean = new Map(); // `${k}|${day}` → [sum, n]
  const perSrc = new Map(); // `${k}|${day}` → Map(source → sum)
  const last = new Map(); // `${k}|${day}` → { ms, v }
  const nights = new Map(); // `${wakeDay}|${source}` → night
  const counts = { records: 0, workouts: 0 };
  let from = null;
  let to = null;
  const seeDay = (d) => {
    if (!from || d < from) from = d;
    if (!to || d > to) to = d;
  };
  const addMean = (k, day, v) => {
    const a = mean.get(`${k}|${day}`) ?? [0, 0];
    a[0] += v;
    a[1] += 1;
    mean.set(`${k}|${day}`, a);
  };
  const addSrc = (k, day, src, v) => {
    const m = perSrc.get(`${k}|${day}`) ?? new Map();
    m.set(src, (m.get(src) ?? 0) + v);
    perSrc.set(`${k}|${day}`, m);
  };
  const setLast = (k, day, ms, v) => {
    const o = last.get(`${k}|${day}`);
    if (!o || ms >= o.ms) last.set(`${k}|${day}`, { ms, v });
  };

  function line(raw) {
    const s = String(raw ?? '');
    const i = s.indexOf('<Workout ');
    if (i >= 0) {
      counts.workouts++;
      return;
    }
    const r = s.indexOf('<Record ');
    if (r < 0) return;
    const tag = s.slice(r);
    const kind = TYPES[attr(tag, 'type')];
    if (!kind) return;
    const start = appleTime(attr(tag, 'startDate'));
    const end = appleTime(attr(tag, 'endDate')) ?? start;
    if (!start) return;
    const src = attr(tag, 'sourceName') ?? '';
    const raw2 = attr(tag, 'value');
    counts.records++;
    if (kind === 'sleep') {
      const stage = ASLEEP[raw2];
      const awake = raw2 === 'HKCategoryValueSleepAnalysisAwake';
      if (!stage && !awake) return; // InBed only: the stages say more
      const min = Math.max(0, Math.round((end.ms - start.ms) / 60000));
      if (end.h >= 14) return; // a nap in the afternoon
      const wake = end.day;
      const key = `${wake}|${src}`;
      const n = nights.get(key) ?? { date: wake, asleepMin: 0, deepMin: 0, remMin: 0, lightMin: 0, awakeMin: 0, startMs: Infinity, endMs: -Infinity, start: null, end: null };
      if (stage) (n.asleepMin += min), (n[`${stage}Min`] += min);
      else n.awakeMin += min;
      if (start.ms < n.startMs) (n.startMs = start.ms), (n.start = start.hm);
      if (end.ms > n.endMs) (n.endMs = end.ms), (n.end = end.hm);
      nights.set(key, n);
      seeDay(wake);
      return;
    }
    let v = Number(raw2);
    if (!Number.isFinite(v)) return;
    const unit = attr(tag, 'unit') ?? '';
    const day = start.day;
    seeDay(day);
    if (kind === 'rhr') v > 20 && v < 200 && addMean('restingHr', day, v);
    else if (kind === 'hrv') v > 0 && v < 400 && addMean('hrvMs', day, v);
    else if (kind === 'steps') v >= 0 && addSrc('steps', day, src, v);
    else if (kind === 'kcal') {
      if (unit === 'kJ') v /= 4.184;
      if (v >= 0) addSrc('kcalActive', day, src, v);
    } else if (kind === 'vo2') v > 5 && v < 100 && setLast('vo2max', day, start.ms, v);
    else if (kind === 'weight') {
      if (unit === 'lb') v *= 0.45359237;
      if (unit === 'g') v /= 1000;
      if (v > 20 && v < 400) setLast('weightKg', day, start.ms, v);
    }
  }

  function days() {
    const rows = new Map();
    const row = (d) => rows.get(d) ?? (rows.set(d, { date: d }), rows.get(d));
    for (const [k, [sum, n]] of mean) {
      const [key, d] = k.split('|');
      row(d)[key] = Math.round(sum / n);
    }
    for (const [k, m] of perSrc) {
      const [key, d] = k.split('|');
      row(d)[key] = Math.round(Math.max(...m.values()));
    }
    for (const [k, o] of last) {
      const [key, d] = k.split('|');
      row(d)[key] = Math.round(o.v * 10) / 10;
    }
    const best = new Map();
    for (const n of nights.values()) if (!best.has(n.date) || n.asleepMin > best.get(n.date).asleepMin) best.set(n.date, n);
    for (const n of best.values()) {
      if (n.asleepMin < 30) continue;
      const inBed = n.asleepMin + n.awakeMin;
      row(n.date).sleep = { asleepMin: n.asleepMin, awakeMin: n.awakeMin, start: n.start, end: n.end, deepMin: n.deepMin || null, remMin: n.remMin || null, lightMin: n.lightMin || null, efficiency: inBed ? Math.round((n.asleepMin / inBed) * 100) : null };
    }
    return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  return { line, days, counts, range: () => (from ? { from, to } : null) };
}

/** What a preview says: per value how many days have it. */
export function summaryOf(rows) {
  const n = (f) => rows.filter(f).length;
  return {
    days: rows.length,
    restingHr: n((r) => r.restingHr != null),
    hrvMs: n((r) => r.hrvMs != null),
    steps: n((r) => r.steps != null),
    sleep: n((r) => r.sleep != null),
    kcalActive: n((r) => r.kcalActive != null),
    vo2max: n((r) => r.vo2max != null),
    weightKg: n((r) => r.weightKg != null),
  };
}

/** Feeds a byte stream (export.xml, maybe unpacked on the fly) line by line; onBytes(n) for progress. */
export async function feedStream(stream, collector, onBytes = null) {
  const reader = stream.getReader();
  const dec = new TextDecoder('utf-8');
  let rest = '';
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    const text = rest + dec.decode(value, { stream: true });
    const lines = text.split('\n');
    rest = lines.pop() ?? '';
    for (const l of lines) collector.line(l);
    onBytes?.(bytes);
  }
  rest += dec.decode();
  if (rest) collector.line(rest);
}

/** The export.xml inside Apple's zip (not export_cda.xml, not the workout routes). */
export const isExportXml = (name) => /(^|\/)export\.xml$/i.test(name);

/**
 * Writes the days (health.js saveDays, src 'apple') and returns what Undo needs: the rows of those days
 * as they were before ({ date, row|null }).
 */
export async function applyDays(db, rows, saveDays) {
  const dates = rows.map((r) => r.date);
  const before = await db.healthDays.bulkGet(dates);
  const changed = await saveDays(db, rows, { src: 'apple' });
  return { changed, before: dates.map((date, i) => ({ date, row: before[i] ?? null })) };
}

/** «Rückgängig»: every day back as it was (days that were not there are removed). */
export async function undoDays(db, before) {
  await db.transaction('rw', db.healthDays, async () => {
    const put = before.filter((b) => b.row).map((b) => b.row);
    const del = before.filter((b) => !b.row).map((b) => b.date);
    if (put.length) await db.healthDays.bulkPut(put);
    if (del.length) await db.healthDays.bulkDelete(del);
  });
}
