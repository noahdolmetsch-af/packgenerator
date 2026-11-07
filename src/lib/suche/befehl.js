/**
 * «Mit der App sprechen», Etappe 2 (Noah 07.11.2026 «1b 2a 3a 4a 5a»): a sentence the rules (say.js) do not
 * understand goes to Gemini (free, through api/helper.js, task «gemini», mode «command»). Gemini only translates the
 * sentence into actions from a fixed list; this file checks every value again and turns them into the same actions
 * the rules make (act.js), so the same code writes them, with the same Undo. 3a: what Gemini understood is always
 * shown first («Ich würde das tun»), nothing is written before the tap on «Ok». 4a: only the sentence, today's date
 * and the NAMES of the bikes and trips go along; no notes, photos, health values or backups.
 *
 *   looksLikeCommand(text)             an instruction (not a question), three words or more
 *   contextOf({ today, bikes, trips }) the context line block for Gemini
 *   askCommand(text, ctx)              → { ok: true, steps } | { ok: false, error }
 *   fromAi(raw, { today, bikes })      → steps [{ act, choices? }]: act is an action of act.js; choices: bikes to pick from
 */
import { askGemini } from '../assistent/gemini.js';
import { commandActions } from '../search.js';
import { actionLabel } from './act.js';
import { lang } from '../i18n.svelte.js';

const fold = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const QUESTION = /^(?:wie|was|wann|wo|wer|wem|wen|welche[rsmn]?|warum|wieso|weshalb|wozu|womit|wieviel\w*|how|what|when|where|who|which|why)\b/;

/** An instruction, not a question: no «?», no question word first, at least three words, at most 200 signs. */
export function looksLikeCommand(text) {
  const s = String(text ?? '').trim();
  if (!s || s.length > 200 || s.includes('?')) return false;
  if (QUESTION.test(fold(s))) return false;
  return s.split(/\s+/).filter(Boolean).length >= 3;
}

const names = (list, n) => list.map((x) => String(x?.name ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, n).join('; ');

/** The context for Gemini: today and the names of bikes and trips (4a: nothing else). */
export function contextOf({ today, bikes = [], trips = [] }) {
  return [`today: ${today}`, `bikes: ${names(bikes, 12)}`, `trips: ${names(trips, 12)}`].join('\n');
}

const CARE_SAY = { chain: 'kette gewachst', sealant: 'dichtmilch', wash: 'velo gewaschen' };
const VALUE = { weight: { qid: 'koerper.waage', min: 20, max: 300, unit: 'kg' }, pulse: { qid: 'koerper.ruhepuls', min: 25, max: 220, unit: 'bpm' }, sleep: { qid: 'erholung.schlaf', min: 1, max: 10 } };
const isDay = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x ?? '')) && !Number.isNaN(Date.parse(`${x}T12:00:00Z`));
const text = (x, max) => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const cap = (x) => x.replace(/^\p{Ll}/u, (c) => c.toUpperCase());

/** Gemini's actions → steps. Anything unknown or out of range is dropped; nothing here writes. */
export function fromAi(raw, { today, bikes = [] } = {}) {
  const steps = [];
  for (const a of Array.isArray(raw) ? raw.slice(0, 8) : []) {
    if (a?.kind === 'list') {
      const points = (Array.isArray(a.points) ? a.points : []).map((x) => cap(text(x, 80))).filter(Boolean).slice(0, 40);
      const name = text(a.name, 60);
      if (name || points.length) steps.push({ act: { kind: 'list', name, points, writes: true } });
    } else if (a?.kind === 'todo') {
      const tx = cap(text(a.text, 120));
      if (tx) steps.push({ act: { kind: 'remind', text: tx, due: isDay(a.due) && a.due >= today ? a.due : null, writes: true } });
    } else if (a?.kind === 'note') {
      const tx = text(a.text, 300);
      if (tx) steps.push({ act: { kind: 'cmd', cmd: { kind: 'note', text: tx }, writes: true } });
    } else if (a?.kind === 'value') {
      const v = VALUE[a.valueKind];
      if (v && typeof a.value === 'number' && a.value >= v.min && a.value <= v.max) steps.push({ act: { kind: 'value', qid: v.qid, value: a.value, ...(v.unit ? { unit: v.unit } : {}), writes: true } });
    } else if (a?.kind === 'care' && CARE_SAY[a.careKind]) {
      const found = commandActions(`${CARE_SAY[a.careKind]} ${text(a.bike, 60)}`, { bikes, more: false }).filter((c) => c.kind === a.careKind);
      const acts = found.map((c) => ({ kind: 'cmd', cmd: c.cmd, title: c.title, writes: true }));
      if (acts.length === 1) steps.push({ act: acts[0] });
      else if (acts.length > 1) steps.push({ act: acts[0], choices: acts });
    } else if (a?.kind === 'plan') {
      const days = typeof a.days === 'number' ? Math.min(30, Math.max(1, Math.round(a.days))) : null;
      steps.push({ act: { kind: 'plan', days, title: cap(text(a.title, 80)), start: isDay(a.start) ? a.start : null, writes: false } });
    } else if (a?.kind === 'weather') steps.push({ act: { kind: 'weather', place: text(a.place, 60), writes: false } });
  }
  return steps;
}

/** Asks Gemini; → { ok: true, steps } (steps may be empty: it was no instruction) | { ok: false, error } (see geminiError). */
export async function askCommand(sentence, { today, bikes = [], trips = [] }, { fetchFn } = {}) {
  const r = await askGemini(String(sentence).slice(0, 300), { context: contextOf({ today, bikes, trips }), lang: lang.v === 'en' ? 'en' : 'de', mode: 'command', ...(fetchFn ? { fetchFn } : {}) });
  if (!r.ok) return r;
  let data;
  try {
    data = JSON.parse(r.text);
  } catch {
    return { ok: false, error: 'error' };
  }
  return { ok: true, steps: fromAi(data?.actions, { today, bikes }) };
}

/** The shown line of a step. */
export const stepLabel = (s, today) => actionLabel(s.act, today);
