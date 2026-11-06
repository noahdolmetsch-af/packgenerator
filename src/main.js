// Kern verkleinern (Noah 30.10.2026): the German texts are separate files (about 3 MB). A German app loads them first and
// only then the app itself, so every text that a module builds while it loads is German too (start.js is the app).
import { lang, loadDe } from './lib/i18n.svelte.js';
import { installTitleFlight } from './lib/nav/vtitle.js';

// «Der Titel fliegt mit»: installed first, so it hears the address change before every other part of the app
installTitleFlight();

if (lang.v === 'de') await loadDe();
// Etappe 6 (E6-010): offline, now and then the app file could not be fetched ("Failed to fetch dynamically imported module")
// and the screen stayed empty, although the file is in the offline copy. One fresh start fixes it; the flag stops a loop.
const BOOT_RETRY = 'pg.bootRetry';
try {
  await import('./start.js');
  try { sessionStorage.removeItem(BOOT_RETRY); } catch { /* private window */ }
} catch (e) {
  let again = false;
  try { again = !sessionStorage.getItem(BOOT_RETRY); sessionStorage.setItem(BOOT_RETRY, '1'); } catch { /* no storage: no retry */ }
  if (again) location.reload();
  else throw e;
}
