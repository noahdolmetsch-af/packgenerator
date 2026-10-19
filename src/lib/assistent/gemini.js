/**
 * «Gemini in der App» (Noah 19.10.2026 «a und b»): a free AI answers inside the app, through the app's
 * own server (api/helper.js, task «gemini»; the free Gemini key lives only in Vercel). It uses the same
 * Helfer-Code as the AI helper (Ich › KI-Helfer), but no money: the free tier, with a daily limit.
 * Only the question goes along, plus the gear and learnings that fit when the tick is set.
 *
 * askGemini(question, { context, lang }) → { ok: true, text } | { ok: false, error }
 * error: 'off' (no Helfer-Code) | 'offline' | 'auth' | 'server' (no key on the server) | 'limit' | 'busy' | 'error'
 */
import { db } from '../db.js';
import { HELPER_URL, HELPER_KEY, settingsOf } from '../helper/client.svelte.js';
import { t } from '../i18n.svelte.js';

const TIMEOUT = 45_000;

export async function askGemini(question, { context = '', lang = 'de', fetchFn = (...a) => fetch(...a) } = {}) {
  const s = settingsOf((await db.settings.get(HELPER_KEY).catch(() => null))?.value);
  if (!s.code) return { ok: false, error: 'off' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, error: 'offline' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  let res;
  try {
    res = await fetchFn(HELPER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.code}` },
      body: JSON.stringify({ task: 'gemini', input: { question: String(question).slice(0, 600), context: String(context).slice(0, 2000), lang } }),
      signal: ctl.signal,
    });
  } catch {
    return { ok: false, error: 'offline' };
  } finally {
    clearTimeout(timer);
  }
  const body = await res.json().catch(() => null);
  if (res.ok && body?.ok && typeof body.result?.text === 'string') return { ok: true, text: body.result.text };
  if (res.status === 401) return { ok: false, error: 'auth' };
  if (res.status === 429) return { ok: false, error: 'limit' };
  if (res.status === 503 && body?.code === 'busy') return { ok: false, error: 'busy' };
  if (res.status === 503) return { ok: false, error: 'server' };
  return { ok: false, error: 'error' };
}

/** One calm line per error. */
export function geminiError(error) {
  if (error === 'off') return t('Gemini needs the helper code from Me › AI helper (no money: Gemini is free).');
  if (error === 'offline') return t('Offline right now. Gemini answers again once you are online.');
  if (error === 'auth') return t('The helper code is not right. Check it in the settings.');
  if (error === 'server') return t('Gemini is not set up on the server yet (the free key is missing).');
  if (error === 'limit') return t('Gemini has answered enough for today (free daily limit). Tomorrow it answers again.');
  if (error === 'busy') return t('Gemini is busy right now. Try again in a minute.');
  return t('Gemini could not answer this time.');
}
