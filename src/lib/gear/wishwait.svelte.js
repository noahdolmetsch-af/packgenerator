/**
 * «Wait 30 days» on a wish (Paket A part 4, UC-007-I2). Impeccable «Wunschliste» (Noah 24.11.2026 «1-5a», Fund 2): the
 * button no longer stands on every card; it is the first entry in the card's «…». The note «Waits until …» and the
 * question after the days stay on the card (WishPause.svelte). Saved at once with Undo, nothing is bought or deleted.
 */
import { db } from '../db.js';
import { t, nameOf } from '../i18n.svelte.js';
import { localDay } from '../localday.js';
import { saveFailed } from '../ui/ask.js';
import { offerDone } from '../ui/rename.svelte.js';
import { pauseWish, PAUSE_DAYS } from '../stand/stand.js';

const stamp = (i) => ({ ...i, updatedAt: new Date().toISOString() });

/** Write `next` for the wish and offer Undo with `text`. */
export async function putWish(item, next, text) {
  const before = $state.snapshot(item);
  try {
    await db.items.put(stamp($state.snapshot(next)));
    offerDone(text, async () => {
      await db.items.put(before);
      offerDone(t('Changed back.'));
    });
  } catch (err) {
    offerDone(saveFailed(err));
  }
}

/** The wish waits PAUSE_DAYS days; then the app asks again. */
export const waitWish = (item) => putWish(item, pauseWish($state.snapshot(item), localDay()), t('«{name}» waits {n} days. Then the app asks again.', { name: nameOf(item), n: PAUSE_DAYS }));
