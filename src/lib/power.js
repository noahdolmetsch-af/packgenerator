/**
 * Strombudget pro Tour und Powerbank-Rechner (Noah 19.10.2026 16:53 «2a», Ideen-Sammlung 220/244,
 * built on #346 Ladedaten of Paket H). Pure functions, tested in tests/strombudget.test.js.
 *
 * The question: do my devices last the trip, which power bank do I take, and which charger?
 * The rule (kept simple on purpose, every number is a rough value the user can change):
 * 1. Every device on the trip (charge.js isChargeable) uses energy per day:
 *    battery (Wh) × hours in use per day ÷ hours one charge lasts.
 *    Lights burn in the dark hours, watches and trackers all day, the rest while riding.
 * 2. Nights with a socket fill everything up again. The longest stretch of days without a socket
 *    (nights with a socket spread evenly) decides: each device starts full, the rest comes from the
 *    power bank.
 * 3. A power bank gives about 75 % of its printed capacity to a device, in the cold (below 5 °C)
 *    about 10 % less.
 * Missing values come from a short list of typical devices and are marked «estimated».
 */
import { isChargeable } from './charge.js';
import { nameOf } from './i18n.svelte.js';

/** Volts of a lithium cell: mAh × 3.7 ÷ 1000 = Wh. */
export const CELL_V = 3.7;
/** What a power bank really gives to a device. */
export const BANK_USABLE = 0.75;
/** Less in the cold (below COLD_C). */
export const COLD_FACTOR = 0.9;
export const COLD_C = 5;
/** A night of charging: more than this many hours is too long for one socket. */
export const NIGHT_H = 8;

/** Typical devices: words (lower case), battery Wh, hours one charge lasts, when it is in use, hours to charge. */
export const TYPICAL = [
  { key: 'phone', words: ['phone', 'handy', 'smartphone', 'natel', 'iphone', 'galaxy'], wh: 19, runH: 8, use: 'ride', chargeH: 1.5 },
  { key: 'computer', words: ['bike computer', 'velocomputer', 'radcomputer', 'edge', 'wahoo', 'garmin', 'navi'], wh: 7, runH: 30, use: 'ride', chargeH: 2.5 },
  { key: 'front', words: ['front light', 'frontlicht', 'frontlampe', 'scheinwerfer', 'lampe vorne', 'licht vorne'], wh: 12, runH: 3, use: 'night', chargeH: 3 },
  { key: 'rear', words: ['rear light', 'rücklicht', 'ruecklicht', 'licht hinten'], wh: 3, runH: 8, use: 'ride', chargeH: 2 },
  { key: 'headlamp', words: ['headlamp', 'stirnlampe', 'kopflampe'], wh: 2, runH: 5, use: 'night', chargeH: 1.5 },
  { key: 'earbuds', words: ['earbuds', 'kopfhörer', 'kopfhoerer', 'airpods'], wh: 2, runH: 6, use: 'little', chargeH: 1 },
  { key: 'watch', words: ['watch', 'uhr', 'fitbit', 'tracker'], wh: 1, runH: 120, use: 'day', chargeH: 2 },
  { key: 'camera', words: ['camera', 'kamera', 'gopro', 'insta360'], wh: 5, runH: 2, use: 'little', chargeH: 1.5 },
  { key: 'sat', words: ['inreach', 'satellite', 'satelliten', 'zoleo'], wh: 4, runH: 100, use: 'day', chargeH: 3 },
  { key: 'shifting', words: ['di2', 'axs'], wh: 2, runH: 100, use: 'ride', chargeH: 1.5 },
];
/** A device the list does not know; a light the list does not know. */
const ANY_DEVICE = { key: 'device', wh: 5, runH: 10, use: 'ride', chargeH: 2 };
const ANY_LIGHT = { key: 'light', wh: 6, runH: 4, use: 'night', chargeH: 2.5 };

/** Power banks to buy or borrow when you have none that is big enough. */
export const BANK_SIZES = [
  { mah: 10000, grams: 180 },
  { mah: 20000, grams: 300 },
];

const words = (item) => ` ${[item?.name, item?.nameDe, item?.model].filter(Boolean).join(' ').toLowerCase()} `;
const BANK = /power ?bank|akku ?pack|battery ?pack/;
const CHARGER = /charger|ladeger(ä|ae)t|netzteil|stecker|wall ?plug|\blader\b|usb[- ]?c? ?adapter/;
const CABLE = /cable|kabel/;
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const pos = (v) => (num(v) != null && Number(v) > 0 ? Number(v) : null);

/** What an item is for the power budget: 'bank', 'charger', 'device' or null. */
export function powerRole(item) {
  if (!item || item.ownership === 'gone') return null;
  const w = words(item);
  if (BANK.test(w)) return 'bank';
  if (CABLE.test(w)) return null; // also «Ladekabel», which charge.js still counts
  if (CHARGER.test(w)) return 'charger';
  return isChargeable(item) ? 'device' : null;
}

/** The typical values for a device by its name (and category for lights). */
export function typicalOf(item) {
  const w = words(item);
  return TYPICAL.find((d) => d.words.some((x) => w.includes(x))) ?? (item?.category === 'light' ? ANY_LIGHT : ANY_DEVICE);
}

/** The mAh in a name like «Powerbank 20000», «20'000 mAh» or «NB10000», «20k»; null if none. */
export function mahFromName(item) {
  const w = words(item).replace(/['’]/g, '');
  const k = w.match(/\b(5|10|13|15|20|25|26|30)\s?k\b/);
  if (k) return Number(k[1]) * 1000;
  const m = w.match(/(\d{4,5})\s?(mah)?\b/);
  return m && Number(m[1]) >= 2000 && Number(m[1]) <= 50000 ? Number(m[1]) : null;
}

/** mAh → Wh (rounded to 0.1). */
export const whOf = (mah) => Math.round(((mah * CELL_V) / 1000) * 10) / 10;

/**
 * The battery of an item: { mah, wh, guessed }. Own value first (item.mah), then the name
 * (power banks), then the typical device. A bank without any hint counts as 10'000 mAh.
 */
export function batteryOf(item) {
  const own = pos(item?.mah);
  if (own) return { mah: own, wh: whOf(own), guessed: false };
  if (powerRole(item) === 'bank') {
    const named = mahFromName(item);
    if (named) return { mah: named, wh: whOf(named), guessed: false };
    return { mah: 10000, wh: whOf(10000), guessed: true };
  }
  const typ = typicalOf(item);
  return { mah: Math.round((typ.wh * 1000) / CELL_V), wh: typ.wh, guessed: true };
}

/** How many sockets a charger or power bank has: own value, else the name («3-fach», «2 port»), else 1. */
export function portsOf(item) {
  const own = pos(item?.ports);
  if (own) return Math.round(own);
  const m = words(item).match(/(\d)\s?(-?fach|x|port|ports|anschl)/);
  return m ? Math.max(1, Number(m[1])) : 1;
}

/** Hours of use per day: lights in the dark hours, watches all day, earbuds and cameras about one hour. */
export function hoursInUse(use, { rideH = 6, nightH = 1 } = {}) {
  if (use === 'night') return nightH;
  if (use === 'day') return 24;
  if (use === 'little') return 1;
  return rideH;
}

/**
 * One device's day: { item, qty, wh, runH, use, hours, daily, guessed }.
 * daily = Wh per day (can be more than the battery: then it needs a top-up on the way).
 */
export function deviceDay(item, qty = 1, opts = {}) {
  const typ = typicalOf(item);
  const bat = batteryOf(item);
  const runH = pos(item?.runH) ?? typ.runH;
  const hours = hoursInUse(typ.use, opts);
  const daily = Math.round(((bat.wh * hours) / runH) * 10) / 10;
  return { item, qty: Math.max(1, Number(qty) || 1), wh: bat.wh, runH, use: typ.use, hours, daily, guessed: bat.guessed || pos(item?.runH) == null };
}

/** Hours to charge an item: own value, else typical (a bank: 3 h per 10'000 mAh). */
export function chargeHoursOf(item) {
  const own = pos(item?.chargeH);
  if (own) return own;
  if (powerRole(item) === 'bank') return Math.round((batteryOf(item).mah / 10000) * 3 * 10) / 10;
  return typicalOf(item).chargeH;
}

/**
 * The trip's inputs: { days, socketNights, rideH, nightH, cold }. Saved values (trip.power) win;
 * else nights in a lodging count as nights with a socket, the riding time comes from Planen
 * (facts.hours, situation.js tripFacts), and one dark hour a day.
 */
export function powerInputs(trip, facts = {}) {
  const days = Math.max(1, Number(trip?.days) || Number(facts.days) || 1);
  const saved = trip?.power ?? {};
  const nights = days - 1;
  const socketNights = num(saved.socketNights) ?? (trip?.overnight === 'outdoor' ? 0 : nights);
  return {
    days,
    socketNights: Math.max(0, Math.min(nights, socketNights)),
    rideH: pos(saved.rideH) ?? pos(facts.hours) ?? 6,
    nightH: num(saved.nightH) ?? 1,
    cold: facts.minC != null && facts.minC < COLD_C,
  };
}

/** The longest stretch of days without a socket, with the socket nights spread evenly. */
export const stretchOf = (days, socketNights) => Math.max(1, Math.ceil(days / (Math.max(0, socketNights) + 1)));

/** What a power bank gives to devices (Wh). */
export const usableWh = (bank, cold = false) => Math.round(batteryOf(bank).wh * BANK_USABLE * (cold ? COLD_FACTOR : 1) * 10) / 10;

const gramsOf = (item) => pos(item?.weightG) ?? Math.round((batteryOf(item).mah / 10000) * 180);

/**
 * The power bank to take: { pick: [items], usable, enough, size } from the own banks (lightest
 * single that is enough, else the lightest pair, else all of them); size = a bank to buy or borrow
 * ({ mah, grams, count }) when the own ones are not enough or there are none.
 */
export function pickBanks(needWh, banks = [], cold = false) {
  const need = Math.max(0, needWh);
  if (need <= 0) return { pick: [], usable: 0, enough: true, size: null };
  const own = banks.map((b) => ({ b, u: usableWh(b, cold), g: gramsOf(b) }));
  const single = own.filter((x) => x.u >= need).sort((a, c) => a.g - c.g)[0];
  if (single) return { pick: [single.b], usable: single.u, enough: true, size: null };
  let pair = null;
  for (let i = 0; i < own.length; i++)
    for (let j = i + 1; j < own.length; j++) {
      const u = own[i].u + own[j].u;
      const g = own[i].g + own[j].g;
      if (u >= need && (!pair || g < pair.g)) pair = { pick: [own[i].b, own[j].b], u, g };
    }
  if (pair) return { pick: pair.pick, usable: Math.round(pair.u * 10) / 10, enough: true, size: null };
  const all = own.reduce((s, x) => s + x.u, 0);
  const rest = need - all;
  return { pick: own.map((x) => x.b), usable: Math.round(all * 10) / 10, enough: false, size: bankSize(rest, cold) };
}

/** A bank size to buy or borrow for the missing Wh: the smallest single that is enough, else n × the biggest. */
export function bankSize(needWh, cold = false) {
  const give = (mah) => whOf(mah) * BANK_USABLE * (cold ? COLD_FACTOR : 1);
  const one = BANK_SIZES.find((s) => give(s.mah) >= needWh);
  if (one) return { ...one, count: 1 };
  const big = BANK_SIZES[BANK_SIZES.length - 1];
  return { ...big, count: Math.ceil(needWh / give(big.mah)) };
}

/**
 * The charger for the nights with a socket: { pick, ports, n, hours, tooLong } or null (no socket night).
 * n: devices and banks to charge; hours: the charging time one after the other per socket.
 * pick: the lightest own charger with sockets for all of them, else the one with the most sockets.
 */
export function pickCharger(toCharge = [], chargers = [], socketNights = 0) {
  if (!socketNights || !toCharge.length) return null;
  const n = toCharge.length;
  const own = chargers.map((c) => ({ c, p: portsOf(c), g: pos(c.weightG) ?? 999 }));
  const fit = own.filter((x) => x.p >= Math.min(n, 3)).sort((a, b) => a.g - b.g)[0];
  const best = fit ?? own.sort((a, b) => b.p - a.p || a.g - b.g)[0] ?? null;
  const ports = best ? best.p : 1;
  const total = toCharge.reduce((s, it) => s + chargeHoursOf(it), 0);
  const hours = Math.round((total / Math.min(ports, n)) * 10) / 10;
  return { pick: best?.c ?? null, ports, n, hours, tooLong: hours > NIGHT_H };
}

/**
 * The whole budget for a list of devices [{ item, qty }] and the own gear:
 * { inputs, stretch, devices: [deviceDay + fromBank], dailyWh, needWh, banks: pickBanks, charger: pickCharger,
 *   onTrip: { banks: [ids on the trip] } }.
 * gear: all items (own power banks and chargers come from here).
 */
export function powerBudget(devices = [], gear = [], inputs = {}) {
  const inp = { days: 1, socketNights: 0, rideH: 6, nightH: 1, cold: false, ...inputs };
  const stretch = stretchOf(inp.days, inp.socketNights);
  const rows = devices
    .filter((d) => d?.item && powerRole(d.item) === 'device')
    .map((d) => {
      const day = deviceDay(d.item, d.qty, inp);
      const fromBank = Math.max(0, Math.round((day.daily * stretch - day.wh) * day.qty * 10) / 10);
      return { ...day, fromBank };
    })
    .sort((a, b) => b.daily * b.qty - a.daily * a.qty || nameOf(a.item).localeCompare(nameOf(b.item)));
  const dailyWh = Math.round(rows.reduce((s, r) => s + r.daily * r.qty, 0) * 10) / 10;
  const needWh = Math.round(rows.reduce((s, r) => s + r.fromBank, 0) * 10) / 10;
  const own = gear.filter((i) => i.ownership !== 'gone' && i.ownership !== 'wishlist');
  const banks = pickBanks(needWh, own.filter((i) => powerRole(i) === 'bank'), inp.cold);
  const charger = pickCharger([...rows.map((r) => r.item), ...banks.pick], own.filter((i) => powerRole(i) === 'charger'), inp.socketNights);
  return { inputs: inp, stretch, devices: rows, dailyWh, needWh, banks, charger };
}

/** The devices of a trip: [{ item, qty }] from its entries (devices only, no banks or chargers). */
export function tripDevices(trip, items = []) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const seen = new Set();
  const out = [];
  for (const e of trip?.entries ?? []) {
    const it = byId.get(e.itemId);
    if (!it || seen.has(it.id) || powerRole(it) !== 'device') continue;
    seen.add(it.id);
    out.push({ item: it, qty: e.qty || 1 });
  }
  return out;
}

/** The ids of the picked banks and the charger that are not on the trip yet. */
export function missingOnTrip(trip, budget) {
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  return [...budget.banks.pick, budget.charger?.pick].filter(Boolean).map((i) => i.id).filter((id) => !on.has(id));
}
