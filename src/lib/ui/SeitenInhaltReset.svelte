<script>
  /**
   * «Karten wieder aufklappen» (Noah 05.11.2026 «c»): Appearance › «Page cards». Shows on how many pages the card
   * «What you can do here» is folded and opens all of them again in one tap, with Undo. Only the folds you made go; pages
   * that start as one line (FOLDED_FIRST) stay as they start. Nothing is deleted: the card was never gone, only folded.
   */
  import { liveQuery } from 'dexie';
  import { LayoutList } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { offerDone } from './rename.svelte.js';
  import { FOLD_KEY, FOLDED_FIRST, foldMapOf, unfoldAll, foldedCount } from '../seiteninhalt.js';

  const q = liveQuery(async () => foldMapOf((await db.settings.get(FOLD_KEY))?.value));
  const n = $derived(foldedCount($q));

  async function openAll() {
    const before = foldMapOf((await db.settings.get(FOLD_KEY))?.value);
    await db.settings.put({ key: FOLD_KEY, value: unfoldAll(before, FOLDED_FIRST) });
    offerDone(t('All cards are open again.'), () => db.settings.put({ key: FOLD_KEY, value: before }));
  }
</script>

<section aria-labelledby="look-cards" data-seiteninhalt-set>
  <h2 id="look-cards">{t('Page cards')}</h2>
  <p class="note">{t('Many pages start with the card «What you can do here». «Fold the card» makes it one line; a tap on the line opens it again.')}</p>
  {#if n}
    <p class="note" data-seiteninhalt-count>{t('Pages with a folded card: {n}', { n })}</p>
    <button type="button" class="btn" onclick={openAll} data-seiteninhalt-open-all><LayoutList size={16} aria-hidden="true" />{t('Open all cards again')}</button>
  {:else}
    <p class="note" data-seiteninhalt-none>{t('No card is folded.')}</p>
  {/if}
</section>

<style>
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .note {
    margin: 2px 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
