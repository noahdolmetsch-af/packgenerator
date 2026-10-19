/**
 * «Werte messen» Teil 2 (Noah 15.10.2026, W4–W6 «freigeben», answers «1a 2b 3a 4a 5a»): tyre pressure
 * and chain wear, measured and suggested. Pure, tested in tests/messen.test.js.
 *
 * - W4 «Druck berechnen»: a suggestion from the weight (you + bike + the luggage of the next trip on
 *   this bike), the tyre width, tubeless or tube and the ground. A rule of thumb, never a must: the
 *   bike's «Target pressure» stays what you set, «Use as target» takes the suggestion over.
 * - W5 «Druck erfassen»: front and rear as measured, before or after a ride or after pumping. Saved
 *   where Bike care saves it (the tyres' history, pressureF / pressureR), so the Bike pass, the
 *   Pick-up check and Bike care show it at once. 4a: a tyre that loses air over two weeks gets a hint.
 * - W6 «Kette messen»: the wear in %, saved as a check of the chain (quickcare.js quickLog 'wear'),
 *   with a forecast from the values since the last new chain. At the limit (0.5 %) the chain is
 *   «work needed», so the Workshop order says «replace the chain» by itself (3a).
 */
import { PART, logPart } from './care.js';
import { fitValue } from './bikespecs.js';

/* ---------- W4: the suggestion ---------- */

/** The grounds, with how much less pressure each wants than asphalt. */
export const GROUNDS = [
  { key: 'road', name: 'Asphalt', f: 1 },
  { key: 'gravel', name: 'Gravel|ground', f: 0.95 },
  { key: 'trail', name: 'Trail', f: 0.9 },
  { key: 'wet', name: 'Wet', f: 0.93 },
];
const GROUND = Object.fromEntries(GROUNDS.map((g) => [g.key, g]));
/** The share of the weight on the front wheel (the rear carries the rest). */
export const FRONT_SHARE = 0.45;
// p = K · kg per wheel / width^1.5: 28 mm, 48 kg on the wheel, asphalt, tube → about 5.4 bar.
const K = 16.7;
const TUBELESS = 0.95;

/**
 * A tyre width in mm from what is stored: «40», «40 mm», «700x40», «2.4» or «2.4"» (inch) → 40 / 61;
 * null when it is not a width.
 */
export function widthMm(v) {
  if (v == null || v === '') return null;
  const s = String(v).replace(',', '.').toLowerCase();
  const x = s.match(/x\s*(\d+(?:\.\d+)?)/);
  const n = Number((x ? x[1] : s.match(/\d+(?:\.\d+)?/)?.[0]) ?? NaN);
  if (!Number.isFinite(n) || n <= 0) return null;
  const mm = n < 5 ? n * 25.4 : n;
  return mm >= 18 && mm <= 130 ? Math.round(mm) : null;
}

/**
 * The suggested pressure in bar: { f, r } (one decimal), or null without a weight or a width.
 * weightKg: the whole weight on the bike; widthF / widthR in mm (the rear takes the front's when not
 * known); tubeless: true / false; ground: a GROUNDS key.
 */
export function suggestPressure({ weightKg, widthF, widthR = null, tubeless = false, ground = 'road' }) {
  const w = Number(weightKg);
  const wf = Number(widthF) || Number(widthR);
  const wr = Number(widthR) || Number(widthF);
  if (!(w > 20 && w < 300) || !wf || !wr) return null;
  const k = K * (tubeless ? TUBELESS : 1) * (GROUND[ground]?.f ?? 1);
  const bar = (kg, mm) => Math.min(8, Math.max(0.8, Math.round(((k * kg) / mm ** 1.5) * 10) / 10));
  return { f: bar(w * FRONT_SHARE, wf), r: bar(w * (1 - FRONT_SHARE), wr) };
}

/**
 * What the suggestion starts from, for one bike: { riderKg, bikeKg, luggageKg, weightKg, widthF, widthR,
 * tubeless, ground }. riderG: Ich › weight (settings riderWeightG); luggageG: the luggage of the next
 * trip on this bike (trips.js tripStats: gear, on me, bags), 0 without one; tyres: tyreSetup (workshop.js).
 * A missing part of the weight is null and counts as 0 in the sum.
 */
export function pressureStart(bike, { riderG = null, luggageG = null, tyres = null } = {}) {
  const kg = (g) => (typeof g === 'number' && g > 0 ? Math.round(g / 100) / 10 : null);
  const riderKg = kg(riderG);
  const bikeKg = kg(bike?.weightG);
  const luggageKg = kg(luggageG) ?? 0;
  const widthF = widthMm(fitValue(bike, 'tyreWidthF'));
  const widthR = widthMm(fitValue(bike, 'tyreWidthR')) ?? widthF;
  const tubeless = tyres ? tyres.front === 'tubeless' || tyres.rear === 'tubeless' : false;
  const ground = widthF && widthF >= 50 ? 'trail' : widthF && widthF >= 35 ? 'gravel' : 'road';
  const weightKg = riderKg == null ? null : Math.round((riderKg + (bikeKg ?? 0) + luggageKg) * 10) / 10;
  return { riderKg, bikeKg, luggageKg, weightKg, widthF, widthR, tubeless, ground };
}

/* ---------- W5: the pressure as measured ---------- */

/** When the pressure was measured. */
export const WHEN = [
  { key: 'before', name: 'before the ride' },
  { key: 'after', name: 'after the ride' },
  { key: 'pumped', name: 'after pumping' },
];

/**
 * W5: the pressure as measured, on the bike as stored → { changes: { parts }, entry }, or null without
 * a value. Written as Bike care writes it (a check of the tyres with pressureF / pressureR).
 */
export function logPressure(stored, { f = null, r = null, when = 'before', today }) {
  const ok = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 15;
  if (!ok(f) && !ok(r)) return null;
  const entry = { date: today, km: typeof stored.km === 'number' ? stored.km : null, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', when, ...(ok(f) ? { pressureF: f } : {}), ...(ok(r) ? { pressureR: r } : {}) };
  return { changes: { parts: logPart(stored.parts ?? [], 'tyres', entry) }, entry };
}

/** The pressures measured on a bike, oldest first: [{ date, f, r, when }]. */
export function pressures(bike) {
  const tyres = (bike?.parts ?? []).find((p) => p.key === 'tyres');
  return (tyres?.history ?? [])
    .filter((h) => h.date && (h.pressureF != null || h.pressureR != null))
    .map((h) => ({ date: h.date, f: h.pressureF ?? null, r: h.pressureR ?? null, when: h.when ?? null }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5);

/**
 * 4a: a tyre that loses air: the last values of one wheel go down, without pumping in between, over
 * at least 14 days and by at least 0.1 bar → { wheel: 'f' | 'r', perWeek (bar, one decimal), from, to },
 * the wheel that loses more; else null.
 */
export function pressureLoss(bike, { minDays = 14 } = {}) {
  const all = pressures(bike);
  const best = ['f', 'r']
    .map((w) => {
      const list = all.filter((p) => p[w] != null);
      if (list.length < 2) return null;
      let start = list.length - 1;
      // back from the newest value while it was higher or the same before, and no pumping came between
      while (start > 0 && list[start].when !== 'pumped' && list[start - 1][w] >= list[start][w]) start -= 1;
      const a = list[start];
      const b = list.at(-1);
      const span = days(a.date, b.date);
      const drop = Math.round((a[w] - b[w]) * 100) / 100;
      if (span < minDays || drop < 0.1) return null;
      return { wheel: w, perWeek: Math.max(0.1, Math.round(((drop / span) * 7) * 10) / 10), from: a.date, to: b.date };
    })
    .filter(Boolean)
    .sort((x, y) => y.perWeek - x.perWeek);
  return best[0] ?? null;
}

/* ---------- W6: the chain ---------- */

/** The quick values of the chain checker, in %. */
export const CHAIN_QUICK = [0.25, 0.5, 0.75, 1];

/**
 * The chain's measured values since its last replacement, oldest first: [{ date, km, value }].
 * bike: with the visits (withVisits), so a new chain from the bike shop starts the list anew.
 */
export function chainValues(bike) {
  const h = (bike?.parts ?? []).find((p) => p.key === 'chain')?.history ?? [];
  const sorted = [...h].filter((x) => x.date).sort((a, b) => a.date.localeCompare(b.date) || (a.km ?? 0) - (b.km ?? 0));
  const from = sorted.map((x) => x.action).lastIndexOf('replace');
  return sorted.slice(from + 1).filter((x) => x.action === 'check' && typeof x.value === 'number').map((x) => ({ date: x.date, km: typeof x.km === 'number' ? x.km : null, value: x.value }));
}

/**
 * The chain's state: { value, warnAt, limit, tone: 'ok' | 'warn' | 'worn', left (km to the limit, in
 * 50 km steps, from the last values; null when it cannot be told) }, or null without a value.
 */
export function chainState(bike) {
  const vals = chainValues(bike);
  const last = vals.at(-1);
  if (!last) return null;
  const part = (bike.parts ?? []).find((p) => p.key === 'chain');
  const limit = part?.limit ?? PART.chain.limit;
  const warnAt = PART.chain.warnAt;
  const tone = last.value >= limit ? 'worn' : last.value >= warnAt ? 'warn' : 'ok';
  let left = null;
  const withKm = vals.filter((v) => v.km != null);
  if (tone !== 'worn' && withKm.length >= 2) {
    const a = withKm[0];
    const b = withKm.at(-1);
    const rate = b.km > a.km ? (b.value - a.value) / (b.km - a.km) : 0;
    if (rate > 0) left = Math.max(0, Math.round((limit - b.value) / rate / 50) * 50);
  }
  return { value: last.value, warnAt, limit, tone, left };
}
