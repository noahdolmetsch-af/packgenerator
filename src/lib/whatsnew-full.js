// The whole list of «What is new» as plain data (no t(), no runes, so Node tests and the Playwright specs can import it):
// every version, newest first, and the German of the older versions. The app imports whatsnew-all.js, which adds the German.
import { WHATS_NEW as NEU } from './whatsnew.js';
import { NEWS_ARCHIV, NEWS_ARCHIV_DE } from './news/archiv.gen.js';
import { WHATS_NEW_ALT } from './whatsnew-alt.js';
import ALT_DE from './whatsnew-alt-de.js';

/** The German of the older versions. */
export const DE_OLDER = { ...ALT_DE, ...NEWS_ARCHIV_DE };

/** All versions, newest first: the news files (newest in whatsnew.js, older in archiv.gen.js), then the hand-numbered ones. */
export const WHATS_NEW = [...NEU, ...NEWS_ARCHIV, ...WHATS_NEW_ALT];
