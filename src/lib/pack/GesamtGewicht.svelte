<script>
  /**
   * «Gesamtgewicht» (Noah 23.11.2026 «1a»): the weight of the trip in four lines under the weight card: only the items,
   * with the bags, with the bike, with you; each says what the step adds. Read-only; «Wiegen» takes you to the bag you
   * weigh on the scale (BagWeigh). A trip without a bike has no line «With the bike».
   */
  import { Scale } from '@lucide/svelte';
  import { t, locale } from '../i18n.svelte.js';
  import { totalRows } from './gesamt.js';

  let { stats, bike = true, onweigh = null } = $props();
  const rows = $derived(totalRows(stats, { bike }));
  const kg = (g) => (g / 1000).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const NAME = { items: 'Only the items', bags: 'With the bags', bike: 'With the bike', rider: 'With you' };
  const sum = (r) => `${r.missing || r.estimate ? '~' : ''}${kg(r.g)} kg`;
</script>

<section class="tot" data-total-weight aria-labelledby="tot-h">
  <header>
    <h3 id="tot-h">{t('Total weight')}</h3>
    {#if onweigh}<button type="button" class="btn sm" data-total-weigh onclick={onweigh}><Scale size={16} aria-hidden="true" />{t('Weigh bags')}</button>{/if}
  </header>
  <ul>
    {#each rows as r (r.key)}
      <li data-total-row={r.key}>
        <span class="nm">{t(NAME[r.key])}{#if r.key !== 'items' && r.add}<small>{` · + ${kg(r.add)} kg`}</small>{:else if r.key === 'bike' && !r.add}<small>{` · ${t('weight not entered')}`}</small>{/if}</span>
        <span class="g num"><b>{sum(r)}</b></span>
      </li>
    {/each}
  </ul>
  {#if rows.some((r) => r.missing)}<p class="foot">{t('A «~» means: something has no weight yet, so the number is a little low.')}</p>{/if}
</section>

<style>
  .tot {
    display: grid;
    gap: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--line);
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    min-height: 26px;
    font-size: var(--fs-small);
  }
  .nm {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nm small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .g {
    flex: none;
    color: var(--ink-2);
  }
  .g b {
    color: var(--ink);
    font-weight: 600;
  }
  .foot {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
</style>
