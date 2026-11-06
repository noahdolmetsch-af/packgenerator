// Kern verkleinern (Noah 30.10.2026): the German texts are separate files (about 3 MB). A German app loads them first and
// only then the app itself, so every text that a module builds while it loads is German too (start.js is the app).
import { lang, loadDe } from './lib/i18n.svelte.js';
import { installTitleFlight } from './lib/nav/vtitle.js';
import { installDoubleTapGuard } from './lib/ui/doubletap.js';

// «Der Titel fliegt mit»: installed first, so it hears the address change before every other part of the app
installTitleFlight();
// «Doppeltipp-Schutz»: a second tap on the same «Save» within 450 ms does nothing, in every window
installDoubleTapGuard();

if (lang.v === 'de') await loadDe();
await import('./start.js');
