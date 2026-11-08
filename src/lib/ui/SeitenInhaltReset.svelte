<script>
  /**
   * «Page cards» (Noah 05.11.2026 «c», turned round 08.11.2026 «1a»): Appearance › «Page cards». Every page starts with the card
   * «What you can do here» as one line. Shows on how many pages you opened it and folds all of them again in one tap, with Undo.
   * Nothing is deleted: the card was never gone, only folded.
   */
  import { liveQuery } from 'dexie';
  import { LayoutList } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { offerDone } from './rename.svelte.js';
  import { FOLD_KEY, foldMapOf, foldAll, openedCount } from '../seiteninhalt.js';

  const q = liveQuery(async () => foldMapOf((await db.settings.get(FOLD_KEY))?.value));
  const n = $derived(openedCount($q));

  async function foldEvery() {
    const before = foldMapOf((await db.settings.get(FOLD_KEY))?.value);
    await db.settings.put({ key: FOLD_KEY, value: foldAll(before) });
    offerDone(t('All cards are folded again.'), () => db.settings.put({ key: FOLD_KEY, value: before }));
  }
</script>

<section aria-labelledby="look-cards" data-seiteninhalt-set>
  <h2 id="look-cards">{t('Page cards')}</h2>
  <p class="note">{t('Every page starts with the card «What you can do here» as one line. A tap on the line opens it; «Fold the card» makes it one line again.')}</p>
  {#if n}
    <p class="note" data-seiteninhalt-count>{t('Pages with an open card: {n}', { n })}</p>
    <button type="button" class="btn" onclick={foldEvery} data-seiteninhalt-fold-all><LayoutList size={16} aria-hidden="true" />{t('Fold all cards again')}</button>
  {:else}
    <p class="note" data-seiteninhalt-none>{t('No card is open.')}</p>
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
