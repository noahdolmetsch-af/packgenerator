/**
 * «Passt jetzt: Ideen pro Monat» (Träume und Neuland N8, Noah 27.10.2026 «1-5 a»): what goes well in a month
 * (sea of fog, high passes open, lakes for a swim …), with your own ideas. On Touren › Träume under «Your year»;
 * a tap on a month there shows that month's ideas. Pass opening as the usual months, never live.
 * Everything is a suggestion: built-in ideas can be hidden (and shown again), own ones added, renamed, given
 * other months and deleted; one tap makes a dream from an idea.
 * Setting IDEAS_KEY = { own: [{ id, text, months }], hidden: [built-in ids] } (in the backup).
 * Pure, tested in tests/monatsideen.test.js.
 */
export const IDEAS_KEY = 'dreams.monthIdeas';

/** The built-in ideas (English, through t() when shown) with their usual months. */
export const MONTH_IDEAS = [
  { id: 'fog', text: 'Above the sea of fog: ride up a hill on a grey day', months: [10, 11, 12, 1, 2] },
  { id: 'passes', text: 'High passes are open (usually June to October)', months: [6, 7, 8, 9, 10] },
  { id: 'lowpasses', text: 'Jura and low passes first; the high passes are still closed', months: [3, 4, 5] },
  { id: 'swim', text: 'Lakes warm enough for a swim on the way', months: [6, 7, 8, 9] },
  { id: 'larch', text: 'Golden larches in the mountains', months: [10, 11] },
  { id: 'blossom', text: 'Blossom in the lowland and along the lakes', months: [4, 5] },
  { id: 'longdays', text: 'The longest days: room for a big ride or a night out', months: [5, 6, 7] },
  { id: 'south', text: 'Milder in the south: Ticino and Lake Geneva', months: [12, 1, 2, 3] },
  { id: 'gravel', text: 'Dry gravel roads: time for a gravel tour', months: [8, 9] },
  { id: 'lights', text: 'Long nights: a ride with lights under the stars', months: [11, 12, 1] },
];

const okMonths = (m) => [...new Set((Array.isArray(m) ? m : []).map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x <= 12))].sort((a, b) => a - b);

/** The saved setting with defaults. */
export function ideasCfg(value) {
  const own = (Array.isArray(value?.own) ? value.own : []).filter((x) => x?.id && String(x.text ?? '').trim()).map((x) => ({ id: String(x.id), text: String(x.text).trim().slice(0, 120), months: okMonths(x.months) }));
  const hidden = (Array.isArray(value?.hidden) ? value.hidden : []).filter((id) => MONTH_IDEAS.some((x) => x.id === id));
  return { own, hidden };
}

/** The ideas of a month: [{ id, text, months, own }] built-in first (minus the hidden), then your own. */
export function ideasFor(cfg, month) {
  const m = Number(month);
  const std = MONTH_IDEAS.filter((x) => x.months.includes(m) && !cfg.hidden.includes(x.id)).map((x) => ({ ...x, own: false }));
  const own = cfg.own.filter((x) => x.months.includes(m)).map((x) => ({ ...x, own: true }));
  return [...std, ...own];
}

/** The built-in ideas of a month that are hidden (to show them again). */
export const hiddenFor = (cfg, month) => MONTH_IDEAS.filter((x) => x.months.includes(Number(month)) && cfg.hidden.includes(x.id));

export const addOwn = (cfg, text, months, id) => ({ ...cfg, own: [...cfg.own, { id, text: String(text).trim().slice(0, 120), months: okMonths(months) }] });
export const renameOwn = (cfg, id, text) => ({ ...cfg, own: cfg.own.map((x) => (x.id === id ? { ...x, text: String(text).trim().slice(0, 120) || x.text } : x)) });
export const toggleOwnMonth = (cfg, id, month) => ({
  ...cfg,
  own: cfg.own.map((x) => {
    if (x.id !== id) return x;
    const has = x.months.includes(month);
    const months = has ? x.months.filter((m) => m !== month) : okMonths([...x.months, month]);
    return { ...x, months: months.length ? months : x.months }; // at least one month stays
  }),
});
export const deleteOwn = (cfg, id) => ({ ...cfg, own: cfg.own.filter((x) => x.id !== id) });
export const hideStd = (cfg, id, hide = true) => ({ ...cfg, hidden: hide ? [...new Set([...cfg.hidden, id])] : cfg.hidden.filter((x) => x !== id) });
