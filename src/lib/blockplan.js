/**
 * Ride day per block (v0.19.5, answer 4b): for every block of the ride, all at once,
 * - clothing: the cold and rain layers on the trip against the block's weather (what goes on,
 *   what comes off, and in which bag it is);
 * - food and drink: pieces per block from "one per N hours", water against the bottles, where to
 *   refill;
 * - light: when the sun sets and rises (computed offline), from which km the light goes on.
 * Pure functions, easy to test.
 */
import { addHours, stage, stageCount, isNonstop } from './ride.js';
import { rainOf, coldLayer, isNightEyewear } from './layers.js';
import { nameOf } from './i18n.svelte.js';

/** Assumption, not measured: half a litre per riding hour, a quarter more from 25 °C. */
export const DRINK_L_PER_H = 0.5;
export const HOT_C = 25;
export const HOT_EXTRA_L = 0.25;

const RAD = Math.PI / 180;
const ms = (at) => new Date(`${at}:00Z`).getTime();
const hoursBetween = (a, b) => (ms(b) - ms(a)) / 36e5;

/**
 * Sunrise and sunset (sunrise equation, about ±2 minutes in the Alps) for a date at a place.
 * Returns { rise, set } as UTC milliseconds, or null on a polar day or night.
 */
export function sunTimes(date, lat, lon) {
  const jNoon = new Date(`${date}T12:00:00Z`).getTime() / 864e5 + 2440587.5;
  const n = Math.round(jNoon - 2451545 + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const L = (M + C + 180 + 102.9372) % 360;
  const jTransit = 2451545 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
  const sinD = Math.sin(L * RAD) * Math.sin(23.4397 * RAD);
  const cosD = Math.cos(Math.asin(sinD));
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinD) / (Math.cos(lat * RAD) * cosD);
  if (cosW < -1 || cosW > 1) return null;
  const w = Math.acos(cosW) / RAD;
  const toMs = (j) => Math.round((j - 2440587.5) * 864e5);
  return { rise: toMs(jTransit - w / 360), set: toMs(jTransit + w / 360) };
}

/** Minutes the local time is ahead of UTC on a date. The device's time zone (Noah rides at home). */
export const offsetFor = (date) => -new Date(`${date}T12:00:00`).getTimezoneOffset();

/** UTC milliseconds as local "YYYY-MM-DDTHH:MM". */
const local = (t, offsetMin) => new Date(t + offsetMin * 6e4).toISOString().slice(0, 16);

/** The nights as local times { from: sunset, to: next sunrise }, from the evening before the start to the end. */
export function darkTimes(startAt, endAt, place, offsetOf = offsetFor) {
  if (!place || !startAt || !endAt) return [];
  const next = (d) => addHours(`${d}T00:00`, 24).slice(0, 10);
  const out = [];
  for (let d = addHours(`${startAt.slice(0, 10)}T00:00`, -24).slice(0, 10); d <= endAt.slice(0, 10); d = next(d)) {
    const a = sunTimes(d, place.lat, place.lon);
    const b = sunTimes(next(d), place.lat, place.lon);
    if (a && b) out.push({ from: local(a.set, offsetOf(d)), to: local(b.rise, offsetOf(next(d))) });
  }
  return out;
}

/**
 * v0.66.0 «Bausteine neu» (Noah 7a): does the ride go into the dark, with or without a night? Each
 * stage from its start (trip.rideStart, else 08:00) for its riding hours (trip.hours or the route),
 * against sunset and sunrise at the place (darkTimes). Riding hours that are only assumed do not
 * count. Without a place only a nonstop ride (through the night) counts as dark.
 */
export function ridesIntoDark(trip, place, offsetOf = offsetFor) {
  if (!trip?.startDate) return false;
  for (let d = 0; d < stageCount(trip); d++) {
    const st = stage(trip, d);
    if (!st.startAt || !st.endAt || st.hoursGuess) continue;
    if (!place) {
      if (isNonstop(trip)) return true;
      continue;
    }
    if (darkTimes(st.startAt, st.endAt, place, offsetOf).some((n) => n.to > st.startAt && n.from < st.endAt)) return true;
  }
  return false;
}

/** Where on the block a time is, in km. */
const kmAt = (b, at) => b.kmFrom == null || b.kmTo == null ? null : Math.round(b.kmFrom + ((b.kmTo - b.kmFrom) * hoursBetween(b.startAt, at)) / Math.max(1e-6, hoursBetween(b.startAt, b.endAt)));

/**
 * The plan per block. rows: the blocks (ride.js blocks()); items: the trip's items as
 * [{ item, qty, place }]; wxOf(block): the weather hours of the block ([] when none);
 * place: { lat, lon } for the sun; tripWx: trip.wx as fallback when no hourly weather is there.
 * Returns { rows: [block plan], capL, rate, lights: [{ name, place }] }.
 */
export function blockPlan(rows, items, { wxOf = () => [], place = null, tripWx = null, offsetOf = offsetFor } = {}) {
  const layers = items.filter(({ item }) => typeof item.coldBelow === 'number' || rainOf(item) || isNightEyewear(item));
  const food = items.filter(({ item }) => item.perHours && !item.waterL);
  const capL = items.reduce((t, { item, qty }) => t + (item.waterL || 0) * (qty || 1), 0);
  const lights = items.filter(({ item }) => item.category === 'light').map(({ item, place: p }) => ({ name: nameOf(item), place: p }));
  const nights = rows.length ? darkTimes(rows[0].startAt, rows.at(-1).endAt, place, offsetOf) : [];
  let wearing = new Set();
  let cumH = 0;
  let tank = capL;
  const qtyOf = Object.fromEntries(food.map(({ item, qty }) => [item.id, qty || 1]));
  const left = { ...qtyOf };
  const rideH = rows.filter((b) => !b.rest).reduce((t, b) => t + hoursBetween(b.startAt, b.endAt), 0);
  const need = Object.fromEntries(food.map(({ item }) => [item.id, Math.floor(rideH / item.perHours + 1e-9)]));
  const out = rows.map((b) => {
    const hrs = wxOf(b) ?? [];
    const temps = hrs.map((x) => x.temp).filter((v) => v != null);
    const fromTrip = !temps.length && typeof tripWx?.min === 'number';
    const temp = temps.length ? { lo: Math.round(Math.min(...temps)), hi: Math.round(Math.max(...temps)) } : fromTrip ? { lo: tripWx.min, hi: tripWx.max ?? tripWx.min } : null;
    const wet = hrs.length ? hrs.some((x) => (x.rainMm ?? 0) >= 0.5 || (x.rainPct ?? 0) >= 50) : tripWx?.rain === 'rain' || tripWx?.rain === 'showers';
    const plan = { ...b, temp, wet, wxFrom: temps.length ? 'hours' : fromTrip ? 'trip' : null, wear: [], on: [], off: [], food: [], drinkL: 0, refillKm: [], refillAt: [], light: null };

    // Clothing: a layer is worn when the block gets colder than its limit, a rain layer when it is wet.
    // v0.46.1: rain gear only when it is wet (also with a cold limit); glasses for the dark only
    // in the rain or when the block is dark (a sunset, a sunrise or the whole block at night).
    const dark = nights.some((n) => n.to > b.startAt && n.from < b.endAt);
    if (temp || hrs.length || tripWx || dark) {
      const now = layers.filter(({ item }) => (coldLayer(item) && temp && temp.lo < item.coldBelow) || (rainOf(item) === 'yes' && wet) || (isNightEyewear(item) && dark));
      const ids = new Set(now.map(({ item }) => item.id));
      plan.wear = now.map(({ item, place: p }) => ({ id: item.id, name: nameOf(item), place: p }));
      if (!b.rest) {
        plan.on = plan.wear.filter((w) => !wearing.has(w.id));
        plan.off = layers.filter(({ item }) => wearing.has(item.id) && !ids.has(item.id)).map(({ item, place: p }) => ({ id: item.id, name: nameOf(item), place: p }));
        wearing = ids;
      }
    }

    // Food and drink: only riding hours count.
    if (!b.rest) {
      const h = hoursBetween(b.startAt, b.endAt);
      for (const { item, place: p } of food) {
        const k = Math.floor((cumH + h) / item.perHours + 1e-9) - Math.floor(cumH / item.perHours + 1e-9);
        if (!k) continue;
        // Said once, in the block where it runs out: how many to buy on the way for the whole ride.
        const runsOut = left[item.id] >= 0 && left[item.id] < k;
        left[item.id] -= k;
        plan.food.push({ id: item.id, name: nameOf(item), n: k, place: p, short: runsOut ? need[item.id] - (qtyOf[item.id] ?? 1) : 0 });
      }
      const rate = DRINK_L_PER_H + (temp && temp.hi >= HOT_C ? HOT_EXTRA_L : 0);
      plan.drinkL = Math.round(h * rate * 10) / 10;
      if (capL > 0) {
        // Drink through the block; each time the bottles are empty, refill (at that km).
        let need = h * rate;
        let at = 0;
        while (need > tank + 1e-9) {
          at += tank / rate;
          need -= tank;
          // v0.30.1: without a route (no km) the refill is said in time: refillAt ("HH:MM").
          const when = addHours(b.startAt, at);
          const km = kmAt(b, when);
          if (km == null) plan.refillAt.push(when.slice(11));
          else plan.refillKm.push(km);
          tank = capL;
        }
        tank -= need;
      }
      cumH += h;
    }

    // Light: the sun sets in the block, or the whole block is dark, or the sun rises in it.
    for (const night of nights) {
      if (night.to <= b.startAt || night.from >= b.endAt) continue;
      if (night.from > b.startAt) plan.light = { kind: 'on', at: night.from.slice(11), km: kmAt(b, night.from) };
      else if (night.to < b.endAt) plan.light = { kind: 'off', at: night.to.slice(11), km: kmAt(b, night.to) };
      else plan.light = { kind: 'dark', at: null, km: null };
      break;
    }
    return plan;
  });
  return { rows: out, capL, rate: DRINK_L_PER_H, lights };
}

/**
 * v0.34.0 (L8, Noah a): the evening on a trip of several days. Day 1 used to end after the last
 * ride block; now every day except the last gets an evening block with four things, at one glance:
 * - overnight: where you sleep (trip.overnight 'lodging' | 'outdoor', else null = not set);
 * - charge: the devices to charge tonight (charge.js chargeList, ticks in trip.chargeNight[date]);
 * - layOut: the clothes for the first block of tomorrow (the block plan of tomorrow's first block:
 *   its layers, else the every-ride clothes), with the bag they are in;
 * - morning: tomorrow's first block, its time and weather (hourly forecast, else the trip weather).
 * No evening on the last day, on a nonstop ride (one stage) or on a day ride.
 */
export const hasEvening = (days, day) => days > 1 && day >= 0 && day < days - 1;

/**
 * days: the number of stages (ride.js stageCount); day: today's index (0-based);
 * date: tonight's date; nextDate: tomorrow's date; overnight: trip.overnight;
 * first: tomorrow's first block from blockPlan (or null); charge: chargeList(trip, items).
 * Returns null when the day has no evening, else { date, nextDate, overnight, charge, layOut,
 * everyRide, morning: { from, to, temp, wet, wxFrom } | null }.
 */
export function eveningPlan({ days, day, date = null, nextDate = null, overnight = null, first = null, charge = [] }) {
  if (!hasEvening(days, day)) return null;
  const layOut = first ? first.wear.map((w) => ({ id: w.id, name: w.name, place: w.place })) : [];
  return {
    date,
    nextDate,
    overnight: overnight === 'lodging' || overnight === 'outdoor' ? overnight : null,
    charge,
    layOut,
    // Tomorrow is known but no layer is needed: the clothes of every ride (the weather says why).
    everyRide: !!first && !layOut.length,
    morning: first ? { from: first.from, to: first.to, temp: first.temp, wet: first.wet, wxFrom: first.wxFrom } : null,
  };
}
