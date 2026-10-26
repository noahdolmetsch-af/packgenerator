/**
 * Vorgänge im Eingang (996 Ideen, Noah 25.10.2026 «bauen … 11, 16»):
 * - «Doppelten Eingang erkennen» (UC-262-I2): a mail, a photo and a note about the same matter are
 *   suggested as belonging together. Nothing is merged: each entry stays as it came in.
 * - «Mail als Vorgang» (UC-299-I1): a confirmation, a question and the bill later can be put into the
 *   same matter (a «Vorgang»); the app suggests one, you decide.
 *
 *   A Vorgang: { id, name, at } in settings 'inbox.cases' (a group: rename and delete, GROUP_PLACES).
 *   An entry (db.notes row) in a Vorgang carries caseId. A «no» to a suggestion is remembered in
 *   settings 'inbox.caseNo' (['a|b', 'note|case']), so it never comes again.
 * Pure functions, tested in tests/einzelplanen.test.js; the page is src/pages/Vorgaenge.svelte.
 */
import { amountOf, senderOf } from '../mailin.js';

export const CASES_KEY = 'inbox.cases';
export const CASE_NO_KEY = 'inbox.caseNo';
export const CASE_NO_MAX = 400;
/** Entries further apart than this are never a double entry. */
export const PAIR_DAYS = 14;
/** Only entries of the last 90 days are looked at. */
export const LOOK_DAYS = 90;

const DAY_MS = 864e5;
const STOP = new Set(
  'aber alle allem also auch bitte dann dass dein deine denn diese dieser einen einer eines euch für fuer haben hallo hier ihre ihren jetzt kann kein mehr mein meine mich mit nach nicht noch oder sehr sich sind über ueber und uns unser vielen viele vom von wenn werden wird wie wir zum zur grüsse gruesse freundlichen liebe lieber danke vielen thanks hello regards your with from this that have will about there their which would could please dear best kind mail email gmail heute morgen gestern'.split(' '),
);

/** Where an entry came from: 'mail', 'photo' or 'note'. */
export const sourceOf = (n) => (n?.mail || n?.page === 'mail' ? 'mail' : n?.photo ? 'photo' : 'note');

/** The words that can tie two entries together: long words, numbers of 4+ digits (booking, invoice), the sender's name. */
export function keysOf(n) {
  const text = `${n?.mail?.subject ?? ''} ${n?.text ?? ''} ${n?.title ?? ''} ${n?.mail?.fromName ?? ''}`.toLowerCase();
  const words = new Set((text.match(/[\p{L}]{5,}/gu) ?? []).filter((w) => !STOP.has(w)));
  const nums = new Set((text.match(/\b[a-z]{0,3}\d{4,}[a-z0-9-]*\b/g) ?? []).map((x) => x.replace(/-/g, '')));
  const dom = senderOf(n).split('@')[1]?.split('.').slice(-2, -1)[0] ?? '';
  if (dom.length >= 4) words.add(dom);
  return { words, nums, amount: amountOf(text) };
}

const msOf = (n) => Date.parse(n?.mail?.date ?? n?.at ?? '') || 0;

/** Why two entries may be the same matter: { score, why: [{ kind: 'number'|'amount'|'words', text }] }. */
export function sameMatter(a, b) {
  const ka = keysOf(a);
  const kb = keysOf(b);
  const why = [];
  let score = 0;
  const num = [...ka.nums].find((x) => kb.nums.has(x));
  if (num) (score += 3), why.push({ kind: 'number', text: num.toUpperCase() });
  if (ka.amount && ka.amount === kb.amount) (score += 2), why.push({ kind: 'amount', text: `CHF ${ka.amount.toFixed(2)}` });
  const words = [...ka.words].filter((w) => kb.words.has(w));
  if (words.length >= 2) (score += Math.min(3, words.length)), why.push({ kind: 'words', text: words.slice(0, 3).join(', ') });
  return { score, why };
}

/** A remembered «no» for two things, the same whichever order. */
export const noKey = (a, b) => [a, b].sort().join('|');

/**
 * «Doppelten Eingang erkennen»: pairs of entries from different sources (mail, photo, note) that look like
 * the same matter, best first, at most `max`. Pairs already in the same Vorgang or answered «no» are left out.
 * → [{ a, b, why }]
 */
export function doublePairs(notes = [], { no = [], now = Date.now(), max = 6 } = {}) {
  const nope = new Set(no);
  const recent = notes.filter((n) => n && n.id && now - msOf(n) <= LOOK_DAYS * DAY_MS);
  const out = [];
  for (let i = 0; i < recent.length; i++) {
    for (let j = i + 1; j < recent.length; j++) {
      const a = recent[i];
      const b = recent[j];
      if (sourceOf(a) === sourceOf(b)) continue;
      if (a.caseId && a.caseId === b.caseId) continue;
      if (Math.abs(msOf(a) - msOf(b)) > PAIR_DAYS * DAY_MS) continue;
      if (nope.has(noKey(a.id, b.id))) continue;
      const m = sameMatter(a, b);
      if (m.score >= 3) out.push({ a, b, why: m.why, score: m.score });
    }
  }
  return out.sort((x, y) => y.score - x.score || msOf(y.a) - msOf(x.a)).slice(0, max).map(({ a, b, why }) => ({ a, b, why }));
}

/** «Re: AW: Fwd: Buchung 123» → «buchung 123». */
export const subjectCore = (s) => String(s ?? '').replace(/^\s*((re|aw|wg|fw|fwd|antw)\s*:\s*)+/i, '').trim().toLowerCase();

/** What a mail is in its matter: 'confirm' | 'question' | 'bill' | null (a guess for the chip). */
export function mailRole(n) {
  const s = `${n?.mail?.subject ?? ''} ${n?.text ?? ''}`.toLowerCase();
  if (/\b(rechnung|invoice|zahlung|payment|mahnung|betrag|quittung|receipt)\b/.test(s)) return 'bill';
  if (/\b(bestätigung|bestaetigung|confirmation|confirmed|bestätigt|buchung|booking|reservation|reservierung|auftrag)\b/.test(s)) return 'confirm';
  if (/\?|\b(rückfrage|rueckfrage|frage|question|nachfrage|bitte um)\b/.test(s)) return 'question';
  return null;
}
export const ROLES = { confirm: 'Confirmation', question: 'Question|mail', bill: 'Bill|mail' };

/**
 * «Mail als Vorgang»: the Vorgang a mail without one may belong to, or null.
 * Same sender and the same subject (without Re:/AW:), a shared number, or same sender plus shared words.
 * → { caseId, why: 'subject' | 'number' | 'sender' }
 */
export function caseFor(note, notes = [], cases = [], { no = [] } = {}) {
  if (!note?.mail || note.caseId) return null;
  const ids = new Set(cases.map((c) => c.id));
  const nope = new Set(no);
  const from = senderOf(note);
  const core = subjectCore(note.mail.subject);
  const mine = keysOf(note);
  let best = null;
  for (const o of notes) {
    if (!o?.caseId || !ids.has(o.caseId) || o.id === note.id || nope.has(noKey(note.id, o.caseId))) continue;
    let why = null;
    let score = 0;
    if (o.mail && from && senderOf(o) === from && core && subjectCore(o.mail.subject) === core) (why = 'subject'), (score = 5);
    else if ([...mine.nums].some((x) => keysOf(o).nums.has(x))) (why = 'number'), (score = 4);
    else if (o.mail && from && senderOf(o) === from && sameMatter(note, o).why.some((w) => w.kind === 'words')) (why = 'sender'), (score = 2);
    if (why && (!best || score > best.score)) best = { caseId: o.caseId, why, score };
  }
  return best ? { caseId: best.caseId, why: best.why } : null;
}

/** The suggestions for all mails without a Vorgang: [{ note, caseId, why }]. */
export function caseSuggestions(notes = [], cases = [], opts = {}) {
  const out = [];
  for (const n of notes) {
    const s = caseFor(n, notes, cases, opts);
    if (s) out.push({ note: n, ...s });
  }
  return out;
}

/* ---------- the Vorgänge themselves (a group: add, rename, delete) ---------- */

/** The stored Vorgänge, made safe. */
export const casesOf = (v) => (Array.isArray(v) ? v.filter((c) => c && typeof c.id === 'string' && String(c.name ?? '').trim()) : []);
const caseId = () => `vg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
/** A name for a new Vorgang from its first entry (the subject or the first line). */
export const nameFrom = (n) => String(n?.mail?.subject || n?.title || String(n?.text ?? '').split('\n')[0] || '').replace(/^\s*((re|aw|wg|fw|fwd)\s*:\s*)+/i, '').trim().slice(0, 60);
/** A new Vorgang; null without a name. */
export function newCase(name, now = new Date().toISOString()) {
  const nm = String(name ?? '').trim().slice(0, 60);
  return nm ? { id: caseId(), name: nm, at: now } : null;
}
export const renameCase = (cases, id, name) => cases.map((c) => (c.id === id && String(name ?? '').trim() ? { ...c, name: String(name).trim().slice(0, 60) } : c));
export const dropCase = (cases, id) => cases.filter((c) => c.id !== id);
/** The entries of each Vorgang, newest first: { caseId: [note] }. */
export function entriesByCase(notes = []) {
  const out = {};
  for (const n of notes) if (n?.caseId) (out[n.caseId] ??= []).push(n);
  for (const k of Object.keys(out)) out[k].sort((a, b) => msOf(b) - msOf(a));
  return out;
}
/** The entries to change when a Vorgang goes: each moves to `to` (another Vorgang) or out (null). */
export const moveEntries = (notes, from, to) => notes.filter((n) => n.caseId === from).map((n) => ({ ...n, caseId: to ?? null }));
/** A remembered «no», at most CASE_NO_MAX. */
export const withNo = (list, key) => [key, ...(Array.isArray(list) ? list : []).filter((x) => x !== key)].slice(0, CASE_NO_MAX);
