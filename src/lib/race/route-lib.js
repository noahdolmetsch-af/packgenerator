/**
 * Paket U «Rennen» › Entlang der Strecke: small pure helpers for AlongRoute.svelte (tested in
 * tests/race-route.test.js). Labels are English keys for t().
 */
import { openAt, wxAt } from './outside.js';
import { rideHoursBetween, addDay, dayOfMs } from './race.js';
import { sunTimes } from '../blockplan.js';

/** The weather series of the sample point nearest to km. wx: { points: [{ km }], series: [] } */
export function seriesNear(wx, km) {
  const pts = wx?.points ?? [];
  if (!pts.length) return null;
  let i = 0;
  pts.forEach((p, k) => {
    if (Math.abs(p.km - km) < Math.abs(pts[i].km - km)) i = k;
  });
  return wx.series?.[i] ?? null;
}

/** The weather at km for the moment you are expected there (null without plan or outside the forecast). */
export const wxNear = (wx, km, ms) => (ms == null ? null : wxAt(seriesNear(wx, km), ms));

/** A place's opening state when you get there → { key, vars, tone: 'ok'|'warn'|'' } for t(). */
export function openLabel(hours, ms) {
  if (ms == null || !Number.isFinite(ms)) return { key: hours ? 'Hours: {h}' : 'Hours unknown', vars: { h: hours }, tone: '' };
  const s = openAt(hours, new Date(ms));
  if (s.open == null) return { key: 'Hours unknown', vars: {}, tone: '' };
  if (s.open) return s.closes ? { key: 'Open, closes {at}', vars: { at: s.closes }, tone: 'ok' } : { key: 'Open|now', vars: {}, tone: 'ok' };
  return s.opens ? { key: 'Closed then, opens {at}', vars: { at: s.opens }, tone: 'warn' } : { key: 'Closed then', vars: {}, tone: 'warn' };
}

/** Riding hours between two km of the plan (sleep left out), or null without a plan. */
export const rideHoursAcross = (plan, fromKm, toKm) => (plan ? rideHoursBetween(plan.blocks, plan.etaOf(fromKm), plan.etaOf(toKm)) : null);

/**
 * Where you sleep: the nights of the plan (nightRows), or without sleep blocks the end of each plan day.
 * → [{ key, i, km, from, to, kind }]
 */
export function sleepStops(nights = [], plan = null) {
  if (nights.length) return nights.map((n) => ({ key: `n${n.n}`, i: n.i, km: n.km, from: n.from, to: n.to, kind: n.kind }));
  return (plan?.days ?? []).slice(0, -1).map((d, i) => ({ key: `d${i}`, i, km: Math.round(d.to), from: null, to: null, kind: null }));
}

/** 9 · The night's low against the comfort limit of the bag → 'warm' | 'layer' | 'cold' | null. */
export function comfortOf(low, bagC) {
  if (!Number.isFinite(low) || !Number.isFinite(bagC)) return null;
  if (low >= bagC) return 'warm';
  if (low >= bagC - 4) return 'layer';
  return 'cold';
}

/**
 * 30 · The highest UV per plan day: the daily maximum at the sample nearest the day's middle, else the
 * highest hourly value while you ride that day. → [{ n, day, uv }] (uv null when unknown)
 */
export function uvByDay(plan, wx) {
  if (!plan) return [];
  return plan.days.map((d, i) => {
    const s = seriesNear(wx, (d.from + d.to) / 2);
    let uv = null;
    const daily = s?.daily;
    if (daily?.time?.length) {
      const k = daily.time.findIndex((x) => new Date(x * 1000).toISOString().slice(0, 10) === d.day);
      if (k >= 0 && Number.isFinite(daily.uv_index_max?.[k])) uv = daily.uv_index_max[k];
    }
    if (uv == null && s?.hourly?.time) {
      const a = plan.etaOf(d.from);
      const b = plan.etaOf(d.to);
      s.hourly.time.forEach((x, k) => {
        const v = s.hourly.uv_index?.[k];
        if (x * 1000 >= a && x * 1000 <= b && Number.isFinite(v)) uv = uv == null ? v : Math.max(uv, v);
      });
    }
    return { n: i + 1, day: d.day, uv: uv == null ? null : Math.round(uv * 10) / 10 };
  });
}

/** 12 · The plan days that are a Sunday, with the shops in that day's km. → [{ n, day, fromKm, toKm, shops }] */
export function sundayDays(plan, pois = []) {
  if (!plan) return [];
  return plan.days
    .map((d, i) => ({ n: i + 1, day: d.day, fromKm: Math.round(d.from), toKm: Math.round(d.to) }))
    .filter((d) => new Date(`${d.day}T12:00:00`).getDay() === 0 && d.toKm > d.fromKm)
    .map((d) => ({ ...d, shops: pois.filter((p) => (p.kind === 'shop' || p.kind === 'fuel') && p.km >= d.fromKm && p.km <= d.toKm).length }));
}

/** dark(ms): before sunrise or after sunset at a place (the sun of that local day). */
export function darkAt(lat, lon) {
  return (ms) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    const s = sunTimes(dayOfMs(ms), lat, lon);
    return s ? ms < s.rise || ms > s.set : false;
  };
}

/** The forecast reaches the start day from this day on (16 days ahead), or null when it does already. */
export function forecastFrom(startDay, today) {
  if (!/^\d{4}-\d\d-\d\d$/.test(startDay ?? '')) return null;
  const from = addDay(startDay, -15);
  return from > today ? from : null;
}
