/**
 * «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a», thread «Versteckte Inhalte auffindbar machen»): the row under the
 * chips on Heute that says one idea, always with its «Warum» («Why»). Pure (no runes, no database); the row
 * (IdeenZeile.svelte) reads the data. Tested in tests/ideen.test.js.
 *
 * Four sources, in this order: a star that is almost there, a content page that fits your data (the tour suggestions),
 * what is new since your last visit, and a function that fits your moment and that you never opened (the old «Discover»,
 * discover.js). One idea in the row, three in the window «More ideas». Everything is a suggestion: «Later» (back
 * tomorrow), «Not for me» (never again, with Undo) and a switch that takes the row away.
 */
import { discoverList, discoverOf } from './discover.js';

export const IDEAS_KEY = 'home.ideas';
/** The content page that fits your data: the id of its function (featreg/tourenvorschlaege.js) and where it is. */
export const TOUR_FEATURE = 'f.tourvorschlag';
export const TOUR_HREF = '#/trips/vorschlaege';
/** How many ideas the window shows, and the least progress for «Almost there». */
export const SHOWN = 3;
export const ALMOST = 0.6;

/** The stored record: { not: { [idea id]: day }, last: { day, id } } (only for ideas that are no function). */
export function ideasRecOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const not = {};
  for (const [id, day] of Object.entries(v.not && typeof v.not === 'object' ? v.not : {})) if (id && typeof day === 'string') not[id] = day;
  const last = v.last && typeof v.last.id === 'string' && typeof v.last.day === 'string' ? { day: v.last.day, id: v.last.id } : null;
  return { not, last };
}
export const setNot = (rec, id, day) => ({ ...rec, not: { ...rec.not, [id]: day } });
export const unsetNot = (rec, id) => ({ ...rec, not: Object.fromEntries(Object.entries(rec.not).filter(([k]) => k !== id)) });
export const setLast = (rec, day, id) => (rec.last?.day === day && rec.last.id === id ? rec : { ...rec, last: { day, id } });

/**
 * The ideas for today, best first: [{ id, kind: 'star' | 'content' | 'new' | 'feature', feature?, ...facts }].
 * Only the facts and the ids (no texts): the row writes the words, so every text goes through t() there.
 * - star: { actId, left, value, target, unit, progress, name } from nextStars (null: none, or hidden by you)
 * - used: Set of function ids you opened; dreams: how many dreams you keep; news: { version, title, text } while it is new, else null
 * - rec (home.discover) and ir (home.ideas): what you put off or sent away
 * «Never the same twice in a row»: the idea that was first yesterday moves to the end of the list.
 */
export function ideasOf({ moment, today, used = new Set(), notForMe = {}, rec = discoverOf(null), ir = ideasRecOf(null), star = null, dreams = 0, news = null } = {}) {
  if (rec.off) return [];
  const free = (id) => !(ir.not[id] || (rec.later[id] && rec.later[id] >= today));
  const out = [];
  if (star && star.progress >= ALMOST && star.progress < 1) out.push({ ...star, id: `star:${star.id}`, kind: 'star' });
  if (moment !== 'unterwegs' && !used.has(TOUR_FEATURE) && !notForMe[TOUR_FEATURE]) out.push({ id: TOUR_FEATURE, kind: 'content', dreams });
  if (news) out.push({ ...news, id: `new:${news.version}`, kind: 'new' });
  for (const f of discoverList({ moment, today, used, notForMe, rec }, SHOWN + 1)) if (f.id !== TOUR_FEATURE) out.push({ id: f.id, kind: 'feature', feature: f });
  const open = out.filter((x) => free(x.id));
  // the same idea two days in a row: the other ones come first
  if (ir.last && ir.last.day < today && open.length > 1 && open[0].id === ir.last.id) open.push(open.shift());
  return open;
}
