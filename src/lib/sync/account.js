/**
 * Paket R (Noah 19.10.2026 «2a oder b»): «Mit Google anmelden» for the sync between devices, the app
 * side of api/_lib/account.js. The other way, without an account, is the pairing code or the invite
 * link (#/me/data?koppeln=…), as before.
 *
 * On this device only (meta table, never in a backup, never synced): 'syncAccount' { kind: 'google',
 * email, session, at }. The e-mail is only shown here; the server keeps none.
 */
export const ACCOUNT_URL = 'https://packgen-three.vercel.app/api/account';
export const ACCOUNT = 'syncAccount';
/** The page Google brings you back to. */
export const RETURN_HASH = '#/me/data';

export function accountApi(url = ACCOUNT_URL, doFetch = (...a) => fetch(...a)) {
  return async (step, body) => {
    let res;
    try {
      res = await doFetch(`${url}?step=${step}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    } catch {
      throw Object.assign(new Error('offline'), { code: 'offline' });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || 'server'), { code: data.code || (res.status === 404 ? 'not_ready' : 'server_error') });
    return data;
  };
}

/** The address Google should bring you back to: this app, on Ich › Daten und Backup. */
export const returnTo = (loc = location) => `${loc.origin}${loc.pathname}${RETURN_HASH}`;

/** Start the sign-in: → Google's page (the caller goes there). */
export async function startSignIn(api = accountApi(), loc = location) {
  const { url } = await api('start', { returnTo: returnTo(loc) });
  return url;
}

/** `konto=…` in the address after Google: { ticket } or { error } or null; and the address without it. */
export function readReturn(hash) {
  const m = String(hash ?? '').match(/[?&]konto=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const rest = String(hash)
    .replace(/[?&]konto=[A-Za-z0-9_-]+/, '')
    .replace(/[?&]error=[a-z_]+/, '')
    .replace(/^(#[^?]*)&/, '$1?');
  if (m[1] === 'error') return { error: (String(hash).match(/[?&]error=([a-z_]+)/) ?? [])[1] ?? 'denied', rest };
  return { ticket: m[1], rest };
}

/**
 * After Google: hand over the ticket with this device's code (`mine`, the one in use or a new one).
 * → { code, email, known } and the account kept on this device.
 */
export async function finishSignIn(db, ticket, mine, api = accountApi(), now = new Date().toISOString()) {
  const r = await api('redeem', { ticket, code: mine });
  await db.meta.put({ key: ACCOUNT, kind: 'google', email: r.email ?? '', session: r.session, at: now });
  return r;
}

export const readAccount = (db) => db.meta.get(ACCOUNT);

/** Sign out on this device. forget: also remove the account's code from the server. */
export async function signOut(db, { forget = false, api = accountApi() } = {}) {
  const a = await readAccount(db);
  if (a?.session) {
    try {
      await api(forget ? 'forget' : 'signout', { session: a.session });
    } catch (e) {
      if (forget) throw e; // nothing changed: the person can try again
    }
  }
  await db.meta.delete(ACCOUNT);
}
