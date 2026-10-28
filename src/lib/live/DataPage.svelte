<script>
  /**
   * «Datenseiten» (Noah 20.10.2026): one data page of the live map. A grid of two columns: a small field
   * takes one cell, a big field and a chart a whole row (datapages.js gridOf). The numbers fill their cell
   * (as big as the cell allows: readable in sunlight), the label and unit small under them.
   * page: one stored page; fields: the catalogue [{ key, label, unit, route }]; values: { key: { value } };
   * route: is there a route (route fields and charts only then); hrZ / pwZ: zone rows (or null);
   * smallMap: a snippet for the small map at the bottom (only rendered when `active`); onedit(id).
   */
  import { Pencil } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { gridOf, pageName, CHART } from './datapages.js';
  import DpChart from './DpChart.svelte';

  let { page, i = 0, fields = [], values = {}, series = {}, profileAhead = [], route = false, hrZ = null, pwZ = null, active = true, smallMap = null, onedit = null } = $props();

  const FIELD = $derived(Object.fromEntries(fields.map((f) => [f.key, f])));
  const ok = (it) => (it.f ? !!FIELD[it.f] && (route || !FIELD[it.f].route) : !!CHART[it.c] && (route || !CHART[it.c].route));
  const grid = $derived(gridOf(page?.items ?? [], ok));
  const name = $derived(pageName(page, t, i));
  const val = (k) => values?.[k]?.value ?? '–';
</script>

<section class="dp" aria-label={name} data-dp-page={page.id}>
  <header class="dp-head">
    <h2 class="dp-name">{name}</h2>
    {#if onedit}
      <button type="button" class="dp-edit" onclick={() => onedit(page.id)} aria-label={t('Edit data pages')} data-dp-edit><Pencil size={18} aria-hidden="true" /></button>
    {/if}
  </header>

  {#if grid.cells.length}
    <ul class="dp-grid" style:grid-template-rows="repeat({grid.rows}, minmax(0, 1fr))">
      {#each grid.cells as c (c.item.f ?? `c:${c.item.c}`)}
        {#if c.item.f}
          {@const fd = FIELD[c.item.f]}
          {@const v = val(c.item.f)}
          <li class="dp-cell" class:dp-wide={c.span === 2} data-dp-field={c.item.f}>
            <b class="dp-num">{v}{#if fd.unit && v !== '–'}<small>{fd.unit}</small>{/if}</b>
            <span class="dp-label">{t(fd.label)}</span>
          </li>
        {:else}
          <li class="dp-cell dp-wide dp-chartcell">
            <DpChart kind={c.item.c} {series} {profileAhead} {hrZ} {pwZ} />
          </li>
        {/if}
      {/each}
    </ul>
  {:else}
    <p class="dp-empty">{t('The fields of this page need a route. Choose other fields in the editor, or ride with a route.')}</p>
  {/if}

  {#if page.map}
    <div class="dp-map" data-dp-map>
      {#if active && smallMap}{@render smallMap(page)}{/if}
    </div>
  {/if}
</section>

<style>
  .dp {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--paper);
    color: var(--ink);
  }
  .dp-head {
    flex: none;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 4px 4px 14px;
    border-bottom: 1px solid var(--line);
  }
  .dp-name {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dp-edit {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .dp-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    min-height: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--line);
  }
  .dp-cell {
    /* the number takes its size from the cell (container units) */
    container-type: size;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--paper);
  }
  .dp-wide {
    grid-column: span 2;
  }
  .dp-num {
    /* a local type token: as big as the cell allows, never bigger than the display size × 2 */
    --fs-dp-num: max(var(--fs-sub), min(58cqh, 24cqw, calc(var(--fs-display) * 2)));
    font: 800 var(--fs-dp-num) / 1 var(--font-body);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    white-space: nowrap;
    color: var(--ink);
  }
  .dp-num small {
    margin-left: 0.15em;
    font-size: var(--fs-small);
    font-weight: 600;
    letter-spacing: 0;
    color: var(--ink-2);
  }
  .dp-label {
    max-width: 100%;
    padding: 2px 6px 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dp-chartcell {
    align-items: stretch;
    justify-content: stretch;
  }
  .dp-empty {
    flex: 1;
    margin: 0;
    padding: 16px;
    font-size: var(--fs-body);
    color: var(--ink-2);
  }
  .dp-map {
    flex: 0 0 34%;
    min-height: 120px;
    border-top: 1px solid var(--line);
    background: var(--paper-2);
    overflow: hidden;
  }
  /* a phone on its side: little height, so the small map takes a little less and the head is slimmer */
  /* on the computer the numbers stay at the display size: room for the overview, not for one number */
  @media (min-width: 900px) and (min-height: 521px) {
    .dp-num {
      --fs-dp-num: max(var(--fs-sub), min(58cqh, 24cqw, var(--fs-display)));
    }
  }
  @media (orientation: landscape) and (max-height: 520px) {
    .dp-map {
      flex-basis: 30%;
      min-height: 80px;
    }
    .dp-head {
      padding-block: 0;
    }
  }
</style>
