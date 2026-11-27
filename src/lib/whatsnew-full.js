// The whole list of «What is new» as plain data (no t(), no runes, so Node tests and the Playwright specs can import it):
// every version, newest first, and the German of the older versions. The app imports whatsnew-all.js, which adds the German.
import { WHATS_NEW as NEU } from './whatsnew.js';
import { NEWS_ARCHIV, NEWS_ARCHIV_DE } from './news/archiv.gen.js';
import { WHATS_NEW_ALT } from './whatsnew-alt.js';
import ALT_DE from './whatsnew-alt-de.js';
import { PR_ALT } from './whatsnew-alt-pr.js';
import { NEWS_OHNE } from './news/ohne.gen.js';

/** The German of the older versions. */
export const DE_OLDER = { ...ALT_DE, ...NEWS_ARCHIV_DE };

/** All versions, newest first: the news files (newest in whatsnew.js, older in archiv.gen.js), then the hand-numbered ones. */
export const WHATS_NEW = [...NEU, ...NEWS_ARCHIV, ...WHATS_NEW_ALT];

/**
 * The releases nobody sees (a merge with no news file: a test, a rule, a repair), newest first: { version, date, time?, pr?, title }.
 * They are no entries of WHATS_NEW (nothing to try), so every count of «What is new» stays as it was. Where they show: the page of all
 * releases («Nothing to test»).
 */
export const RELEASES_OHNE = NEWS_OHNE;

/** The GitHub PR number of an entry of WHATS_NEW (or of RELEASES_OHNE): from its merge commit, for the hand-numbered ones from PR_ALT; null if unknown (a shallow clone has no history). */
export const prOf = (e) => e?.pr ?? PR_ALT[e?.version] ?? null;
