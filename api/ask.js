/**
 * /api/ask «Frag Gemini» (Noah 23.11.2026 «1a 2a 3a 4b»): the app's question to Gemini's free tier.
 *
 *   POST { mode: 'ask'|'report'|'command', text, image?: { mime, data (base64) }, lang, today }
 *     → ask:     { ok, text }
 *       report:  { ok, points: [{ text, kind }] }
 *       command: { ok, actions: [{ kind: 'remind'|'list'|'note'|'value', … }] }
 *
 * The key (GEMINI_API_KEY) lives only in Vercel. Only the app and the previews may call it (origin check, CORS), at most
 * 150 times a day (daycap.js), nothing is stored and nothing of a question is logged (a failed call logs model names and codes). Without a card on the Gemini key it cannot cost anything:
 * when the free limit is used up Gemini answers «busy» and the app offers «Weiter fragen bei …» instead.
 */
import { route, json, ApiError, allowedOrigin, pick } from './_lib/core.js';
import { cleanBody, askGemini, shape, KEY_NAMES, MAX_BODY_CHARS, modelsOf } from './_lib/ask.js';

export function makeHandler({ env = process.env, doFetch, timeout } = {}) {
  return route(
    {
      POST: async (request) => {
        if (!allowedOrigin(request.headers.get('origin'))) throw new ApiError(403, 'origin_not_allowed', 'Only the app may ask.');
        const raw = await request.text();
        if (raw.length > MAX_BODY_CHARS) throw new ApiError(413, 'too_big', 'The question is too big.');
        let body = null;
        try {
          body = JSON.parse(raw);
        } catch {
          throw new ApiError(400, 'bad_json', 'The question cannot be read.');
        }
        const req = cleanBody(body);
        const answer = await askGemini(req, { key: pick(KEY_NAMES, env), models: modelsOf(env), doFetch, timeout });
        return json(request, 200, shape(req.mode, answer));
      },
    },
    'ask',
  );
}

const handler = makeHandler();
export const POST = handler;
export const OPTIONS = handler;
