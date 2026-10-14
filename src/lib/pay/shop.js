/**
 * Bezahlfunktion, Grundgerüst Shop und Buchung (Noah 14.10.2026 «6 a und b», «7 beides
 * vorbereiten»): the app side, invisible for now. The app sends ids and amounts; the server
 * knows the prices (api/_lib/shop.js).
 */
import { PAY_URL } from './licence.js';

async function call(doFetch, path, init) {
  let res;
  try {
    res = await doFetch(`${PAY_URL}${path}`, init);
  } catch {
    return { ok: false, code: 'offline' };
  }
  const body = await res.json().catch(() => ({}));
  return res.ok ? { ok: true, ...body } : { ok: false, code: body.code ?? 'server_error' };
}

export const catalog = (doFetch = fetch) => call(doFetch, '?step=catalog');

/** lines: [{ id, qty, slot? }] → { ok, url } (the Stripe page to open). */
export const startOrder = (lines, returnTo = globalThis.location?.href, doFetch = fetch) =>
  call(doFetch, '?step=order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lines, returnTo }) });
