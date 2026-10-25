/**
 * Paket B «Touren ohne Überraschung», part 3 (Noah 24.10.2026 «1b 2a 3b 4b 5a», 996 Ideen), the small
 * ideas for the bike shop and the bike:
 *
 *   Cost limit       UC-162-I2  The workshop order says how much the shop may spend and whether it should
 *                               call first. Only a wish in the message, never a contract.
 *                               Stored per bike: settings 'werkstatt' = { [bikeId]: { limit, call } }.
 *   Refund           UC-174-I2  A visit can carry a refund (warranty, insurance, goodwill): the amount, from
 *                               whom and whether it came. What you paid and what came back stay apart.
 *                               Stored on the visit: visit.refund = { chf, from, got }.
 *   Handover         UC-191-I2  After the sale: keys, charger, papers, the bike out of Strava and Garmin.
 *                               Stored with the sale listing: griff.sell[bikeId].handover (probe shape).
 *   Seen before      UC-173-I2  A problem that sounds like an earlier, solved one of the same bike points
 *                               to it, with what was done then.
 *
 * Pure functions, tested in tests/werkstatt.test.js. Labels are English keys for t().
 */

export const WERKSTATT_KEY = 'werkstatt';

/** A number of francs from what was typed («250», «250.–», «1'200»), or null. */
export function chfOf(text) {
  const s = String(text ?? '')
    .replace(/[’'\s]/g, '')
    .replace(/[.,]–$/, '')
    .replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** The lines the order message gets for the limit (German, like the rest of the message). */
export function limitLines({ limit = null, call = false } = {}) {
  const n = chfOf(limit);
  if (n != null && call) return [`Bitte höchstens CHF ${Math.round(n)}. Wenn es mehr wird oder etwas dazukommt, rufen Sie mich bitte vorher an.`];
  if (n != null) return [`Bitte höchstens CHF ${Math.round(n)}.`];
  if (call) return ['Wenn Sie zusätzliche Arbeiten sehen, rufen Sie mich bitte vorher an.'];
  return [];
}

/** The order message with the limit lines put in before «Wann hätten Sie Zeit?». */
export function withLimit(text, wish) {
  const add = limitLines(wish);
  if (!add.length) return text;
  const lines = String(text).split('\n');
  const at = lines.findIndex((l) => l.startsWith('Wann hätten'));
  lines.splice(at < 0 ? lines.length : at, 0, ...add);
  return lines.join('\n');
}

/** { paid, back, net, open } for a visit with a refund; null without one. back: only what came. */
export function refundOf(visit, total) {
  const r = visit?.refund;
  const chf = chfOf(r?.chf);
  if (!r || chf == null) return null;
  const paid = typeof total === 'number' ? total : null;
  const back = r.got ? chf : 0;
  return { chf, from: String(r.from ?? '').trim(), got: !!r.got, paid, back, net: paid == null ? null : Math.round((paid - back) * 100) / 100, open: !r.got };
}

/** The steps of the handover after a sale. */
export const HANDOVER_STEPS = [
  { key: 'keys', name: 'Keys for the lock and the battery', sub: 'All of them, also the spare key' },
  { key: 'charger', name: 'Charger and accessories', sub: 'Charger, lights, pump, mounts that belong to the bike' },
  { key: 'papers', name: 'Papers', sub: 'Receipt, frame number, manual, warranty card' },
  { key: 'apps', name: 'Bike out of Strava and Garmin', sub: 'Mark it as retired, so your km do not count on it any more' },
  { key: 'data', name: 'Pass on the service history', sub: 'Only if you want: the sale listing has the services' },
  { key: 'paid', name: 'Money received', sub: 'Before the bike leaves' },
];

/** Words that say nothing about a problem. */
const STOP = new Set('aber also auch beim dann dass dem den der des die ein eine einem einen einer immer mehr nach nicht noch oder sehr sich sind und vom von wenn wieder wird with that this from have when what after again does there than they then just more over some like only into very about'.split(' '));
const words = (s) =>
  new Set(
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w)),
  );

/**
 * Solved problems of the same bike that sound like this one (at least one telling word in common),
 * logged before it, the best match first. [{ task, shared }]
 */
export function similarProblems(task, all = [], bikeIdOf = (r) => r.bikeId) {
  const mine = words(task?.task);
  if (!mine.size) return [];
  const bike = bikeIdOf(task);
  const out = [];
  for (const r of all) {
    if (!r || r.id === task.id || bikeIdOf(r) !== bike) continue;
    if (r.status !== 'done' && r.status !== 'gone') continue;
    if (task.logDate && r.logDate && r.logDate > task.logDate) continue;
    const shared = [...words(r.task)].filter((w) => mine.has(w)).length;
    if (shared) out.push({ task: r, shared });
  }
  return out.sort((a, b) => b.shared - a.shared || String(b.task.statusDate ?? b.task.logDate ?? '').localeCompare(String(a.task.statusDate ?? a.task.logDate ?? '')));
}
