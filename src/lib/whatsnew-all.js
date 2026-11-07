// The whole list of «What is new»: every version with all its texts, English and German. It is not part of the start (Tempo,
// 05.11.2026, Noah «a»; scripts/size-guard.mjs): the start reads whatsnew.js (the newest few in full, a short line for every
// version). The page «What is new», «Way and releases» and the list in «What the app can do» import this file, so it loads with
// them. Importing it also adds the German of the older versions to t(). Tests that want the whole list import it too.
import { WHATS_NEW, DE_OLDER } from './whatsnew-full.js';
import { addDe } from './i18n.svelte.js';

addDe(DE_OLDER);
export { WHATS_NEW, DE_OLDER };
