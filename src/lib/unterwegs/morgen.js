/**
 * Paket 4 «Bereit für morgen?» (Noah 19.10.2026 «3a», idea of 13.10.): the evening before a tour, a few
 * hints from the trip weather, the packing list, parts due on the bike and the charging. These rules
 * are free and work offline; the KI helper (when it is set up and switched on) can add its own hints.
 * Pure functions, tested in tests/haus-hueter-morgen.test.js.
 */
export const COLD_MORNING = 5;
export const HOT_DAY = 28;

/** The day after a YYYY-MM-DD day. */
export function nextDay(day) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
/** Does the trip start tomorrow? */
export const startsTomorrow = (trip, today) => typeof trip?.startDate === 'string' && trip.startDate.slice(0, 10) === nextDay(today);

/**
 * The hints: [{ key, kind, text, vars }] (text: an English key for t()).
 * wx: the trip weather { min, max, rain }; open: names not packed yet; due: names of parts due.
 */
export function eveningHints({ wx = null, open = [], due = [] } = {}) {
  const out = [];
  if (Number.isFinite(wx?.min) && wx.min <= COLD_MORNING) out.push({ key: 'cold', kind: 'weather', text: 'Cold morning, {n} °C: gloves and a warm layer on top.', vars: { n: Math.round(wx.min) } });
  if (wx?.rain === 'rain' || wx?.rain === 'showers') out.push({ key: 'rain', kind: 'weather', text: 'Rain is possible: the rain jacket on top of the bag.' });
  if (Number.isFinite(wx?.max) && wx.max >= HOT_DAY) out.push({ key: 'hot', kind: 'weather', text: 'Hot day, up to {n} °C: fill an extra bottle.', vars: { n: Math.round(wx.max) } });
  if (open.length) out.push({ key: 'pack', kind: 'pack', text: open.length === 1 ? 'Still to pack: {names}.' : 'Still {n} things to pack, e.g. {names}.', vars: { n: open.length, names: open.slice(0, 3).join(', ') } });
  if (due.length) out.push({ key: 'bike', kind: 'bike', text: 'Due on the bike: {parts}. Have a look tonight.', vars: { parts: due.slice(0, 3).join(', ') } });
  out.push({ key: 'charge', kind: 'rest', text: 'Charge lights, phone and power bank tonight.' });
  return out;
}
