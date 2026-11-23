/**
 * «Seitentitel im Browser-Tab» (Noah 23.11.2026 «2a»): the title of the browser tab follows the path line,
 * the most specific name first: «Jura-Runde · Touren», «Woche · Plan». Heute is «Pack Generator». While a ride, a
 * timer or a meditation runs, the time comes first: «▶ 12:34 · Meditation» («⏸» when it is paused), so a tab
 * in the background shows how long it has been going. Pure; TabTitle.svelte uses it.
 *
 * Names the user typed (a tour, a bike) stand as they are; only the app's own words come in through `t()` before
 * they get here (the caller passes the labels).
 *
 * input: { app, home, place, tab, h1, running }
 *   app      the app's name, the title of Heute and of a page without a place
 *   home     true on Heute
 *   place    the label of the place («Touren») or ''
 *   tab      the label of the tab («Übersicht») or ''
 *   h1       the page's own big title (a name the user may have typed) or ''
 *   running  null or { time: '12:34', name: 'Meditation', paused: false }
 */
const MAX = 60;

/** A long name is cut with «…», so the tab still shows the end of the title. */
export const short = (s, max = MAX) => {
  const x = String(s ?? '').replace(/\s+/g, ' ').trim();
  return x.length > max ? `${x.slice(0, max - 1).trimEnd()}…` : x;
};

/** The words of the page without the running time (the part a screen reader hears when the page changes). */
export function pageTitle({ app = 'Pack Generator', home = false, place = '', tab = '', h1 = '' } = {}) {
  if (home) return app;
  const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const parts = [];
  const own = short(h1);
  const t2 = (tab ?? '').trim();
  const p = (place ?? '').trim();
  if (own && !same(own, t2) && !same(own, p)) parts.push(own);
  if (t2 && !same(t2, p)) parts.push(t2);
  if (p) parts.push(p);
  if (!p && !parts.length) return app;
  if (!p) parts.push(app); // a page without a place (a shared list): «Name · Pack Generator»
  return parts.join(' · ');
}

/** The whole title: the running time first, else the words of the page. */
export function tabTitle(input = {}) {
  const r = input.running;
  if (r && r.time) return `${r.paused ? '⏸' : '▶'} ${r.time}${r.name ? ` · ${short(r.name, 30)}` : ''}`;
  return pageTitle(input);
}

/** m:ss, h:mm:ss */
export function runClock(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

/** The riding time of a recording in ms: since the start, the pauses left out ([[fromMs, toMs|null]]). */
export function ridingMs(startAt, breaks = [], now = Date.now()) {
  const off = (breaks ?? []).reduce((n, b) => n + Math.max(0, (b?.[1] ?? now) - (b?.[0] ?? now)), 0);
  return Math.max(0, now - startAt - off);
}
