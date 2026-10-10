/**
 * POST /api/helper (v0.67.0 «KI-Helfer», Noah's answers 1–8 ★a, 10.10.2026)
 *
 * Authorization: Bearer <HELPER_TOKEN> (the «Helfer-Code» Noah types into the app's settings).
 * Body: { task: 'trip'|'search'|'debrief'|'checklist'|'maintenance'|'status', input: {...} }.
 * Answer: { ok: true, task, result, spend: { month, chf, cap } } — `status` only checks the code
 * and returns the month's spend (no call to Claude, no cost).
 *
 * Environment (names only; Noah sets the values in Vercel, see docs/ki-helfer-einrichten.md):
 *   ANTHROPIC_API_KEY, HELPER_TOKEN, HELPER_MODEL (default claude-sonnet-5-5),
 *   HELPER_MONTHLY_CHF (default 5), KV_REST_API_URL / KV_REST_API_TOKEN (Upstash Redis).
 *
 * Monthly cap (Noah 7a): the estimated cost of every answer is added to helper:spend:YYYY-MM;
 * from the cap on every task answers 429 { code: 'monthly_cap' } until the next month.
 * Privacy: request bodies, keys and tokens are never logged or stored; only the spend counter is kept.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { route, json, needStore, redisEnv, pick, ApiError } from './_lib/core.js';
import { TASKS, TASK_NAMES, DEFAULT_MODEL, DEFAULT_CAP_CHF, buildRequest, validate, costChf, monthKey, spendKey, forbiddenKey } from './_lib/helper.js';

export const MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const MAX_BODY = 400_000; // characters: 700 items with names fit easily
const SPEND_TTL = 70 * 24 * 60 * 60; // a month's counter stays a little over two months

/** The helper's settings from the environment (read per request, never answered). */
export function helperEnv(e = process.env) {
  const cap = Number(pick('HELPER_MONTHLY_CHF', e));
  return {
    apiKey: pick('ANTHROPIC_API_KEY', e),
    token: pick('HELPER_TOKEN', e),
    model: pick('HELPER_MODEL', e) || DEFAULT_MODEL,
    cap: Number.isFinite(cap) && cap > 0 ? cap : DEFAULT_CAP_CHF,
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

const round2 = (n) => Math.round(n * 100) / 100;

/** The handler, with fetch and the environment injectable for the tests. */
export function makeHandler({ env = () => helperEnv(), doFetch = (...a) => fetch(...a), now = () => new Date() } = {}) {
  return route(
    {
      POST: async (request) => {
        const cfg = env();
        if (!cfg.token) throw new ApiError(503, 'not_set_up', 'The helper is not set up on the server (HELPER_TOKEN is missing).');
        if (!sameToken(bearer(request), cfg.token)) throw new ApiError(401, 'unauthorized', 'Wrong or missing helper code.');
        const text = await request.text();
        if (text.length > MAX_BODY) throw new ApiError(413, 'too_large', 'The request is too large.');
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          throw new ApiError(400, 'bad_request', 'The body is not JSON.');
        }
        const task = body?.task;
        const input = body?.input && typeof body.input === 'object' && !Array.isArray(body.input) ? body.input : null;
        if (task !== 'status' && (!TASK_NAMES.includes(task) || !input)) throw new ApiError(400, 'bad_request', `task must be one of ${TASK_NAMES.join(', ')}, with an input object.`);
        if (input && forbiddenKey(input)) throw new ApiError(400, 'forbidden_field', 'The request holds a field the helper never takes (photos, receipts, money, codes, health).');

        const store = needStore(cfg, doFetch);
        const month = monthKey(now());
        const spent = Number(await store.get(spendKey(month))) || 0;
        const spend = (chf) => ({ month, chf: round2(chf), cap: cfg.cap });
        if (task === 'status') return json(request, 200, { ok: true, task, model: cfg.model, spend: spend(spent) });
        if (spent >= cfg.cap) throw new ApiError(429, 'monthly_cap', 'The monthly limit is reached; the helper pauses until next month.', { spend: spend(spent) });
        if (!cfg.apiKey) throw new ApiError(503, 'not_set_up', 'The helper is not set up on the server (ANTHROPIC_API_KEY is missing).');

        let res;
        try {
          res = await doFetch(MESSAGES_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify(buildRequest(task, input, cfg.model)),
          });
        } catch {
          throw new ApiError(502, 'upstream_unreachable', 'Claude could not be reached.', { spend: spend(spent) });
        }
        const msg = await res.json().catch(() => null);
        // Whatever came back was billed: count it before anything else can fail.
        const cost = msg?.usage ? costChf(msg.model || cfg.model, msg.usage) : 0;
        let total = spent;
        if (cost > 0) {
          total = Number(await store.incrbyfloat(spendKey(month), cost)) || spent + cost;
          await store.expire(spendKey(month), SPEND_TTL);
        }
        if (!res.ok || !msg) {
          if (res.status === 429 || res.status === 529) throw new ApiError(503, 'busy', 'Claude is busy right now. Try again in a minute.', { spend: spend(total) });
          throw new ApiError(502, 'upstream_error', 'Claude answered with an error.', { spend: spend(total) });
        }
        if (msg.stop_reason === 'refusal') throw new ApiError(502, 'refused', 'Claude did not answer this request.', { spend: spend(total) });
        const use = (msg.content ?? []).find((b) => b?.type === 'tool_use' && b.name === 'answer');
        if (!use || !use.input || typeof use.input !== 'object') throw new ApiError(502, 'no_answer', 'Claude gave no usable answer.', { spend: spend(total) });
        return json(request, 200, { ok: true, task, result: validate(task, input, use.input), spend: spend(total) });
      },
    },
    'helper',
  );
}

export const POST = makeHandler();
export const OPTIONS = POST;
export { TASKS };
