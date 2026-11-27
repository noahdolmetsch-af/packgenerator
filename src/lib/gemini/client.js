/**
 * «Frag Gemini» (Noah 23.11.2026 «1a 2a 3a 4b»): the app's side of /api/ask (api/ask.js). A free question to
 * Gemini's free tier, over the small server (the key lives only there). Only the question and one small photo go out,
 * never the person's data. Every call can fail: no internet, the free limit for now used up (`busy`), the server
 * without a key (`not_set_up`); the page then offers «Weiter fragen bei …» and the app's own answer instead.
 */
export const ASK_URL = 'https://packgen-three.vercel.app/api/ask';

/** The reason for a failed call, from the server's answer: 'busy' | 'not_set_up' | 'too_big' | 'failed'. */
export function reasonOf(status, code) {
  if (status === 429 || code === 'busy' || code === 'daily_cap') return 'busy';
  if (code === 'not_set_up') return 'not_set_up';
  if (status === 413 || code === 'image_too_big' || code === 'too_long') return 'too_big';
  return 'failed';
}

/**
 * Asks Gemini. mode: 'ask' | 'report' | 'command'. → { ok: true, text } | { ok: true, points } | { ok: true, actions }
 * or { ok: false, reason: 'offline' | 'busy' | 'not_set_up' | 'too_big' | 'failed', detail? }.
 */
export async function askGemini({ mode = 'ask', text, image = null, lang = 'de', today = '' }, { doFetch = (...a) => fetch(...a), url = ASK_URL } = {}) {
  let res;
  try {
    res = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, text, lang, today, ...(image ? { image: { mime: image.mime, data: image.data } } : {}) }),
      signal: AbortSignal.timeout?.(40_000), // the server keeps to about 25 s; a hanging line does not leave «Frage …» for ever
    });
  } catch {
    return { ok: false, reason: 'offline' };
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.ok) {
    // what the server says about a failure (the HTTP code, its code, the models tried with their codes): no private data in it
    const tried = Array.isArray(body?.tried) ? body.tried.slice(0, 8).join(' ') : '';
    const detail = [res.status, typeof body?.code === 'string' ? body.code : '', tried].filter(Boolean).join(' ').slice(0, 200);
    return { ok: false, reason: reasonOf(res.status, body?.code), detail };
  }
  return body;
}
