<script>
  /**
   * «Was kostet das nächste Jahr?» (idea C1 «App denkt mit», Noah 02.11.2026 «3b»): on the page «Wear», the parts
   * that run out in the next 3, 6 or 12 months, what the last change of each cost, the sum, and one tap that puts
   * them on the shopping list (Ich › Alltag › Einkauf) with Undo. A price the app does not know stays «price open».
   * rows: wearRows of the bike; bike: with the workshop jobs.
   */
  import { Coins, ShoppingCart } from '@lucide/svelte';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { wearCosts, HORIZONS } from '../wearcost.js';
  import { changeList, restoreLists, loadLists } from '../frei/shoplist.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { rows = [], bike } = $props();
  const today = localDay();
  let months = $state(HORIZONS[0]);
  const plan = $derived(wearCosts(rows, bike, { months, today }));
  const month = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale(), { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const when = (x) => (x.state === 'due' ? t('now') : x.due ? month(x.due) : t('soon'));

  async function toShop() {
    const before = await loadLists();
    await changeList(plan.items.map((x) => x.shop), t('Shopping list'));
    offerDone(tn(plan.items.length, '{n} part is on the shopping list.', '{n} parts are on the shopping list.'), () => restoreLists(before));
  }
</script>

<section class="gcard" aria-labelledby="wk-h-{bike.id}" data-wear-costs>
  <h2 id="wk-h-{bike.id}"><Coins size={18} aria-hidden="true" />{t('What the next months cost')}</h2>
  <div class="chips" role="group" aria-label={t('How far ahead')}>
    {#each HORIZONS.toSorted((a, b) => a - b) as m (m)}
      <button type="button" class="chip" aria-pressed={months === m} onclick={() => (months = m)} data-wear-costs-months={m}>{tn(m, '{n} month', '{n} months')}</button>
    {/each}
  </div>
  {#if plan.items.length}
    <ul class="wk">
      {#each plan.items as x (x.key)}
        <li data-wear-cost={x.key}>
          <span class="n"><b>{x.name}</b>{#if x.model}<small>{x.model}</small>{/if}</span>
          <span class="w">{when(x)}</span>
          <span class="p num">{x.chf != null ? t('CHF {chf}', { chf: num(Math.round(x.chf)) }) : t('price open')}</span>
        </li>
      {/each}
    </ul>
    <p class="sum num" data-wear-costs-sum>
      <b>{t('About CHF {chf}', { chf: num(plan.total) })}</b>
      {#if plan.unpriced}{' · '}{tn(plan.unpriced, '{n} price is open', '{n} prices are open')}{/if}
    </p>
    <p class="quiet">{t('The price is what your last change of the part cost. Only a guess, never a bill.')}</p>
    <button type="button" class="btn sm" onclick={toShop} data-wear-costs-shop><ShoppingCart size={16} aria-hidden="true" />{t('All on the shopping list')}</button>
  {:else}
    <p class="quiet" data-wear-costs-none>{t('No part runs out in this time.')}</p>
  {/if}
</section>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 10px;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .wk {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .wk li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 4px 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    align-items: baseline;
  }
  .wk li:first-child {
    border-top: 0;
  }
  .n small {
    display: block;
    color: var(--ink-2);
  }
  .w {
    color: var(--ink-2);
  }
  .p {
    text-align: right;
    min-width: 5.5em;
  }
  .sum {
    margin: 0 0 6px;
  }
</style>
