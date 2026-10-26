<script>
  /**
   * Paket A part 4, UC-007-I2 «Kaufpause mit Wiedersehen»: on a wish in Material › Wunschliste, «Wait 30 days».
   * Until then the card says how long it waits; on the day it asks again: still needed (keep the wish) or
   * not any more (the wish goes, after asking, with Undo). Nothing is bought or deleted by itself.
   */
  import { Hourglass } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, nameOf, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { askDelete, deleteWithUndo, saveFailed } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { deleteItems, undoBulk } from './bulk.js';
  import { pauseWish, endPause, wishPauseState, PAUSE_DAYS } from '../stand/stand.js';
  import WishTrial from './WishTrial.svelte'; // UC-007-I3: after a borrow test, the question shows here

  let { item } = $props();
  const today = localDay();
  const st = $derived(wishPauseState(item, today));
  const stamp = (i) => ({ ...$state.snapshot(i), updatedAt: new Date().toISOString() });

  async function put(next, text) {
    const before = $state.snapshot(item);
    try {
      await db.items.put(stamp(next));
      offerDone(text, async () => {
        await db.items.put(before);
        offerDone(t('Changed back.'));
      });
    } catch (err) {
      offerDone(saveFailed(err));
    }
  }
  const pause = () => put(pauseWish(item, today), t('«{name}» waits {n} days. Then the app asks again.', { name: nameOf(item), n: PAUSE_DAYS }));
  const keep = () => put(endPause(item), t('«{name}» stays on the wish list.', { name: nameOf(item) }));
  async function drop() {
    const name = nameOf(item);
    const answer = await askDelete({ title: t('Delete «{name}»?', { name }), text: t('The wish goes. You can undo this for a few seconds.') });
    if (answer !== 'delete') return;
    await deleteWithUndo({ run: () => deleteItems(db, [item.id]), undo: (snap) => undoBulk(db, snap), text: t('"{name}" deleted.', { name }), name });
  }
</script>

<div class="wp" data-wish-pause={item.id}>
  <WishTrial {item} compact />
  {#if !st}
    <button type="button" class="btn sm" onclick={pause} aria-label={t('Wait {n} days before buying {name}', { n: PAUSE_DAYS, name: nameOf(item) })} data-wish-wait><Hourglass size={14} aria-hidden="true" />{t('Wait {n} days', { n: PAUSE_DAYS })}</button>
  {:else if !st.over}
    <span class="note" data-wish-waiting><Hourglass size={14} aria-hidden="true" />{t('Waits until {day}', { day: dateOf(st.until) })}</span>
  {:else}
    <span class="note ask">{t('Still needed?')}</span>
    <button type="button" class="btn sm" onclick={keep} data-wish-keep>{t('Yes, keep it')}</button>
    <button type="button" class="btn sm" onclick={drop} data-wish-drop>{t('No, let it go')}</button>
  {/if}
</div>

<style>
  .wp {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .note {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ask {
    color: var(--ink);
    font-weight: 600;
  }
</style>
