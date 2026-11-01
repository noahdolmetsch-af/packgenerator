/**
 * Nacht-Ideen (Noah 28.10.2026 «2a 3b und a»), from his answer on sheet 5 («what would have helped you most
 * on the phone in this night?»):
 * - «Belohnung jede Stunde»: your list of small rewards (stored.rewards = [{ id, text }]); in race mode the
 *   next one stands on top with its full hour.
 * - «Bäckerei am Morgen»: the first bakery on the route after a night that is open when you get there; in the
 *   plan for every night and in race mode after midnight.
 * Tested in tests/race-night.test.js.
 */
import { openAt } from './outside.js';

const HOUR = 36e5;

/** Is this place a bakery? OSM shop=bakery, or the name says so. */
export const isBakery = (p) => p?.kind === 'shop' && (p.sub === 'bakery' || /b(a|ä|ae)ckerei|bakery|boulangerie|panetteria|panader[ií]a/i.test(String(p.name ?? '')));

/**
 * The first bakery from km fromKm on (up to maxKm ahead) that is open when you get there (eta(km) → ms).
 * If none is open, the first one ahead, with when it opens. → { poi, km: distance, at, state } or null
 */
export function morningBakery(pois = [], fromKm = 0, eta = null, maxKm = 80) {
  const list = pois.filter((p) => isBakery(p) && p.km >= fromKm && p.km <= fromKm + maxKm).sort((a, b) => a.km - b.km);
  let first = null;
  for (const p of list) {
    const at = eta ? eta(p.km) : null;
    const state = at ? openAt(p.hours, new Date(at)) : { open: null };
    const row = { poi: p, km: Math.round((p.km - fromKm) * 10) / 10, at, state };
    if (state.open === true) return row;
    first ??= row;
  }
  return first;
}

/** Race mode shows the bakery between midnight and 10 in the morning. */
export const bakeryTime = (ms) => {
  const h = new Date(ms).getHours();
  return h >= 0 && h < 10;
};

/** Your rewards: [{ id, text }] without empty rows. */
export const rewardsOf = (stored = {}) => (Array.isArray(stored?.rewards) ? stored.rewards : []).filter((r) => String(r?.text ?? '').trim()).map((r) => ({ id: r.id, text: String(r.text) }));

/**
 * The next reward: at the next full hour, the list in turn, counted from the start of the race
 * (startMs; without it from midnight). → { at, text, n } or null when the list is empty.
 */
export function nextReward(list = [], now = Date.now(), startMs = null) {
  if (!list.length) return null;
  const d = new Date(now);
  d.setMinutes(0, 0, 0);
  const at = d.getTime() + HOUR;
  const from = Number.isFinite(startMs) ? startMs : new Date(new Date(now).setHours(0, 0, 0, 0)).getTime();
  const n = Math.max(1, Math.ceil((at - from) / HOUR - 1e-9));
  return { at, text: list[(n - 1) % list.length].text, n };
}
