/**
 * «Beat your Ghost» (Noah 03.11.2026, Cockpit-Idee 4): race an earlier ride of your own. After the ride, not
 * live (the app keeps no second-by-second stream): this ride against an earlier one, side by side, with the
 * question «same power with less heart rate, or less drift?». Comparing two rides is only fair when they are
 * alike, so every pair carries its comparability: same route, km, Hm, temperature, wind (where Strava weather
 * is known; otherwise «not known»). Pure rules; the card is AnaGhost.svelte. Tested in tests/ghost.test.js.
 *
 * Observation only: a better number is not an order to ride harder.
 */
import { speed, sameRoute } from '../../training.js';

export const MAX_GHOSTS = 6;
/** Candidates: km within 25 % of this ride, Hm within 30 % (when both are known). */
export const KM_WIDE = 0.25;
export const HM_WIDE = 0.3;
/** «Good» match: km within 10 %, Hm within 15 % (or the same route). */
export const KM_GOOD = 0.1;
export const HM_GOOD = 0.15;
/** Power counts as «the same» within 5 %; watts per beat as «level» within 2 %. */
export const SAME_POWER = 0.05;
export const LEVEL_EFF = 0.02;
/** A weather flag from this difference on. */
export const TEMP_FLAG = 6;
export const WIND_FLAG = 10;

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const when = (a) => `${a.day} ${a.time ?? ''}`;
const pct = (a, b) => (a > 0 && Number.isFinite(b) ? Math.round(((b - a) / a) * 100) : null);
const tempOf = (a) => (Number.isFinite(a?.tempAvg) ? a.tempAvg : Number.isFinite(a?.wxRide?.t) ? a.wxRide.t : null);
const windOf = (a) => (Number.isFinite(a?.wxRide?.wind) ? a.wxRide.wind : null);
const hasPower = (a) => !!a?.wDevice && a.wAvg > 0;

/** How alike two rides are: { route, kmPct, hmPct, tempD, windD, level: 'good'|'fair' } or null when too different. */
export function alike(act, g) {
  const kmPct = pct(act.km, g.km);
  if (kmPct == null || Math.abs(kmPct) > KM_WIDE * 100) return null;
  const hmPct = act.hm > 0 && g.hm > 0 ? pct(act.hm, g.hm) : null;
  if (hmPct != null && Math.abs(hmPct) > HM_WIDE * 100) return null;
  const route = !!act.name?.trim() && sameRoute([g], act).list.length === 1;
  const good = route || (Math.abs(kmPct) <= KM_GOOD * 100 && (hmPct == null || Math.abs(hmPct) <= HM_GOOD * 100));
  const ta = tempOf(act);
  const tg = tempOf(g);
  const wa = windOf(act);
  const wg = windOf(g);
  return {
    route,
    kmPct,
    hmPct,
    tempD: ta != null && tg != null ? r1(tg - ta) : null,
    windD: wa != null && wg != null ? r1(wg - wa) : null,
    level: good ? 'good' : 'fair',
  };
}

/**
 * The earlier bike rides that could be the ghost, the most alike first (same route, then the smallest
 * difference in km and Hm, then the newest). Needs a heart rate on both; max MAX_GHOSTS.
 * → [{ act, alike }]
 */
export function ghostsOf(all, act, max = MAX_GHOSTS) {
  if (!act || act.kind !== 'bike' || !(act.km > 0) || !(act.hrAvg > 0)) return [];
  const list = [];
  for (const g of all ?? []) {
    if (!g || g.id === act.id || g.kind !== 'bike' || !(g.hrAvg > 0) || !(g.km > 0) || when(g) >= when(act)) continue;
    const a = alike(act, g);
    if (a) list.push({ act: g, alike: a, score: (a.route ? 0 : 1000) + Math.abs(a.kmPct) + Math.abs(a.hmPct ?? 0) / 2 });
  }
  return list
    .sort((x, y) => x.score - y.score || when(y.act).localeCompare(when(x.act)))
    .slice(0, max)
    .map(({ act: a, alike: al }) => ({ act: a, alike: al }));
}

/**
 * How much the heart rate (or the watts per beat) slid from the first to the second half. With power in both
 * halves: the fall of watts per beat in %, kind 'wpb' (more = the legs were less efficient later). Without:
 * the rise of the heart rate in %, kind 'hr'. null without both halves.
 */
export function driftOf(act, kind = null) {
  const h = act?.halves;
  if (!Array.isArray(h) || h.length !== 2 || !h.every((x) => x && x.hr > 0)) return null;
  const power = h.every((x) => x.w > 0);
  if (kind === 'wpb' && !power) return null;
  if (kind === 'wpb' || (kind == null && power)) {
    const a = h[0].w / h[0].hr;
    const b = h[1].w / h[1].hr;
    return { kind: 'wpb', pct: r1(((a - b) / a) * 100) };
  }
  return { kind: 'hr', pct: r1((h[1].hr / h[0].hr - 1) * 100) };
}

/**
 * This ride against the ghost.
 * → { power, rows: [{ key, me, ghost }], eff: { me, ghost, pct }, drift: { kind, me, ghost } | null,
 *     verdict: { key: 'samepower-less'|'samepower-more'|'ahead'|'behind'|'level', n? } }
 * Efficiency: watts per beat with power in both, else km/h per beat. null without a heart rate on both.
 */
export function compare(act, g) {
  if (!act || !g || !(act.hrAvg > 0) || !(g.hrAvg > 0)) return null;
  const power = hasPower(act) && hasPower(g);
  const kmh = (a) => speed(a);
  const rows = [];
  if (power) rows.push({ key: 'w', me: act.wAvg, ghost: g.wAvg });
  rows.push({ key: 'hr', me: act.hrAvg, ghost: g.hrAvg });
  const em = power ? act.wAvg / act.hrAvg : kmh(act) / act.hrAvg;
  const eg = power ? g.wAvg / g.hrAvg : kmh(g) / g.hrAvg;
  if (!(em > 0) || !(eg > 0)) return null;
  rows.push({ key: power ? 'wpb' : 'kmhb', me: r2(em), ghost: r2(eg) });
  if (kmh(act) != null && kmh(g) != null) rows.push({ key: 'kmh', me: kmh(act), ghost: kmh(g) });
  if (act.movingS > 0 && g.movingS > 0) rows.push({ key: 'time', me: act.movingS, ghost: g.movingS });
  const dm = driftOf(act);
  const dg = driftOf(g, dm?.kind ?? null);
  const drift = dm && dg && dm.kind === dg.kind ? { kind: dm.kind, me: dm.pct, ghost: dg.pct } : null;
  const effPct = Math.round((em / eg - 1) * 1000) / 10;
  const hrD = Math.round(act.hrAvg - g.hrAvg);
  let verdict;
  if (power && Math.abs(act.wAvg / g.wAvg - 1) <= SAME_POWER && Math.abs(hrD) >= 2) verdict = { key: hrD < 0 ? 'samepower-less' : 'samepower-more', n: Math.abs(hrD) };
  else if (Math.abs(effPct) < LEVEL_EFF * 100) verdict = { key: 'level' };
  else verdict = { key: effPct > 0 ? 'ahead' : 'behind', n: Math.round(Math.abs(effPct)) };
  return { power, rows, eff: { me: r2(em), ghost: r2(eg), pct: effPct }, drift, verdict };
}
