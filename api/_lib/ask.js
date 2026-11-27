/**
 * «Frag Gemini» (Noah 23.11.2026 «1a 2a 3a 4b»): the pure parts of /api/ask. The app sends one question (text, or text
 * and one small photo); the server adds the key (only in Vercel, never in the code), asks Gemini's free tier and
 * hands back the answer. Three jobs: `ask` (a plain answer), `report` (a spoken trip report cut into points) and
 * `command` (a sentence → actions the app shows first and only does after a tap).
 *
 * Nothing is stored here, and nothing of the question is logged (only the model names and HTTP codes of a failed call). Only the
 * question and the photo go out, never the person's data: the app adds names (bikes, trips) only when the person ticked it.
 */
import { ApiError } from './core.js';

export const KEY_NAMES = ['GEMINI_API_KEY'];
export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const DEFAULT_FALLBACKS = ['gemini-2.5-flash-lite'];
export const MODES = ['ask', 'report', 'command'];
export const MAX_TEXT = { ask: 1500, report: 2400, command: 400 };
/** A photo is made small in the app (about 1024 px, JPEG); more than this is refused. */
export const MAX_IMAGE_CHARS = 1_800_000;
export const MAX_BODY_CHARS = 2_000_000;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const REPORT_KINDS = ['learn', 'unused', 'missing', 'bike', 'note'];
export const COMMAND_KINDS = ['remind', 'list', 'note', 'value'];
export const VALUE_IDS = { 'koerper.waage': [20, 300], 'koerper.ruhepuls': [25, 220], 'erholung.schlaf': [1, 10] };

const STYLE =
  'Write in {lang}. Plain words, short sentences, no markdown, no emojis. Swiss spelling: «ss», never «ß». Never invent facts about the person: you do not know their data.';

/** The standing instruction for a job. */
export function instructionFor(mode, { lang = 'de', today = '' } = {}) {
  const l = lang === 'en' ? 'English' : 'German';
  const style = STYLE.replace('{lang}', l);
  if (mode === 'report')
    return `You sort a short spoken report of a bike or outdoor trip into key points. ${style} Answer only with JSON: {"points":[{"text":"…","kind":"…"}]}. At most 8 points, each one short sentence in the words of the speaker (do not add anything). kind is one of: learn (a lesson for next time), unused (something taken along and not needed), missing (something that was missing or forgotten), bike (a problem or job on the bike), note (anything else worth keeping).`;
  if (mode === 'command')
    return `You turn one spoken or typed sentence into actions for a personal planner app. ${style} Today is ${today || 'unknown'} (YYYY-MM-DD). Answer only with JSON: {"actions":[…]}. Allowed actions: {"kind":"remind","text":"…","due":"YYYY-MM-DD"} (a to-do or reminder; due optional), {"kind":"list","name":"…","points":["…"]} (a list with points, at most 20), {"kind":"note","text":"…"} (a note), {"kind":"value","qid":"koerper.waage"|"koerper.ruhepuls"|"erholung.schlaf","value":number} (weight in kg, resting heart rate, sleep 1 to 10). At most 4 actions. If the sentence is none of these, answer {"actions":[]}. Never delete, never change anything else.`;
  return `You are a short, friendly helper inside a personal app for preparing and packing bike and outdoor trips, caring for bikes and the everyday. Answer simple questions in at most five short sentences. If a photo is given, say what you see and what it means for the question. ${style} For health questions give no diagnosis: say what is usually helpful and when to ask a doctor.`;
}

/** The request body from the app → { mode, text, image, lang, today }, or an ApiError 400. */
export function cleanBody(body) {
  const b = body && typeof body === 'object' ? body : {};
  const mode = MODES.includes(b.mode) ? b.mode : 'ask';
  const text = String(b.text ?? '').replace(/\s+/g, ' ').trim();
  if (!text) throw new ApiError(400, 'no_question', 'The question is empty.');
  if (text.length > MAX_TEXT[mode]) throw new ApiError(400, 'too_long', 'The question is too long.');
  let image = null;
  if (b.image != null) {
    if (mode !== 'ask') throw new ApiError(400, 'no_image_here', 'A photo only goes with a question.');
    const mime = String(b.image?.mime ?? '');
    const data = String(b.image?.data ?? '');
    if (!IMAGE_TYPES.includes(mime) || !/^[A-Za-z0-9+/=]+$/.test(data) || data.length < 100) throw new ApiError(400, 'bad_image', 'The photo cannot be read.');
    if (data.length > MAX_IMAGE_CHARS) throw new ApiError(413, 'image_too_big', 'The photo is too big.');
    image = { mime, data };
  }
  const today = /^\d{4}-\d{2}-\d{2}$/.test(String(b.today ?? '')) ? b.today : '';
  return { mode, text, image, lang: b.lang === 'en' ? 'en' : 'de', today };
}

/** The Gemini request for a job. */
export function geminiRequest({ mode, text, image, lang, today }) {
  const parts = [{ text }];
  if (image) parts.push({ inlineData: { mimeType: image.mime, data: image.data } });
  const json = mode !== 'ask';
  return {
    systemInstruction: { parts: [{ text: instructionFor(mode, { lang, today }) }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: json ? 0.1 : 0.4, maxOutputTokens: json ? 900 : 600, ...(json ? { responseMimeType: 'application/json' } : {}) },
  };
}

/** The text of Gemini's answer (all text parts joined), '' when there is none. */
export function answerText(res) {
  const parts = res?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('').trim() : '';
}

/** JSON out of an answer, also when it came wrapped in a code fence; null when it is not JSON. */
export function parseJson(s) {
  const raw = String(s ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

/** The points of a report: only known kinds, short, at most 8. */
export function pointsOf(j) {
  const list = Array.isArray(j?.points) ? j.points : [];
  return list
    .map((p) => ({ text: str(p?.text, 240), kind: REPORT_KINDS.includes(p?.kind) ? p.kind : 'note' }))
    .filter((p) => p.text.length >= 3)
    .slice(0, 8);
}

/** The actions of a command: only the four known kinds, checked one by one, at most 4. */
export function actionsOf(j) {
  const list = Array.isArray(j?.actions) ? j.actions : [];
  const out = [];
  for (const a of list) {
    if (a?.kind === 'remind' && str(a.text, 120)) out.push({ kind: 'remind', text: str(a.text, 120), due: /^\d{4}-\d{2}-\d{2}$/.test(String(a.due ?? '')) ? a.due : null });
    else if (a?.kind === 'note' && str(a.text, 400)) out.push({ kind: 'note', text: str(a.text, 400) });
    else if (a?.kind === 'list') {
      const points = (Array.isArray(a.points) ? a.points : []).map((x) => str(x, 80)).filter(Boolean).slice(0, 20);
      if (str(a.name, 60) || points.length) out.push({ kind: 'list', name: str(a.name, 60), points });
    } else if (a?.kind === 'value' && VALUE_IDS[a.qid]) {
      const v = Number(a.value);
      const [lo, hi] = VALUE_IDS[a.qid];
      if (Number.isFinite(v) && v >= lo && v <= hi) out.push({ kind: 'value', qid: a.qid, value: v });
    }
  }
  return out.slice(0, 4);
}

/** The models to try in order: GEMINI_MODEL (or the default), then the fallbacks. */
export function modelsOf(e = process.env) {
  const first = String(e.GEMINI_MODEL ?? '').trim() || DEFAULT_MODEL;
  const more = String(e.GEMINI_FALLBACKS ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return [...new Set([first, ...(more.length ? more : DEFAULT_FALLBACKS)])];
}

/** The newest working model found by the last model list (kept while the server is warm, so the list is asked once). */
let remembered = '';
/** For tests: forget the remembered model. */
export const forgetModel = () => { remembered = ''; };

/** The «gemini-N-flash» models the key may use, newest first (flash before flash-lite of the same version), from the model list. */
export function flashModelsOf(list) {
  const out = [];
  for (const m of Array.isArray(list?.models) ? list.models : []) {
    const hit = /^models\/(gemini-(\d+(?:\.\d+)?)-flash(-lite)?)$/.exec(String(m?.name ?? ''));
    if (!hit || !(m.supportedGenerationMethods ?? []).includes('generateContent')) continue;
    out.push({ name: hit[1], version: Number(hit[2]), lite: !!hit[3] });
  }
  return out.sort((a, b) => b.version - a.version || Number(a.lite) - Number(b.lite)).map((m) => m.name);
}

/**
 * Asks Gemini, trying the next model when one is unknown (404), refused (400, 403), busy (429) or down (5xx). Models are
 * retired now and then (and a new key may not get the old ones): when every listed model fails, the key's own model list is
 * read and the newest flash model that works is used (and remembered).
 * → { text } or an ApiError: 503 not_set_up (no key), 429 busy (every model over its free limit), 502 ai_unavailable
 * (with `tried`: the model names and HTTP codes, nothing else, so a failure can be understood).
 */
export async function askGemini(req, { key, models = modelsOf(), doFetch = (...a) => fetch(...a), timeout = 20_000 } = {}) {
  if (!key) throw new ApiError(503, 'not_set_up', 'Gemini is not set up on the server.');
  let busy = false;
  const tried = [];
  const attempt = async (model) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    let res;
    try {
      res = await doFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(geminiRequest(req)),
        signal: ctl.signal,
      });
    } catch {
      tried.push(`${model}:net`);
      return '';
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 429) busy = true;
    if (!res.ok) {
      tried.push(`${model}:${res.status}`);
      return '';
    }
    const text = answerText(await res.json().catch(() => null));
    if (!text) tried.push(`${model}:empty`);
    return text;
  };
  for (const model of [...new Set([remembered, ...models].filter(Boolean))]) {
    const text = await attempt(model);
    if (text) return { text };
  }
  if (!busy) {
    // every listed model failed for another reason than the free limit: ask the key which models it has
    let found = [];
    try {
      const res = await doFetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
      if (res.ok) found = flashModelsOf(await res.json().catch(() => null));
      else tried.push(`list:${res.status}`);
    } catch {
      tried.push('list:net');
    }
    for (const model of found.filter((m) => !tried.some((t) => t.startsWith(`${m}:`))).slice(0, 3)) {
      const text = await attempt(model);
      if (text) {
        remembered = model;
        return { text };
      }
    }
  }
  if (busy) throw new ApiError(429, 'busy', 'Gemini is busy or its free limit for now is used up.', { tried });
  console.error(`ask: no model answered (${tried.join(' ')})`); // names and codes only, never the question
  throw new ApiError(502, 'ai_unavailable', 'Gemini did not answer.', { tried });
}

/** The answer for the app: { ok, text } | { ok, points } | { ok, actions }. */
export function shape(mode, { text }) {
  if (mode === 'report') return { ok: true, points: pointsOf(parseJson(text)) };
  if (mode === 'command') return { ok: true, actions: actionsOf(parseJson(text)) };
  return { ok: true, text: text.replace(/[*_`#]+/g, '').trim() };
}
