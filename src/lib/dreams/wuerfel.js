/**
 * «Abenteuer-Würfel» (Träume und Neuland N19, Noah 27.10.2026 «1-5 a»): one tap gives a small game rule for the
 * next ride, e.g. «Only gravel» or «A coffee in a village you have never been to». Built-in rules can be hidden
 * and shown again; own rules added, renamed and deleted (with Undo on the page). The last roll stays until the
 * next one. One settings record (DICE_KEY, in the backup):
 *   { hidden: [id], own: [{ id, text }], last: { id, day } | null }
 * Pure, tested in tests/wuerfel.test.js.
 */
export const DICE_KEY = 'dreams.dice';

/** The built-in rules (English keys for t()). */
export const DICE_RULES = [
  { id: 'gravel', text: 'Only gravel where you can' },
  { id: 'coffee', text: 'A coffee in a village you have never been to' },
  { id: 'left', text: 'At every fork, turn left once, then right' },
  { id: 'nomap', text: 'No map for the first hour' },
  { id: 'water', text: 'Ride to the nearest lake or river and touch the water' },
  { id: 'climb', text: 'Take the steepest road you see' },
  { id: 'photo', text: 'One photo every 10 km' },
  { id: 'bakery', text: 'Buy your lunch in a bakery on the way' },
  { id: 'sunset', text: 'Be on a hill at sunset' },
  { id: 'newroad', text: 'Ride at least 10 km on roads you have never ridden' },
  { id: 'letter', text: 'Visit a village that starts with the first letter of your name' },
  { id: 'slow', text: 'Ride slowly: no number on the bike computer for one hour' },
];

const clean = (s) => String(s ?? '').trim().slice(0, 120);

/** The stored value → a clean record. */
export function diceCfg(v) {
  const x = v && typeof v === 'object' ? v : {};
  const own = Array.isArray(x.own) ? x.own.filter((r) => r && r.id && clean(r.text)).map((r) => ({ id: String(r.id), text: clean(r.text) })) : [];
  const hidden = Array.isArray(x.hidden) ? x.hidden.filter((id) => DICE_RULES.some((r) => r.id === id)) : [];
  const last = x.last && typeof x.last === 'object' && x.last.id ? { id: String(x.last.id), day: String(x.last.day ?? '') } : null;
  return { hidden, own, last };
}

/** The rules in play: the built-in ones not hidden, then your own. → [{ id, text, own }] */
export function rulesOf(cfg) {
  const c = diceCfg(cfg);
  return [...DICE_RULES.filter((r) => !c.hidden.includes(r.id)).map((r) => ({ ...r, own: false })), ...c.own.map((r) => ({ ...r, own: true }))];
}
export const hiddenRules = (cfg) => DICE_RULES.filter((r) => diceCfg(cfg).hidden.includes(r.id));

/** A roll: a rule in play other than the last one (rnd in [0, 1)). → the next cfg (last set), or the cfg when nothing is in play. */
export function roll(cfg, day, rnd = Math.random()) {
  const c = diceCfg(cfg);
  const all = rulesOf(c);
  const pool = all.length > 1 ? all.filter((r) => r.id !== c.last?.id) : all;
  if (!pool.length) return c;
  const pick = pool[Math.min(pool.length - 1, Math.floor(rnd * pool.length))];
  return { ...c, last: { id: pick.id, day } };
}
/** The rule of the last roll, if it is still in play. */
export const lastRule = (cfg) => {
  const c = diceCfg(cfg);
  return c.last ? (rulesOf(c).find((r) => r.id === c.last.id) ?? null) : null;
};

export const addRule = (cfg, text, id) => {
  const c = diceCfg(cfg);
  return clean(text) ? { ...c, own: [...c.own, { id, text: clean(text) }] } : c;
};
export const renameRule = (cfg, id, text) => {
  const c = diceCfg(cfg);
  return clean(text) ? { ...c, own: c.own.map((r) => (r.id === id ? { ...r, text: clean(text) } : r)) } : c;
};
export const deleteRule = (cfg, id) => {
  const c = diceCfg(cfg);
  return { ...c, own: c.own.filter((r) => r.id !== id), last: c.last?.id === id ? null : c.last };
};
export const hideRule = (cfg, id, hide = true) => {
  const c = diceCfg(cfg);
  const hidden = hide ? [...new Set([...c.hidden, id])] : c.hidden.filter((x) => x !== id);
  return { ...c, hidden, last: hide && c.last?.id === id ? null : c.last };
};
