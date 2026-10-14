/**
 * Bezahlfunktion, step 1 «vorbereiten» (Noah 14.10.2026 01:12 UTC): the app side, with no
 * visible part yet («für den Nutzer bleibt es im Front End vorerst unsichtbar»).
 *
 * - LOCKED is false: hasAccess() answers true for everyone, so nothing in the app is locked.
 *   Switching it on is a later decision with its own mockups.
 * - The licence (a signed note from /api/pay) lives only in localStorage on this device, never
 *   in IndexedDB, so it never travels in a backup.
 * - Ways to get one: Stripe payment (startCheckout → back with #…?pay=done&session_id=… →
 *   confirmFromUrl) or an unlock code (redeem). checkLicence asks the server again when a
 *   subscription's paid period is over.
 */
export const PAY_URL = 'https://packgen-three.vercel.app/api/pay';
export const LICENCE_LS = 'pg.pay.licence';
export const LOCKED = false;
/** «Pro» (Noah 14.10.2026 01:27 «1a»): these parts would need a paid plan once LOCKED is on. */
export const PRO_FEATURES = ['strava', 'fitbit', 'garmin'];

const nowS = () => Math.floor(Date.now() / 1000);

/** What the licence says (the app cannot check the signature; the server does in checkLicence). */
export function peek(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  try {
    const b = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const d = JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
    return d && d.v === 1 && typeof d.plan === 'string' ? d : null;
  } catch {
    return null;
  }
}

export function readLicence(ls = globalThis.localStorage) {
  try {
    return ls?.getItem(LICENCE_LS) || null;
  } catch {
    return null;
  }
}
export function writeLicence(token, ls = globalThis.localStorage) {
  try {
    if (token) ls?.setItem(LICENCE_LS, token);
    else ls?.removeItem(LICENCE_LS);
    return true;
  } catch {
    return false;
  }
}

/** Whether this device has a paid plan right now (by its own clock). */
export function isPaid(token = readLicence(), at = nowS()) {
  const d = peek(token);
  return !!d && (d.exp == null || d.exp > at);
}

/** May the app use this part? Always yes while LOCKED is false; only Pro parts ever need a plan. */
export function hasAccess(feature, { locked = LOCKED, token } = {}) {
  return !locked || !PRO_FEATURES.includes(feature) || isPaid(token ?? readLicence());
}

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
const post = (doFetch, step, data) => call(doFetch, `?step=${step}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const plans = (doFetch = fetch) => call(doFetch, '?step=plans');

/** { ok, url }: the Stripe page to open. */
export const startCheckout = (plan, returnTo = globalThis.location?.href, doFetch = fetch) => post(doFetch, 'checkout', { plan, returnTo });

/** After Stripe sends the browser back: read session_id from the address and keep the licence. */
export async function confirmFromUrl(href = globalThis.location?.href ?? '', doFetch = fetch, ls) {
  const m = /[?&]pay=done&session_id=(cs_test_[A-Za-z0-9]+)/.exec(href);
  if (!m) return { ok: false, code: 'none' };
  const r = await call(doFetch, `?step=confirm&session_id=${m[1]}`);
  if (r.ok && r.licence) writeLicence(r.licence, ls);
  return r;
}

export async function redeem(code, doFetch = fetch, ls) {
  const r = await post(doFetch, 'redeem', { code: String(code ?? '').trim() });
  if (r.ok && r.licence) writeLicence(r.licence, ls);
  return r;
}

/** Ask the server again (a renewed subscription comes back with a fresh licence). */
export async function checkLicence(doFetch = fetch, ls) {
  const token = readLicence(ls);
  if (!token) return { ok: true, valid: false };
  const r = await post(doFetch, 'check', { licence: token });
  if (r.ok && r.licence) writeLicence(r.licence, ls);
  return r;
}
