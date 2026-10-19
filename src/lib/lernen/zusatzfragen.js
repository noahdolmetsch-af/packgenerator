/**
 * Paket M «Aus Touren lernen»:
 * - #34 «10 Zusatzfragen im Rückblick»: questions that help to learn more from a trip. The ones that fit
 *   the trip come first (rain, several days, a bike, much climbing). All can be switched off, changed,
 *   and own ones added (rule 18). Answers: d.extra = { [qid]: text } on the debrief.
 * - #258 «Nachricht ans zukünftige Ich»: one sentence in the debrief (d.future = { text, at }) that shows
 *   up before the next trip until it is put away (settings 'zukunft' { seen: [debriefTripId] }).
 */

/** settings record of the extra questions: { off: [id], edits: { [id]: text }, own: [{ id, text }], order: [id] } */
export const EXTRA_KEY = 'zusatzfragen';
/** settings record of the messages to your future self: { seen: [tripId] } */
export const FUTURE_KEY = 'zukunft';

/** The 10 questions; `fits(ctx)` says whether one fits this trip especially well (it then comes first). */
export const EXTRA_QUESTIONS = [
  { id: 'moment', text: 'What was the most beautiful moment?' },
  { id: 'anders', text: 'What would you do differently next time?' },
  { id: 'tag', text: 'Which day was the best, and why?', fits: (c) => c.days > 1 },
  { id: 'regen', text: 'What helped you in the rain, and what did not?', fits: (c) => c.rain },
  { id: 'essen', text: 'What did you eat or drink that was really good?' },
  { id: 'hart', text: 'Where was it harder than planned?', fits: (c) => c.climbM >= 800 },
  { id: 'velo', text: 'What would you change on the bike?', fits: (c) => c.bike },
  { id: 'teil', text: 'Which thing in the bags surprised you?', fits: (c) => c.items >= 10 },
  { id: 'begegnung', text: 'Whom or what did you meet on the way?' },
  { id: 'erzaehlen', text: 'What will you tell a friend about this trip?' },
];

/** What the questions look at: { days, rain, climbM, bike, items }. */
export function extraContext(trip, rides = []) {
  const fc = trip?.forecast?.days ?? [];
  const climb = Number(trip?.route?.gainM) || rides.reduce((s, r) => s + (Number(r.gainM) || 0), 0);
  return {
    days: Math.max(1, Number(trip?.days) || 1),
    rain: fc.some((d) => (d.rainMm ?? 0) >= 2 || (d.rainPct ?? 0) >= 60),
    climbM: climb,
    bike: !!trip?.bikeId,
    items: (trip?.entries ?? []).length,
  };
}

/** The settings, cleaned. */
export function extraConfig(value) {
  const v = value && typeof value === 'object' ? value : {};
  return {
    off: Array.isArray(v.off) ? v.off.filter((x) => typeof x === 'string') : [],
    edits: v.edits && typeof v.edits === 'object' ? v.edits : {},
    own: Array.isArray(v.own) ? v.own.filter((q) => q && typeof q.id === 'string' && typeof q.text === 'string' && q.text.trim()) : [],
    order: Array.isArray(v.order) ? v.order.filter((x) => typeof x === 'string') : [],
  };
}

/**
 * Every question in the user's order: [{ id, text, own, edited, on, fits }]. Built-in texts stay English
 * (the page translates them with t()); an edited or own text is the user's and is shown as it is.
 */
export function extraList(cfg, ctx = null) {
  const c = extraConfig(cfg);
  const all = [
    ...EXTRA_QUESTIONS.map((q) => ({ id: q.id, text: c.edits[q.id] ?? q.text, own: false, edited: c.edits[q.id] != null, on: !c.off.includes(q.id), fits: !!(ctx && q.fits?.(ctx)) })),
    ...c.own.map((q) => ({ id: q.id, text: q.text, own: true, edited: true, on: !c.off.includes(q.id), fits: false })),
  ];
  const pos = new Map(c.order.map((id, i) => [id, i]));
  return all
    .map((q, i) => ({ q, i }))
    .sort((a, b) => (pos.get(a.q.id) ?? 1000 + a.i) - (pos.get(b.q.id) ?? 1000 + b.i))
    .map((x) => x.q);
}

/**
 * The questions to show in a debrief, the fitting ones first (then the user's order). `first`: how many
 * show open (the rest wait under «Mehr fragen»); questions already answered always show open.
 */
export function extraForTrip(cfg, ctx, answers = {}, first = 2) {
  const on = extraList(cfg, ctx).filter((q) => q.on);
  const sorted = [...on.filter((q) => q.fits), ...on.filter((q) => !q.fits)];
  const answered = (q) => !!String(answers?.[q.id] ?? '').trim();
  const open = sorted.filter((q, i) => i < first || answered(q));
  return { open, more: sorted.filter((q) => !open.includes(q)) };
}

/* ---------- changes (rule 18: add, rename, delete, switch off, order) ---------- */
const keep = (c) => ({ off: [...c.off], edits: { ...c.edits }, own: c.own.map((q) => ({ ...q })), order: [...c.order] });
export function setExtraOn(cfg, id, on) {
  const c = keep(extraConfig(cfg));
  c.off = on ? c.off.filter((x) => x !== id) : [...new Set([...c.off, id])];
  return c;
}
export function renameExtra(cfg, id, text) {
  const c = keep(extraConfig(cfg));
  const v = String(text ?? '').trim();
  const own = c.own.find((q) => q.id === id);
  if (own) own.text = v || own.text;
  else if (!v || v === EXTRA_QUESTIONS.find((q) => q.id === id)?.text) delete c.edits[id];
  else c.edits[id] = v;
  return c;
}
export function addExtra(cfg, text, now = new Date()) {
  const c = keep(extraConfig(cfg));
  const v = String(text ?? '').trim();
  if (!v) return c;
  c.own.push({ id: `own-${now.getTime().toString(36)}`, text: v });
  return c;
}
/** Delete: an own question goes; a built-in one is switched off and its text reset (it can come back). */
export function dropExtra(cfg, id) {
  const c = keep(extraConfig(cfg));
  if (c.own.some((q) => q.id === id)) c.own = c.own.filter((q) => q.id !== id);
  else {
    delete c.edits[id];
    c.off = [...new Set([...c.off, id])];
  }
  c.order = c.order.filter((x) => x !== id);
  return c;
}
export function orderExtra(cfg, ids) {
  const c = keep(extraConfig(cfg));
  c.order = [...ids];
  return c;
}

/* ---------- #258 the message to your future self ---------- */

/**
 * The messages that wait for `tripId` (the next trip): from debriefs of trips that started before it,
 * not yet put away, newest first. [{ fromId, title, text, at }]
 */
export function futureFor(tripId, trips = [], debriefs = [], seen = []) {
  const trip = trips.find((x) => x.id === tripId);
  if (!trip?.startDate) return [];
  const byId = new Map(trips.map((x) => [x.id, x]));
  return debriefs
    .filter((d) => d.future?.text?.trim() && d.tripId !== tripId && !seen.includes(d.tripId))
    .map((d) => ({ d, from: byId.get(d.tripId) }))
    .filter((x) => x.from && (x.from.startDate ?? '') < trip.startDate)
    .sort((a, b) => (b.d.future.at ?? '').localeCompare(a.d.future.at ?? ''))
    .map((x) => ({ fromId: x.d.tripId, title: x.from.title ?? '', text: x.d.future.text.trim(), at: x.d.future.at ?? null }));
}
