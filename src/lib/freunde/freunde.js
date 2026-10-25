/**
 * Paket D «Mit Freunden» (Noah 24.10.2026 «3b»: the friend ideas of the 996 list are open again;
 * «4b»: voice notes up to one minute). Everything works without an account and without a server:
 * what you share travels inside a link (or a small file when it holds a photo or a voice note) that
 * you send yourself. A friend opens it in the app, answers, and sends a link back. Their answer is
 * kept as their own contribution, with their name and the day; your own entry is never changed.
 *
 * Kinds of a message («Brief», short k):
 *   ask      you ask friends for their part (topic: story, summit, place, photo, level, costs,
 *            handover, duties, pair, workshop)
 *   reply    a friend's answer to an ask
 *   shelf    your lending shelf: the things you lend, swap or give to friends
 *   request  a friend asks for things from your shelf
 *   set      the logic of one of your building blocks (names, amounts), mapped to own things on import
 *   layout   the order and the hidden parts of your pages and menu, without your own words
 *
 * Kept in settings (backup and sync carry them; no new table):
 *   'friendMe'     your name for friends (what you typed; never through t())
 *   'friendAsks'   [{ id, topic, title, text, lines, date, place, photo, marks, at }] what you asked
 *   'friendNotes'  [{ id, kind: 'reply'|'request', askId, topic, title, by, at, answer, state, log }]
 *   'friendShelf'  { items: [{ itemId, how }], note }
 *   'friendGear'   [{ id, itemId, name, how, who, from, until, note }] shared, borrowed, rented, lent
 * Pure (no database, no screen); tested in tests/freunde.test.js.
 */

export const ME_KEY = 'friendMe';
export const ASKS_KEY = 'friendAsks';
export const NOTES_KEY = 'friendNotes';
export const SHELF_KEY = 'friendShelf';
export const GEAR_KEY = 'friendGear';
export const FRIENDS_HASH = '#/me/freunde';
export const IN_PREFIX = '#/me/freunde/in/';
/** Above this many characters a link is too long for some chat apps: the app offers a file instead. */
export const LINK_MAX = 4000;
/** A voice note is at most one minute (Noah 24.10.2026 «4b»). */
export const VOICE_MAX_S = 60;
export const KINDS = ['ask', 'reply', 'shelf', 'request', 'set', 'layout'];

/**
 * What you can ask friends for. title/hint are English keys for t(); subject: what the ask is about
 * (trip, summit, flat, free text, photo); lines: the ask carries a list (tasks, things, costs).
 */
export const TOPICS = [
  { key: 'story', group: 'tell', title: 'Tell the trip together', hint: 'Companions add their view of a trip; your entry stays as it is.', subject: 'trip', voice: true },
  { key: 'summit', group: 'tell', title: 'A shared memory of a place', hint: 'Friends who were there add their own words to a place of your summit book.', subject: 'summit', voice: true },
  { key: 'place', group: 'tell', title: 'Notes on a place to sleep', hint: 'Friends add when they were there and what they found, each with name and date.', subject: 'free', day: true },
  { key: 'photo', group: 'tell', title: 'Talk about a photo', hint: 'Mark points on a photo; friends comment on each point, the photo stays as it is.', subject: 'photo' },
  { key: 'level', group: 'tour', title: 'Same idea of the difficulty', hint: 'Before a tour together each says in their own words what the difficulty means.', subject: 'trip' },
  { key: 'costs', group: 'tour', title: 'Confirm the cost split', hint: 'Everyone sees how the costs are split and can note another agreement.', subject: 'trip', lines: true },
  { key: 'handover', group: 'tour', title: 'Handover to the flat sitter', hint: 'The sitter can ask about each task; open questions stay visible until you answer them.', subject: 'flat', lines: true },
  { key: 'duties', group: 'pack', title: 'Pack together', hint: 'A second person confirms the things they take care of; every tick shows who set it.', subject: 'trip', lines: true },
  { key: 'pair', group: 'pack', title: 'Agree on what comes along', hint: 'Both mark what they would like to have and what they could do without; the app shows where you agree.', subject: 'trip', lines: true },
  { key: 'workshop', group: 'pack', title: 'Workshop day with friends', hint: 'Place, date, questions and the tasks each one takes; every task is confirmed on its own.', subject: 'free', lines: true, day: true },
];
const TOPIC = Object.fromEntries(TOPICS.map((x) => [x.key, x]));
export const topicOf = (key) => TOPIC[key] ?? null;

/** How a thing on the shelf goes to a friend (English keys for t()). */
export const SHELF_HOW = [
  { key: 'lend', label: 'to borrow' },
  { key: 'swap', label: 'to swap' },
  { key: 'give', label: 'to give away' },
];
/** How a piece of main gear is shared between people (UC-184). */
export const GEAR_HOW = [
  { key: 'shared', label: 'owned together with' },
  { key: 'borrowed', label: 'borrowed from' },
  { key: 'rented', label: 'rented from' },
  { key: 'lent', label: 'lent to' },
];
/** What a friend wants to do with a thing of your shelf. */
export const WANT = [
  { key: 'try', label: 'try on' },
  { key: 'borrow', label: 'borrow' },
  { key: 'keep', label: 'keep' },
];

const clean = (s, n = 400) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const cleanText = (s, n = 2000) => String(s ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const isDay = (d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
const isData = (s, kind) => typeof s === 'string' && s.startsWith(`data:${kind}/`) && s.length < 3_000_000;
export const newId = (p = 'f') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ---------- the message ---------- */

/** One line of an ask: { id, text, who?, m? } (who: the person a task is meant for; m: your mark in «pair»). */
function cleanLine(x, i) {
  if (!x) return null;
  const text = clean(typeof x === 'string' ? x : x.text, 200);
  if (!text) return null;
  const line = { id: clean(x.id, 40) || `l${i}`, text };
  if (x.who) line.who = clean(x.who, 60);
  if (x.m === 'want' || x.m === 'skip') line.m = x.m;
  if (x.q) line.q = true; // a question (workshop), not a task
  return line;
}
const cleanMarks = (list) => (Array.isArray(list) ? list : []).filter((m) => m && Number.isFinite(m.x) && Number.isFinite(m.y)).slice(0, 12).map((m, i) => ({ id: clean(m.id, 40) || `m${i}`, x: Math.min(1, Math.max(0, m.x)), y: Math.min(1, Math.max(0, m.y)), text: clean(m.text, 200) }));

/** The ask part of a message, cleaned (unknown topic: null). */
export function cleanAsk(a) {
  if (!a || !TOPIC[a.topic]) return null;
  const out = { id: clean(a.id, 60) || newId('a'), topic: a.topic, title: clean(a.title, 120), text: cleanText(a.text, 1500), lines: (Array.isArray(a.lines) ? a.lines : []).map(cleanLine).filter(Boolean).slice(0, 80) };
  if (isDay(a.date)) out.date = a.date;
  if (a.place) out.place = clean(a.place, 120);
  if (isData(a.photo, 'image')) out.photo = a.photo;
  if (a.marks) out.marks = cleanMarks(a.marks);
  return out;
}

/** A friend's answer, cleaned. */
export function cleanAnswer(x) {
  const a = x && typeof x === 'object' ? x : {};
  const out = { text: cleanText(a.text, 2000) };
  if (isDay(a.day)) out.day = a.day;
  if (a.ok === 'clear' || a.ok === 'unsure' || a.ok === 'agree' || a.ok === 'other' || a.ok === 'done') out.ok = a.ok;
  for (const k of ['qs', 'notes', 'answers']) {
    if (a[k] && typeof a[k] === 'object') {
      const o = {};
      for (const [id, v] of Object.entries(a[k])) if (clean(v, 300)) o[clean(id, 40)] = clean(v, 300);
      if (Object.keys(o).length) out[k] = o;
    }
  }
  for (const k of ['done', 'take']) {
    if (a[k] && typeof a[k] === 'object') {
      const o = {};
      for (const [id, v] of Object.entries(a[k])) if (v) o[clean(id, 40)] = true;
      if (Object.keys(o).length) out[k] = o;
    }
  }
  if (a.marks && typeof a.marks === 'object') {
    const o = {};
    for (const [id, v] of Object.entries(a.marks)) if (v === 'want' || v === 'skip') o[clean(id, 40)] = v;
    if (Object.keys(o).length) out.marks = o;
  }
  if (a.extra) out.extra = cleanMarks(a.extra);
  if (isData(a.voice, 'audio')) out.voice = a.voice;
  if (Number.isFinite(a.voiceS)) out.voiceS = Math.min(VOICE_MAX_S, Math.max(0, Math.round(a.voiceS)));
  return out;
}

function cleanShelfItem(x) {
  const n = clean(x?.n, 120);
  if (!n) return null;
  const out = { id: clean(x.id, 60) || n, n };
  if (x.c) out.c = clean(x.c, 60);
  out.how = SHELF_HOW.some((h) => h.key === x.how) ? x.how : 'lend';
  if (x.w && WANT.some((h) => h.key === x.w)) out.w = x.w;
  return out;
}

/** A whole message as read from a link or a file, cleaned; null when it is not ours or broken. */
export function cleanEnvelope(e) {
  if (!e || typeof e !== 'object' || e.v !== 1 || e.pg !== 'f' || !KINDS.includes(e.k)) return null;
  const out = { v: 1, pg: 'f', k: e.k, id: clean(e.id, 60) || newId(e.k), by: clean(e.by, 60), at: isDay(e.at) ? e.at : null };
  if (e.k === 'ask') {
    out.ask = cleanAsk(e.ask);
    if (!out.ask) return null;
  } else if (e.k === 'reply') {
    out.ask = cleanAsk(e.ask);
    if (!out.ask) return null;
    out.answer = cleanAnswer(e.answer);
  } else if (e.k === 'shelf' || e.k === 'request') {
    out.items = (Array.isArray(e.items) ? e.items : []).map(cleanShelfItem).filter(Boolean).slice(0, 120);
    out.note = cleanText(e.note, 600);
    if (e.k === 'request') {
      out.shelf = clean(e.shelf, 60);
      if (isDay(e.from)) out.from = e.from;
      if (isDay(e.until)) out.until = e.until;
      if (!out.items.length) return null;
    }
  } else if (e.k === 'set') {
    out.name = clean(e.name, 80);
    out.note = cleanText(e.note, 600);
    out.lines = (Array.isArray(e.lines) ? e.lines : []).map((l) => ({ n: clean(l?.n, 120), q: Math.max(1, Math.min(99, Math.round(Number(l?.q) || 1))), c: clean(l?.c, 40) })).filter((l) => l.n).slice(0, 150);
    if (!out.name || !out.lines.length) return null;
  } else if (e.k === 'layout') {
    out.cfg = layoutOnly(e.cfg);
  }
  return out;
}

/** Does the message need a file (a photo or a voice note, or simply too long for a link)? */
export const needsFile = (env, linkLength = 0) => !!(env?.ask?.photo || env?.answer?.voice || linkLength > LINK_MAX);

/** The message as the text of a file a friend can open in the app. */
export const fileText = (env) => JSON.stringify({ packGeneratorFriends: 1, env });
/** The message out of a file's text, or null. */
export function readFileText(text) {
  try {
    const o = JSON.parse(text);
    return cleanEnvelope(o?.packGeneratorFriends === 1 ? o.env : o);
  } catch {
    return null;
  }
}
/** A file name without odd characters. */
export const fileName = (env) => `pack-generator-${env.k}-${String(env.ask?.title || env.name || env.by || 'freunde').toLowerCase().replace(/[^a-z0-9äöüé]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'freunde'}.json`;

/** The address of a message: the app's address + #/me/freunde/in/<code>. */
export const inUrl = (base, code) => `${String(base).replace(/#.*$/, '')}${IN_PREFIX}${code}`;
/** The code out of an address, or ''. */
export const codeOf = (hash = '') => (String(hash).startsWith(IN_PREFIX) ? String(hash).slice(IN_PREFIX.length).split('?')[0] : '');

/* ---------- making messages ---------- */

export const askEnvelope = (ask, by, at) => cleanEnvelope({ v: 1, pg: 'f', k: 'ask', id: ask.id, by, at, ask });
/** A reply carries the ask without its photo (the asker has it; a reply stays small). */
export const replyEnvelope = (ask, answer, by, at) => cleanEnvelope({ v: 1, pg: 'f', k: 'reply', id: newId('r'), by, at, ask: { ...ask, photo: undefined }, answer });

/* ---------- contributions (what friends sent you) ---------- */

/** The stored contribution of a reply or a request: always a new entry, never a change of yours. */
export function noteOf(env, now = new Date().toISOString()) {
  if (env.k === 'reply') return { id: env.id, kind: 'reply', askId: env.ask.id, topic: env.ask.topic, title: env.ask.title, by: env.by, at: env.at ?? now.slice(0, 10), got: now, answer: env.answer, state: 'new' };
  if (env.k === 'request') return { id: env.id, kind: 'request', shelf: env.shelf ?? '', by: env.by, at: env.at ?? now.slice(0, 10), got: now, items: env.items, from: env.from ?? null, until: env.until ?? null, note: env.note ?? '', state: 'new', log: [{ s: 'new', day: now.slice(0, 10) }] };
  return null;
}

/** Add a contribution; the same message opened twice is kept once. */
export function addNote(list, note) {
  const all = Array.isArray(list) ? list : [];
  if (!note || all.some((n) => n.id === note.id)) return all;
  return [note, ...all];
}
export const hasNote = (list, id) => (Array.isArray(list) ? list : []).some((n) => n.id === id);

/** A request moves on: promised (you said yes), handed (the things went over), declined. Each step keeps its day. */
export function stepRequest(note, s, day, extra = {}) {
  if (!['promised', 'handed', 'declined', 'new'].includes(s)) return note;
  return { ...note, ...extra, state: s, log: [...(note.log ?? []), { s, day }] };
}

/** Handover: the sitter's questions you have not answered yet → [{ noteId, by, lineId, line, q }]. */
export function openQuestions(notes = [], asks = []) {
  const out = [];
  for (const n of notes) {
    if (n.kind !== 'reply' || n.topic !== 'handover' || !n.answer?.qs) continue;
    const ask = asks.find((a) => a.id === n.askId);
    for (const [lineId, q] of Object.entries(n.answer.qs)) {
      if (n.solved?.[lineId]) continue;
      const line = ask?.lines?.find((l) => l.id === lineId)?.text ?? '';
      out.push({ noteId: n.id, by: n.by, lineId, line, q });
    }
  }
  return out;
}
export const solveQuestion = (note, lineId) => ({ ...note, solved: { ...(note.solved ?? {}), [lineId]: true } });

/** Pack together: per line of an ask, who confirmed it and when → { lineId: [{ by, at }] }. */
export function ticksOf(notes = [], askId) {
  const out = {};
  for (const n of notes) {
    if (n.kind !== 'reply' || n.askId !== askId || !n.answer?.done) continue;
    for (const id of Object.keys(n.answer.done)) (out[id] ??= []).push({ by: n.by, at: n.at });
  }
  return out;
}

/** Workshop day: per task who takes it and who confirmed it done → { taskId: { take: [by], done: [{ by, at }] } }. */
export function tasksOf(notes = [], askId) {
  const out = {};
  for (const n of notes) {
    if (n.kind !== 'reply' || n.askId !== askId) continue;
    for (const id of Object.keys(n.answer?.take ?? {})) (out[id] ??= { take: [], done: [] }).take.push(n.by);
    for (const id of Object.keys(n.answer?.done ?? {})) (out[id] ??= { take: [], done: [] }).done.push({ by: n.by, at: n.at });
  }
  return out;
}

/**
 * Agree on what comes along: your mark and the friend's per line → { id, text, me, them, verdict }.
 * verdict: 'take' (one wants it, nobody could do without it … or both want it), 'leave' (both could do
 * without), 'talk' (one wants it, the other could do without), 'open' (nobody marked it). No points.
 */
export function pairRows(lines = [], theirs = {}) {
  return lines.map((l) => {
    const me = l.m ?? '';
    const them = theirs?.[l.id] ?? '';
    const want = [me, them].filter((x) => x === 'want').length;
    const skip = [me, them].filter((x) => x === 'skip').length;
    const verdict = want && skip ? 'talk' : want ? 'take' : skip === 2 ? 'leave' : skip ? 'talk' : 'open';
    return { id: l.id, text: l.text, me, them, verdict };
  });
}
/** 'take' | 'talk' | 'leave' | 'open' → how many of each. */
export const pairCount = (rows) => rows.reduce((o, r) => ((o[r.verdict] = (o[r.verdict] ?? 0) + 1), o), { take: 0, talk: 0, leave: 0, open: 0 });

/** Contributions grouped by what they are about, newest first → [{ key, topic, title, notes }]. */
export function groupNotes(notes = []) {
  const map = new Map();
  for (const n of notes) {
    if (n.kind !== 'reply') continue;
    const key = `${n.topic}:${n.askId}`;
    if (!map.has(key)) map.set(key, { key, topic: n.topic, title: n.title, askId: n.askId, notes: [] });
    map.get(key).notes.push(n);
  }
  const groups = [...map.values()];
  for (const g of groups) g.notes.sort((a, b) => String(b.got ?? b.at).localeCompare(String(a.got ?? a.at)));
  return groups.sort((a, b) => String(b.notes[0].got ?? b.notes[0].at).localeCompare(String(a.notes[0].got ?? a.notes[0].at)));
}

/* ---------- asks you made ---------- */

/** Your ask as stored (with its photo, so the answers can show their points on it). */
export const storedAsk = (ask, at) => ({ ...ask, at });
export function putAsk(list, ask) {
  const all = Array.isArray(list) ? list : [];
  return all.some((a) => a.id === ask.id) ? all.map((a) => (a.id === ask.id ? ask : a)) : [ask, ...all];
}

/* ---------- the shelf ---------- */

export const emptyShelf = () => ({ items: [], note: '' });
export function shelfOf(v) {
  const items = (Array.isArray(v?.items) ? v.items : []).filter((x) => x && x.itemId).map((x) => ({ itemId: String(x.itemId), how: SHELF_HOW.some((h) => h.key === x.how) ? x.how : 'lend' }));
  return { items, note: cleanText(v?.note, 600) };
}
export const onShelf = (shelf, itemId) => shelf.items.find((x) => x.itemId === itemId) ?? null;
export function toggleShelf(shelf, itemId, how = 'lend') {
  return onShelf(shelf, itemId) ? { ...shelf, items: shelf.items.filter((x) => x.itemId !== itemId) } : { ...shelf, items: [...shelf.items, { itemId, how }] };
}
export const setShelfHow = (shelf, itemId, how) => ({ ...shelf, items: shelf.items.map((x) => (x.itemId === itemId ? { ...x, how } : x)) });

/**
 * Things that never came along on a trip or that you have more than once: good for the shelf
 * (UC-008 «Persönliche Materialbibliothek»). items: gear; usedIds: Set of ids used on any trip.
 */
export function shelfIdeas(items = [], usedIds = new Set(), shelf = emptyShelf(), max = 12) {
  const on = new Set(shelf.items.map((x) => x.itemId));
  return items.filter((i) => !on.has(i.id) && i.ownership !== 'gone' && i.ownership !== 'wishlist' && i.ownership !== 'to-buy' && !usedIds.has(i.id)).slice(0, max);
}

/** The shelf as a message: only names, categories and how each one goes. */
export function shelfEnvelope(shelf, itemsById, nameOf, catOf, by, at, id = 'shelf') {
  const items = shelf.items.map((x) => ({ id: x.itemId, n: nameOf(itemsById[x.itemId]) || '', c: catOf(itemsById[x.itemId]) || '', how: x.how })).filter((x) => x.n);
  return cleanEnvelope({ v: 1, pg: 'f', k: 'shelf', id, by, at, items, note: shelf.note });
}
export const requestEnvelope = (shelfEnv, picks, { from, until, note }, by, at) =>
  cleanEnvelope({ v: 1, pg: 'f', k: 'request', id: newId('q'), by, at, shelf: shelfEnv.id, items: shelfEnv.items.filter((x) => picks[x.id]).map((x) => ({ ...x, w: picks[x.id] })), from, until, note });

/* ---------- shared, borrowed and rented main gear (UC-184) ---------- */

export function gearOf(v) {
  return (Array.isArray(v) ? v : [])
    .filter((x) => x && x.id && (x.itemId || clean(x.name)))
    .map((x) => ({ id: String(x.id), itemId: x.itemId ? String(x.itemId) : null, name: clean(x.name, 120), how: GEAR_HOW.some((h) => h.key === x.how) ? x.how : 'shared', who: clean(x.who, 60), from: isDay(x.from) ? x.from : null, until: isDay(x.until) ? x.until : null, note: clean(x.note, 300) }));
}
/**
 * Can you use it on that day? shared: yes unless the other person has it then (from–until);
 * borrowed/rented: only from–until; lent: not from–until. → 'yes' | 'no' | 'ask'
 */
export function availableOn(g, day) {
  const inside = (!g.from || day >= g.from) && (!g.until || day <= g.until);
  const anyDate = !!(g.from || g.until);
  if (g.how === 'borrowed' || g.how === 'rented') return anyDate ? (inside ? 'yes' : 'no') : 'ask';
  if (g.how === 'lent') return anyDate && inside ? 'no' : anyDate ? 'yes' : 'no';
  return anyDate && inside ? 'no' : 'ask';
}

/* ---------- a building block (UC-027) ---------- */

/** One of your sets as a message: the names and amounts, no ids, nothing else. */
export function setEnvelope(set, members, nameOf, catOf, qtyOf, by, at) {
  return cleanEnvelope({ v: 1, pg: 'f', k: 'set', id: newId('s'), by, at, name: set.name, note: set.note ?? '', lines: members.map((i) => ({ n: nameOf(i), q: qtyOf(i.id), c: catOf(i) })) });
}
const low = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Each line of a received set with the own thing of the same name (or null) → [{ ...line, itemId }]. */
export function matchSet(lines = [], items = [], nameOf = (i) => i.name) {
  return lines.map((l) => {
    const hit = items.find((i) => i.ownership !== 'gone' && (low(nameOf(i)) === low(l.n) || low(i.name) === low(l.n) || low(i.nameDe) === low(l.n)));
    return { ...l, itemId: hit?.id ?? null };
  });
}

/* ---------- the layout (UC-319) ---------- */

/** Only order, hidden parts and start tabs: no own names, no own titles. */
export function layoutOnly(cfg) {
  const out = { pages: {}, menu: { hide: [], order: [] }, tabs: {} };
  const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x).slice(0, 60).map((x) => x.slice(0, 80)) : []);
  if (cfg?.pages && typeof cfg.pages === 'object') {
    for (const [k, p] of Object.entries(cfg.pages)) {
      const page = { hide: list(p?.hide), order: list(p?.order) };
      if (page.hide.length || page.order.length) out.pages[String(k).slice(0, 80)] = page;
    }
  }
  if (cfg?.menu) out.menu = { hide: list(cfg.menu.hide), order: list(cfg.menu.order) };
  if (cfg?.tabs && typeof cfg.tabs === 'object') {
    for (const [k, p] of Object.entries(cfg.tabs)) {
      const tab = { hide: list(p?.hide), start: typeof p?.start === 'string' && p.start ? p.start.slice(0, 80) : null };
      if (tab.hide.length || tab.start) out.tabs[String(k).slice(0, 80)] = tab;
    }
  }
  return out;
}
/** How much a layout changes → { pages, menu, tabs } (counts). */
export const layoutCount = (l) => ({ pages: Object.keys(l?.pages ?? {}).length, menu: (l?.menu?.hide?.length ?? 0) + (l?.menu?.order?.length ? 1 : 0), tabs: Object.keys(l?.tabs ?? {}).length });
/** Your record with the layout put on top: your own names stay. */
export function applyLayout(mine, l) {
  const pages = { ...(mine?.pages ?? {}) };
  for (const [k, p] of Object.entries(l.pages ?? {})) pages[k] = { ...(pages[k] ?? { names: {} }), hide: [...p.hide], order: [...p.order], names: pages[k]?.names ?? {} };
  const tabs = { ...(mine?.tabs ?? {}) };
  for (const [k, p] of Object.entries(l.tabs ?? {})) tabs[k] = { ...(tabs[k] ?? { names: {} }), hide: [...p.hide], start: p.start, names: tabs[k]?.names ?? {} };
  return { pages, menu: { ...(mine?.menu ?? {}), hide: [...(l.menu?.hide ?? [])], order: [...(l.menu?.order ?? [])], names: mine?.menu?.names ?? {} }, tabs };
}
