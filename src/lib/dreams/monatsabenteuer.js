/**
 * «Ein Abenteuer im Monat» (Träume und Neuland N12, Noah 07.11.2026 «ok N12»): once a month the app suggests one
 * small adventure, in turn from the ones you made possible: the After-work bivouac (N6), Train there, bike home
 * (N7) and a Round through new ground (N2), plus your own ideas. A quiet line on Today names it; «Not this month»
 * always works. Everything is a suggestion: kinds can be hidden and shown again, own ideas added, renamed and
 * deleted, the line on Today switched off. One settings record (ADV_KEY, in the backup):
 *   { hidden: [id], own: [{ id, text }], skip: 'YYYY-MM' | null, today: boolean }
 * Pure, tested in tests/monatsabenteuer.test.js.
 */
export const ADV_KEY = 'dreams.monthAdventure';

/** The built-in kinds (English keys for t()); months: when it makes sense (1 January … 12 December). */
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const ADVENTURES = [
  { id: 'biwak', text: 'After-work bivouac', hint: 'A night out after work near home, back for breakfast.', months: [4, 5, 6, 7, 8, 9, 10] },
  { id: 'train', text: 'Train there, bike home', hint: 'By train to a place you have never been, home by bike.', months: ALL },
  { id: 'round', text: 'Round through new ground', hint: 'A ride through a place you have never been, back on another road.', months: ALL },
];

const clean = (s) => String(s ?? '').trim().slice(0, 120);

/** The stored value → a clean record. */
export function advCfg(v) {
  const x = v && typeof v === 'object' ? v : {};
  const own = Array.isArray(x.own) ? x.own.filter((r) => r && r.id && clean(r.text)).map((r) => ({ id: String(r.id), text: clean(r.text) })) : [];
  const hidden = Array.isArray(x.hidden) ? x.hidden.filter((id) => ADVENTURES.some((a) => a.id === id)) : [];
  const skip = typeof x.skip === 'string' && /^\d{4}-\d{2}$/.test(x.skip) ? x.skip : null;
  return { hidden, own, skip, today: x.today !== false };
}

/** 'YYYY-MM' of a YYYY-MM-DD day. */
export const monthOf = (day) => String(day).slice(0, 7);

/** The kinds in play for a month: built-in ones in season and not hidden, then your own. → [{ id, text, hint, own }] */
export function adventuresOf(cfg, month) {
  const c = advCfg(cfg);
  const m = Number(String(month).slice(5, 7));
  return [
    ...ADVENTURES.filter((a) => a.months.includes(m) && !c.hidden.includes(a.id)).map((a) => ({ ...a, own: false })),
    ...c.own.map((r) => ({ ...r, hint: '', own: true })),
  ];
}
export const hiddenAdventures = (cfg) => ADVENTURES.filter((a) => advCfg(cfg).hidden.includes(a.id));

/** This month's adventure: the kinds take turns, month by month. null when nothing is in play. */
export function adventureFor(cfg, month) {
  const list = adventuresOf(cfg, month);
  if (!list.length) return null;
  const n = Number(String(month).slice(0, 4)) * 12 + Number(String(month).slice(5, 7));
  return list[n % list.length];
}

/** Is the line on Today due: switched on, something in play and not closed for this month? */
export function showToday(cfg, day) {
  const c = advCfg(cfg);
  const month = monthOf(day);
  return c.today && c.skip !== month && !!adventureFor(c, month);
}

export const skipMonth = (cfg, month) => ({ ...advCfg(cfg), skip: month });
export const unskip = (cfg) => ({ ...advCfg(cfg), skip: null });
export const setToday = (cfg, on) => ({ ...advCfg(cfg), today: !!on });
export const hideAdventure = (cfg, id, hide = true) => {
  const c = advCfg(cfg);
  return { ...c, hidden: hide ? [...new Set([...c.hidden, id])] : c.hidden.filter((x) => x !== id) };
};
export const addAdventure = (cfg, text, id) => {
  const c = advCfg(cfg);
  return clean(text) ? { ...c, own: [...c.own, { id, text: clean(text) }] } : c;
};
export const renameAdventure = (cfg, id, text) => {
  const c = advCfg(cfg);
  return clean(text) ? { ...c, own: c.own.map((r) => (r.id === id ? { ...r, text: clean(text) } : r)) } : c;
};
export const deleteAdventure = (cfg, id) => {
  const c = advCfg(cfg);
  return { ...c, own: c.own.filter((r) => r.id !== id) };
};
