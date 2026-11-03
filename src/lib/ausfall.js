// «Wenn ein Dienst ausfällt» (Noah 02.11.2026 «1a danach 3 und 4», 4a): weather, Strava and the helper depend on
// services outside the app. When one cannot be reached, every place says the same calm sentence and the rest of
// the app goes on. Pure. English keys for t(); German in i18n/de/ausfall.js.
import { t } from './i18n.svelte.js';

/** «Weather cannot be reached right now. You can keep working.» service: an already translated name. */
export const outageText = (service) => t('«{service}» cannot be reached right now. You can keep working.', { service });

/** The error to throw for a missing service: its message is the calm sentence, `outage` tells the page. */
export const outageError = (service) => Object.assign(new Error(outageText(service)), { outage: true });

/** Does this answer or error mean «the service is not there» (offline, server error, too many requests)? */
export function isOutage(statusOrError) {
  if (typeof statusOrError === 'number') return statusOrError >= 500 || statusOrError === 429 || statusOrError === 408;
  const e = statusOrError;
  // a failed fetch() is a TypeError in every browser; navigator.onLine false is offline
  return !!e && (e.name === 'TypeError' || e.name === 'AbortError' || /failed to fetch|network|load failed/i.test(String(e.message ?? '')));
}

/** Run a request; a missing service becomes the calm sentence, every other error stays as it is. */
export async function calm(service, run) {
  let res;
  try {
    res = await run();
  } catch (err) {
    if (isOutage(err)) throw outageError(service);
    throw err;
  }
  return res;
}
