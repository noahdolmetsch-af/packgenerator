/**
 * «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): the two answers of a test, shared by the card on Today, the window of the news and
 * the list of all releases. «Works» writes one entry of the log (logbuch/testrunde.js) and offers Undo; «Does not work» opens the
 * window of the button «Improve» with the release in it (logbuch/Improve.svelte listens to 'pg:test-fail').
 * Loaded on the tap only (dynamic import), so Today stays light.
 */
import { t } from '../i18n.svelte.js';
import { offerDone } from '../ui/rename.svelte.js';
import { saveFailed } from '../ui/ask.js';
import { releaseOfNews } from '../logbuch/testrunde.js';
import { logWorks, removeEntry } from '../logbuch/logbuchdb.js';
import { deviceOf } from '../logbuch/logbuch.js';
import { readResults, writeResult } from './wasneuStore.js';

/** e: the news entry (version, title, pr). pr: its PR number where the entry itself does not know it (older versions). */
export async function markWorks(e, pr = null) {
  const release = releaseOfNews(e, pr);
  if (!release) return null;
  const width = globalThis.innerWidth ?? 390;
  const title = t(release.title);
  const text = release.pr ? t('Tested, works: {title} (PR {n})', { title, n: release.pr }) : t('Tested, works: {title}', { title });
  try {
    const entry = await logWorks({ release, text, pageTitle: t('What is new'), device: deviceOf(width), width });
    if (!entry) return null;
    const before = readResults().get(release.version) ?? null;
    writeResult(release.version, 'ok', entry.at);
    offerDone(t('Noted: it works.'), async () => {
      await removeEntry(entry.id);
      writeResult(release.version, before?.result ?? null, before?.at);
    });
    return entry;
  } catch (err) {
    offerDone(saveFailed(err));
    return null;
  }
}

/** «Does not work»: the window of the button «Improve», the kind «Error» and the release already in it. */
export function markFails(e, pr = null) {
  const release = releaseOfNews(e, pr);
  if (!release) return false;
  const ev = new CustomEvent('pg:test-fail', { detail: { release, title: t(release.title) }, cancelable: true });
  window.dispatchEvent(ev);
  if (!ev.defaultPrevented) offerDone(t('Switch on the button «Improve» (Me › Appearance › Handling), then you can write what does not work.'));
  return ev.defaultPrevented;
}
