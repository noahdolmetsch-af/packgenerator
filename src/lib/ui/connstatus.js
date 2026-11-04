/**
 * Shared status helpers for every connection (Noah 03.11.2026: «bei allen Verbindungen: läuft seit wann und wie
 * viel, zuletzt erfolgreich, abgebrochen und warum, Zeitlimit»). Pure functions, no UI; the Sync panel is the first user.
 *
 * - callWithTimeout(doFetch, url, init, ms): a fetch that ends after ms with an error whose .code is 'timeout'
 *   (no answer) or 'offline' (network failed at once). Never hangs.
 * - elapsedText(t, since, now): «12 s» or «2 min».
 * - runningLine(t, { since, now, progress, slowAfterS }): «Syncing … 12 s. 40 received so far.» + a hint after slowAfterS.
 * - failedLine(t, { reason, lastOkAt, when }): the reason plus «Last successful sync: …» or «Not synced successfully yet.»
 * Texts go through the t() passed in, so the German entries live in i18n/de/abgleich.js.
 */

/** @returns {Promise<Response>} */
export async function callWithTimeout(doFetch, url, init = {}, ms = 90_000) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  let timedOut = false;
  const timer = ctl ? setTimeout(() => { timedOut = true; ctl.abort(); }, ms) : null;
  try {
    return await doFetch(url, { ...init, signal: ctl?.signal });
  } catch {
    throw Object.assign(new Error(timedOut ? 'timeout' : 'offline'), { code: timedOut ? 'timeout' : 'offline' });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function elapsedText(t, since, now) {
  const s = Math.max(0, Math.round((now - since) / 1000));
  return s < 60 ? t('{n} s|sync', { n: s }) : t('{n} min|sync', { n: Math.floor(s / 60) });
}

/** progress: { phase: 'pull' | 'push' | '', n } */
export function runningLine(t, { since, now, progress = {}, slowAfterS = 120 }) {
  const s = Math.max(0, Math.round((now - since) / 1000));
  const part = progress.phase === 'pull' ? ` ${t('{n} received so far.', { n: progress.n })}` : progress.phase === 'push' ? ` ${t('{n} sent so far.', { n: progress.n })}` : '';
  const slow = s >= slowAfterS ? ` ${t('This takes unusually long. If it stays like this, close the app and open it again.')}` : '';
  return `${t('Syncing …')} ${elapsedText(t, since, now)}.${part}${slow}`;
}

export function failedLine(t, { reason, lastOkAt, when }) {
  return `${reason} ${lastOkAt ? t('Last successful sync: {when}.', { when: when(lastOkAt) }) : t('Not synced successfully yet.')}`;
}

/**
 * Generic fetch line for the other connections (Noah 03.11.2026 «1a», «2 Fitbit, Strava, Google dann Abgleich»):
 * «Fitbit: fetching … 12 s. 30 of 90 days fetched so far.» + a hint after slowAfterS. done/total are optional.
 */
export function fetchingLine(t, { name, since, now, done = 0, total = 0, unit = 'days', slowAfterS = 90 }) {
  const s = Math.max(0, Math.round((now - since) / 1000));
  const part = unit === 'rides' ? (done > 0 ? ` ${t('{n} rides received so far.', { n: done })}` : '') : total > 0 ? ` ${t('{n} of {total} days fetched so far.', { n: Math.min(done, total), total })}` : '';
  const slow = s >= slowAfterS ? ` ${t('This takes unusually long. It stops by itself after 2 minutes.')}` : '';
  return `${name}: ${t('fetching …')} ${elapsedText(t, since, now)}.${part}${slow}`;
}

/** «Last successful fetch: …» or «Not fetched successfully yet.» */
export function lastOkFetchLine(t, { lastOkAt, when }) {
  return lastOkAt ? t('Last successful fetch: {when}.', { when: when(lastOkAt) }) : t('Not fetched successfully yet.');
}

/** The one limit for a whole fetch of any connection (Noah 03.11.2026 «1a»): 2 minutes. */
export const FETCH_LIMIT_MS = 120_000;

/**
 * The reason for a failed fetch of any connection in one short sentence (Noah 03.11.2026 «3a»: the overview under
 * Me › Connections shows every connection the same way). Each page keeps its own, more exact text.
 */
export function reasonLine(t, code) {
  if (code === 'timeout') return t('It did not answer in time.');
  if (code === 'network' || code === 'offline') return t('There was no connection.');
  if (/login_needed|not_connected|unauthorized/.test(code)) return t('It needs a new login. Open it and connect again.');
  if (/busy|daily_cap/.test(code)) return t('It is busy right now. The app tries again later.');
  return t('The last fetch did not work.');
}
