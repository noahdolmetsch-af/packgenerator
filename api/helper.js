/**
 * POST /api/helper (v0.77.0 «KI-Helfer», Noah's answers 1–8 ★a, 10.10.2026)
 *
 * Authorization: Bearer <HELPER_TOKEN> (the «Helfer-Code» Noah types into the app's settings).
 * Body: { task: 'trip'|'search'|'debrief'|'checklist'|'maintenance'|'vision'|'status', input: {...}, model? }.
 * model (optional, 15.10.2026): one of MODEL_CHOICES; anything else uses HELPER_MODEL.
 * Answer: { ok: true, task, result, spend: { month, chf, cap } } — `status` only checks the code
 * and returns the month's spend (no call to Claude, no cost).
 *
 * Environment (names only; Noah sets the values in Vercel, see docs/ki-helfer-einrichten.md):
 *   ANTHROPIC_API_KEY, HELPER_TOKEN, HELPER_MODEL (default claude-sonnet-5-5),
 *   HELPER_MONTHLY_CHF (default 2), KV_REST_API_URL / KV_REST_API_TOKEN (Upstash Redis),
 *   GEMINI_API_KEY (free key from Google AI Studio), GEMINI_MODEL (default gemini-flash-latest),
 *   GEMINI_FALLBACKS (Ersatzmodelle, comma list, default gemini-flash-lite-latest,gemini-2.5-flash),
 *   GEMINI_DAILY (answers per day, default 200).
 *
 * «Gemini in der App» (Noah 19.10.2026 «a und b»): task 'gemini' with input { question, context, lang }
 * answers { text } from Google's free Gemini tier. No money is counted (the free tier costs nothing);
 * a day counter (helper:gemini:YYYY-MM-DD) keeps it inside the free limit and answers 429 { code:
 * 'daily_limit' } after GEMINI_DAILY answers. The monthly cap and the Claude credit do not apply.
 *
 * Monthly cap (Noah 7a): the estimated cost of every answer is added to helper:spend:YYYY-MM;
 * from the cap on every task answers 429 { code: 'monthly_cap' } until the next month.
 * Privacy: request bodies, keys and tokens are never logged or stored; only the spend counter is kept.
 *
 * New or changed variables only reach a new Production build. The project's Ignored Build Step
 * cancels a hand-made redeploy when api/ is unchanged, so a change here (merged to main) is the
 * simple way to restart the server with new variables (11.10.2026: HELPER_TOKEN was not seen).
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { route, json, needStore, redisEnv, pick, ApiError } from './_lib/core.js';
import { TASKS, TASK_NAMES, DEFAULT_MODEL, DEFAULT_CAP_CHF, pickModel, buildRequest, validate, costChf, monthKey, spendKey, forbiddenKey, pictureOf, PICTURE_MAX } from './_lib/helper.js';

export const MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
/**
 * Empty credit (Noah 18.10.2026 «1a und wenn das guthaben aufgebraucht ist, erlischt das feld in der app
 * überall»): Anthropic answers 400 invalid_request_error «Your credit balance is too low …». The server
 * answers 402 { code: 'no_credit' } and keeps CREDIT_KEY = 'empty' (the app hides the helper everywhere).
 * A later answer that works, or a status with probe (one tiny Haiku call, only while the key says empty),
 * deletes the key again; the health check (api/health) may read and clear the same key.
 */
export const CREDIT_KEY = 'helper:credit';
const CREDIT_TTL = 60 * 24 * 60 * 60;
export const isNoCredit = (status, msg) => status === 400 && /credit balance/i.test(String(msg?.error?.message ?? ''));
const PROBE_MODEL = 'claude-haiku-5-5';
const MAX_BODY = 400_000; // characters: 700 items with names fit easily
const SPEND_TTL = 70 * 24 * 60 * 60; // a month's counter stays a little over two months
export const GEMINI_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
export const GEMINI_DEFAULT_MODEL = 'gemini-flash-latest';
export const GEMINI_DEFAULT_DAILY = 200;
/** Ersatzmodelle (22.10.2026 «Gemini ausgelastet»): when the first model is full (503), over its free limit (429)
 * or gone (404), the next one is asked. GEMINI_FALLBACKS (comma list) replaces this list. */
export const GEMINI_DEFAULT_FALLBACKS = ['gemini-flash-lite-latest', 'gemini-2.5-flash'];
const GEMINI_RETRY_MS = 1200;
const geminiKeyError = (status, msg) => status === 401 || status === 403 || (status === 400 && /api key/i.test(String(msg?.error?.message ?? '')));

/**
 * One Gemini question with a second try and Ersatzmodelle: the first model gets a second try after a short
 * pause when Google is busy (500/503); then each fallback once. A wrong key stops at once. Every refusal is
 * logged with Google's own status word (never the key), so the Vercel log names the real cause.
 * → { res, msg, model, calls } for an answer, or { failure, calls } with failure
 *   'bad_key' | 'limit' (Google 429) | 'busy' (500/503) | 'no_model' (404) | 'unreachable' | 'error'.
 */
export async function askGeminiModels({ doFetch, key, models, body, wait = (ms) => new Promise((r) => setTimeout(r, ms)), log = (line) => console.log(line) }) {
  const seen = {};
  let calls = 0;
  for (const [i, model] of [...new Set(models.filter(Boolean))].entries()) {
    for (let attempt = 0; attempt < (i === 0 ? 2 : 1); attempt++) {
      if (attempt) await wait(GEMINI_RETRY_MS);
      let res;
      calls++;
      try {
        res = await doFetch(GEMINI_URL(model), { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key }, body });
      } catch {
        log(`gemini ${model}: unreachable`);
        seen.unreachable = true;
        break;
      }
      const msg = await res.json().catch(() => null);
      if (res.ok && msg) return { res, msg, model, calls };
      log(`gemini ${model}: ${res.status} ${String(msg?.error?.status ?? '')} ${String(msg?.error?.message ?? '').slice(0, 160)}`.trim());
      if (geminiKeyError(res.status, msg)) return { failure: 'bad_key', calls };
      if (res.status === 429) { seen.limit = true; break; }
      if (res.status === 404) { seen.gone = true; break; }
      if (res.status === 500 || res.status === 503) { seen.busy = true; continue; }
      seen.error = true;
      break;
    }
  }
  const failure = seen.limit ? 'limit' : seen.busy ? 'busy' : seen.error ? 'error' : seen.gone ? 'no_model' : 'unreachable';
  return { failure, calls };
}
export const geminiKey = (day) => `helper:gemini:${day}`;
const dayKey = (d) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });

export const geminiFallbacksOf = (list) => (list ? String(list).split(',').map((m) => m.trim()).filter(Boolean) : GEMINI_DEFAULT_FALLBACKS);

/** The helper's settings from the environment (read per request, never answered). */
export function helperEnv(e = process.env) {
  const cap = Number(pick('HELPER_MONTHLY_CHF', e));
  return {
    apiKey: pick('ANTHROPIC_API_KEY', e),
    token: pick('HELPER_TOKEN', e),
    model: pick('HELPER_MODEL', e) || DEFAULT_MODEL,
    cap: Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_CAP_CHF,
    geminiKey: pick('GEMINI_API_KEY', e),
    geminiModel: pick('GEMINI_MODEL', e) || GEMINI_DEFAULT_MODEL,
    geminiFallbacks: geminiFallbacksOf(pick('GEMINI_FALLBACKS', e)),
    geminiDaily: Number(pick('GEMINI_DAILY', e)) > 0 ? Number(pick('GEMINI_DAILY', e)) : GEMINI_DEFAULT_DAILY,
    ...redisEnv(e),
  };
}

/** Same code? In constant time (both sides hashed to the same length first). */
export function sameToken(given, want) {
  if (!given || !want) return false;
  const a = createHash('sha256').update(String(given)).digest();
  const b = createHash('sha256').update(String(want)).digest();
  return timingSafeEqual(a, b);
}

function bearer(request) {
  const m = /^Bearer\s+(\S{1,400})$/.exec(request.headers.get('authorization') ?? '');
  return m ? m[1] : null;
}

/** The input without its photo (the one field only the vision task may carry). */
const withoutPicture = ({ picture, ...rest }) => rest;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * «Tagebuch» (Noah 20.10.2026 «1a»: Gemini in the diary, only with a tick each time): input.mode picks a
 * diary job with its own instruction and more room (the diary text goes in `context`):
 * title (a title for one entry), tidy (punctuation of a dictated text, words kept), summary (a month in
 * a few warm sentences), ask (a question answered only from the given entries, with their dates).
 * «Eingaben überall» (Noah 26.10.2026): prompts (three writing prompts that fit a text of any page) and
 * highlights (the best of a text in 2–4 short lines); the page's name comes first in the context.
 */
export const DIARY_MODES = ['title', 'tidy', 'summary', 'ask', 'prompts', 'highlights'];
export const DIARY_CONTEXT = 12000;
const DIARY_SYSTEM = {
  de: {
    title: 'Du schlägst einen Titel für einen Tagebucheintrag vor. Antworte nur mit dem Titel: höchstens 6 Wörter, Schweizer Hochdeutsch («ss», nie «ß»), ohne Anführungszeichen, ohne Punkt am Ende.',
    tidy: 'Du räumst einen diktierten Tagebuchtext auf: Satzzeichen, Gross- und Kleinschreibung, Absätze, offensichtliche Hörfehler. Behalte die Wörter, den Ton und die Ich-Form. Erfinde nichts dazu, kürze nichts. Schweizer Hochdeutsch («ss», nie «ß»). Antworte nur mit dem aufgeräumten Text, ohne Einleitung.',
    summary: 'Du fasst Tagebucheinträge eines Zeitraums für die schreibende Person zusammen, in der Du-Form, warm und ruhig, 4 bis 8 Sätze, ohne Markdown-Überschriften. Nenne, was oft vorkam, schöne Momente und was sich verändert hat. Nur Beobachtung, keine Ratschläge, keine Diagnosen. Schweizer Hochdeutsch («ss», nie «ß»).',
    ask: 'Du beantwortest eine Frage zum eigenen Tagebuch der Person, nur aus den mitgegebenen Einträgen. Nenne das Datum der passenden Einträge. Wenn die Einträge die Antwort nicht enthalten, sag das ehrlich. Kurz, höchstens 6 Sätze, Du-Form, Schweizer Hochdeutsch («ss», nie «ß»), ohne Markdown-Überschriften.',
    prompts: 'Du gibst drei kurze Schreibanreize, die zum mitgegebenen Text passen und helfen, weiterzuschreiben. In eckigen Klammern steht die Seite der App. Je ein Anreiz pro Zeile, als offene Frage in der Du-Form, höchstens 12 Wörter, ohne Nummern, ohne Einleitung. Keine Ratschläge, keine Diagnosen. Schweizer Hochdeutsch («ss», nie «ß»).',
    highlights: 'Du nennst die schönsten oder wichtigsten Punkte des mitgegebenen Textes in 2 bis 4 kurzen Zeilen, je eine pro Zeile, ohne Nummern, ohne Einleitung. Nur was im Text steht, nichts erfinden. In eckigen Klammern steht die Seite der App. Schweizer Hochdeutsch («ss», nie «ß»).',
  },
  en: {
    title: 'Suggest a title for a diary entry. Answer only with the title: at most 6 words, no quotes, no full stop.',
    tidy: 'Tidy up a dictated diary text: punctuation, capitals, paragraphs, obvious mishearings. Keep the words, the tone and the first person. Add nothing, cut nothing. Answer only with the tidied text, no introduction.',
    summary: 'Summarise the diary entries of a period for the writer, addressing them as you, warm and calm, 4 to 8 sentences, no Markdown headings. Name what came up often, good moments and what changed. Observation only, no advice, no diagnosis.',
    ask: "Answer a question about the person's own diary, only from the given entries. Name the dates of the entries that fit. If the entries do not hold the answer, say so honestly. Short, at most 6 sentences, no Markdown headings.",
    prompts: 'Give three short writing prompts that fit the given text and help to write on. The page of the app is in square brackets. One prompt per line, as an open question addressing the person as you, at most 12 words, no numbers, no introduction. No advice, no diagnosis.',
    highlights: 'Name the most beautiful or important points of the given text in 2 to 4 short lines, one per line, no numbers, no introduction. Only what is in the text, invent nothing. The page of the app is in square brackets.',
  },
};

/** The Gemini request: a short system line, the question and (when ticked) the person's own context. */
export function geminiRequest({ question = '', context = '', lang = 'de', mode = '' } = {}) {
  const de = lang !== 'en';
  const diary = DIARY_MODES.includes(mode);
  const system = diary
    ? DIARY_SYSTEM[de ? 'de' : 'en'][mode]
    : de
      ? 'Du hilfst in der App «Pack Generator» (Bikepacking, Reisen, Velo-Pflege). Antworte auf Schweizer Hochdeutsch («ss», nie «ß»), kurz und konkret, höchstens 6 Sätze, ohne Markdown-Überschriften. Nutze die eigene Ausrüstung und Erkenntnisse der Person, wenn sie mitgegeben sind. Alles ist ein Vorschlag.'
      : 'You help inside the app "Pack Generator" (bikepacking, travel, bike care). Answer in English, short and concrete, at most 6 sentences, no Markdown headings. Use the person\'s own gear and learnings when given. Everything is a suggestion.';
  const text = context ? `${question}\n\n${context}` : question;
  return { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text }] }], generationConfig: { maxOutputTokens: diary ? 4096 : 1024, temperature: mode === 'tidy' ? 0.1 : 0.4 } };
}
/** The answer text of a Gemini response, tidied and bounded, or ''. */
export function geminiText(msg, max = 3000) {
  const parts = msg?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

/** The handler, with fetch and the environment injectable for the tests. */
export function makeHandler({ env = () => helperEnv(), doFetch = (...a) => fetch(...a), now = () => new Date(), wait } = {}) {
  async function gemini(request, cfg, input) {
    const question = typeof input?.question === 'string' ? input.question.trim().slice(0, 600) : '';
    const diary = DIARY_MODES.includes(input?.mode);
    if (question.length < 3) throw new ApiError(400, 'bad_request', 'gemini needs a question.');
    if (!cfg.geminiKey) throw new ApiError(503, 'not_set_up', 'Gemini is not set up on the server (GEMINI_API_KEY is missing).');
    const store = needStore(cfg, doFetch);
    const key = geminiKey(dayKey(now()));
    const used = Number(await store.get(key)) || 0;
    if (used >= cfg.geminiDaily) throw new ApiError(429, 'daily_limit', 'Gemini has answered enough for today.');
    const body = JSON.stringify(geminiRequest({ question, context: typeof input.context === 'string' ? input.context.slice(0, diary ? DIARY_CONTEXT : 2000) : '', lang: input.lang === 'en' ? 'en' : 'de', mode: diary ? input.mode : '' }));
    const got = await askGeminiModels({ doFetch, key: cfg.geminiKey, models: [cfg.geminiModel, ...(cfg.geminiFallbacks ?? GEMINI_DEFAULT_FALLBACKS)], body, wait });
    if (got.calls) {
      await store.incrbyfloat(key, got.calls);
      await store.expire(key, 3 * 24 * 60 * 60);
    }
    if (got.failure === 'bad_key') throw new ApiError(503, 'bad_key', 'Google refuses the Gemini key (wrong or expired).');
    if (got.failure === 'limit') throw new ApiError(429, 'google_limit', 'Google\'s free Gemini limit is reached for now.');
    if (got.failure === 'busy') throw new ApiError(503, 'busy', 'Gemini is busy right now. Try again in a minute.');
    if (got.failure === 'no_model') throw new ApiError(502, 'no_model', 'Google no longer offers the Gemini model.');
    if (got.failure === 'unreachable') throw new ApiError(502, 'upstream_unreachable', 'Gemini could not be reached.');
    if (got.failure) throw new ApiError(502, 'upstream_error', 'Gemini answered with an error.');
    const { msg } = got;
    const text = geminiText(msg, diary ? DIARY_CONTEXT : 3000);
    if (!text) throw new ApiError(502, 'no_answer', 'Gemini gave no usable answer.');
    return json(request, 200, { ok: true, task: 'gemini', result: { text } });
  }

  return route(
    {
      POST: async (request) => {
        const cfg = env();
        if (!cfg.token) throw new ApiError(503, 'not_set_up', 'The helper is not set up on the server (HELPER_TOKEN is missing).');
        if (!sameToken(bearer(request), cfg.token)) throw new ApiError(401, 'unauthorized', 'Wrong or missing helper code.');
        const text = await request.text();
        // Paket L2: the vision task carries one photo, so its body may be larger (checked again below).
        if (text.length > MAX_BODY + PICTURE_MAX) throw new ApiError(413, 'too_large', 'The request is too large.');
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          throw new ApiError(400, 'bad_request', 'The body is not JSON.');
        }
        const task = body?.task;
        const input = body?.input && typeof body.input === 'object' && !Array.isArray(body.input) ? body.input : null;
        if (task !== 'status' && task !== 'gemini' && (!TASK_NAMES.includes(task) || !input)) throw new ApiError(400, 'bad_request', `task must be one of ${TASK_NAMES.join(', ')}, with an input object.`);
        if (task !== 'vision' && text.length > MAX_BODY) throw new ApiError(413, 'too_large', 'The request is too large.');
        if (task === 'vision' && !pictureOf(input)) throw new ApiError(400, 'bad_request', 'The vision task needs one photo (JPEG, PNG or WebP).');
        if (input && forbiddenKey(task === 'vision' ? withoutPicture(input) : input)) throw new ApiError(400, 'forbidden_field', 'The request holds a field the helper never takes (photos, receipts, money, codes, health).');
        if (task === 'gemini') return gemini(request, cfg, input);

        const model = pickModel(body?.model, cfg.model);
        const store = needStore(cfg, doFetch);
        const month = monthKey(now());
        const spent = Number(await store.get(spendKey(month))) || 0;
        const spend = (chf) => ({ month, chf: round2(chf), cap: cfg.cap });
        let credit = (await store.get(CREDIT_KEY)) === 'empty' ? 'empty' : 'ok';
        if (task === 'status' && credit === 'empty' && body?.probe === true && cfg.apiKey) {
          // one tiny call (a few hundredths of a centime) to see whether the credit is back
          try {
            const r = await doFetch(MESSAGES_URL, {
              method: 'POST',
              headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
              body: JSON.stringify({ model: PROBE_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'ok' }] }),
            });
            const m = await r.json().catch(() => null);
            const c = m?.usage ? costChf(PROBE_MODEL, m.usage) : 0;
            if (c > 0) await store.incrbyfloat(spendKey(month), c);
            if (r.ok) (credit = 'ok'), await store.del(CREDIT_KEY);
          } catch {
            /* unreachable: the key stays as it is */
          }
        }
        if (task === 'status') return json(request, 200, { ok: true, task, model, credit, spend: spend(spent) });
        if (spent >= cfg.cap) throw new ApiError(429, 'monthly_cap', 'The monthly limit is reached; the helper pauses until next month.', { spend: spend(spent) });
        if (!cfg.apiKey) throw new ApiError(503, 'not_set_up', 'The helper is not set up on the server (ANTHROPIC_API_KEY is missing).');

        let res;
        try {
          res = await doFetch(MESSAGES_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify(buildRequest(task, input, model)),
          });
        } catch {
          throw new ApiError(502, 'upstream_unreachable', 'Claude could not be reached.', { spend: spend(spent) });
        }
        const msg = await res.json().catch(() => null);
        // Whatever came back was billed: count it before anything else can fail.
        const cost = msg?.usage ? costChf(msg.model || model, msg.usage) : 0;
        let total = spent;
        if (cost > 0) {
          total = Number(await store.incrbyfloat(spendKey(month), cost)) || spent + cost;
          await store.expire(spendKey(month), SPEND_TTL);
        }
        if (isNoCredit(res.status, msg)) {
          await store.set(CREDIT_KEY, 'empty', CREDIT_TTL);
          throw new ApiError(402, 'no_credit', 'The AI credit is used up.', { credit: 'empty', spend: spend(total) });
        }
        if (!res.ok || !msg) {
          if (res.status === 429 || res.status === 529) throw new ApiError(503, 'busy', 'Claude is busy right now. Try again in a minute.', { spend: spend(total) });
          throw new ApiError(502, 'upstream_error', 'Claude answered with an error.', { spend: spend(total) });
        }
        if (msg.stop_reason === 'refusal') throw new ApiError(502, 'refused', 'Claude did not answer this request.', { spend: spend(total) });
        const use = (msg.content ?? []).find((b) => b?.type === 'tool_use' && b.name === 'answer');
        if (!use || !use.input || typeof use.input !== 'object') throw new ApiError(502, 'no_answer', 'Claude gave no usable answer.', { spend: spend(total) });
        if (credit === 'empty') await store.del(CREDIT_KEY);
        return json(request, 200, { ok: true, task, result: validate(task, input, use.input), credit: 'ok', spend: spend(total) });
      },
    },
    'helper',
  );
}

export const POST = makeHandler();
export const OPTIONS = POST;
export { TASKS };
