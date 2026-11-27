/**
 * «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): after an update every news entry (one release, one PR) can be tested and
 * answered with «Works» or «Does not work». The answer is an entry of the log (logbuch.js, field `release`), so it is kept on the
 * device and in the backup like every other note, and «Does not work» is a normal entry of the kind «Error» that the improvement
 * order (auftrag.js) names with its release and PR. Pure: no database, no texts for the screen (the pages bring t()).
 */
import { makeEntry, cleanRelease } from './logbuch.js';
import { DEFAULT_KINDS, artList } from './kinds.js';

/** The release of a news entry: { version, pr, title } (the title in English, the key of t()). */
export const releaseOfNews = (e, pr = null) => cleanRelease({ version: e?.version, pr: pr ?? e?.pr ?? null, title: e?.title ?? '' });

/** The test steps of a news entry (plain English keys), [] when there is nothing to test. */
export const stepsOf = (e) => (Array.isArray(e?.test) ? e.test.filter((s) => typeof s === 'string' && s.trim()) : []);

/** 'ok' (works) | 'fail' (does not work) | null for an entry of the log. */
export const resultOf = (entry) => (!entry?.release?.version ? null : entry.source === 'test' ? 'ok' : entry.source === 'user' ? 'fail' : null);

/** The newest answer per version: Map version → { result, at, id }. A later answer replaces an earlier one. */
export function resultsOf(list = []) {
  const out = new Map();
  for (const e of list) {
    const result = resultOf(e);
    if (!result) continue;
    const old = out.get(e.release.version);
    if (!old || String(e.at) > String(old.at)) out.set(e.release.version, { result, at: e.at, id: e.id });
  }
  return out;
}

/** «Works»: the entry for the log (kind «Good as it is», or without a kind when the user deleted it). */
export function worksEntry({ release, text, page = '#/me/news', pageTitle = '', device = 'phone', width = null, now = new Date(), cfg = DEFAULT_KINDS }) {
  const art = artList(cfg).includes('gutso') ? 'gutso' : '';
  return makeEntry({ art, text, page, pageTitle, block: '', device, width, now, source: 'test', release, cfg });
}

/** The filter chips of the list of all releases. */
export const TEST_FILTERS = ['all', 'you', 'open', 'ok', 'fail', 'hidden'];

/**
 * The entries of the list for one chip. rows: news entries ({ version, test }); hidden: the releases nobody sees.
 * 'open' = something to test and no answer yet, 'ok' / 'fail' = the answer, 'you' = the versions since the last visit.
 */
export function filterReleases(rows, { filter = 'all', results = new Map(), forYou = [] } = {}) {
  if (filter === 'you') return forYou;
  if (filter === 'open') return rows.filter((e) => stepsOf(e).length && !results.has(e.version));
  if (filter === 'ok' || filter === 'fail') return rows.filter((e) => results.get(e.version)?.result === filter);
  return rows;
}

/** A release is found by words of its text (hay, lower case) or by its PR number («1820», «#1820», «pr1820»). */
export function matchRelease(pr, words, hay) {
  return words.every((x) => hay.includes(x) || (!!pr && String(pr) === x.replace(/^#|^pr/i, '')));
}
