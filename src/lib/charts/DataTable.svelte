<script>
  /**
   * «Genaue Werte» (Noah 27.10.2026 «1-5 a», answer 2a): the numbers of a chart as a table, «Als Tabelle».
   * head: the column names; rows: [{ key, cells: [text …] }], newest first; the first column is the day or
   * week, the others are numbers (right-aligned). limit: rows shown first, «Show all» shows the rest.
   */
  import { t } from '../i18n.svelte.js';

  let { head = [], rows = [], limit = 14, caption = '' } = $props();
  let all = $state(false);
  const shown = $derived(all ? rows : rows.slice(0, limit));
</script>

<div class="dt" data-chart-table>
  <table>
    {#if caption}<caption>{caption}</caption>{/if}
    <thead><tr>{#each head as h, i (i)}<th scope="col" class:n={i > 0}>{h}</th>{/each}</tr></thead>
    <tbody>
      {#each shown as r (r.key)}
        <tr>{#each r.cells as c, i (i)}{#if i === 0}<th scope="row">{c}</th>{:else}<td class="n num">{c}</td>{/if}{/each}</tr>
      {/each}
    </tbody>
  </table>
  {#if rows.length > limit}
    <button type="button" class="btn btn-link more" aria-expanded={all} onclick={() => (all = !all)}>{all ? t('Show fewer') : t('Show all {n}|table', { n: rows.length })}</button>
  {/if}
</div>

<style>
  .dt {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
  }
  caption {
    text-align: left;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    padding-bottom: 4px;
  }
  th,
  td {
    padding: 8px 6px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    white-space: nowrap;
  }
  thead th {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  tbody th {
    font-weight: 400;
  }
  .n {
    text-align: right;
  }
  .more {
    margin-top: 6px;
    min-height: 44px;
  }
</style>
