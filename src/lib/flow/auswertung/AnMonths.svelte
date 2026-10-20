<script>
  /**
   * «Pro Monat» of one answer (Noah 20.10.2026, like «Pro Kilometer» on the ride page): answers, Ø, lowest
   * and highest per month, newest first.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { valueMonths } from '../auswertung.js';
  import { monthName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const FIRST = 6;
  const rows = $derived(valueMonths(d.vals, d.from, d.to));
  let all = $state(false);
  const shown = $derived(all ? rows : rows.slice(0, FIRST));
  const v = (x) => (x == null ? '–' : num(x));
</script>

{#if rows.length > 1 && rows.some((r) => r.n > 0)}
  <AnaCard key="anmonths" sub={t('{n} months', { n: rows.length })} wide>
    <table class="atab" data-months>
      <thead>
        <tr>
          <th scope="col" class="nm">{t('Month|tk')}</th>
          <th scope="col">{t('Answers')}</th>
          <th scope="col">Ø</th>
          <th scope="col">{t('Lowest|an')}</th>
          <th scope="col">{t('Highest|an')}</th>
        </tr>
      </thead>
      <tbody>
        {#each shown as r (r.m)}
          <tr data-month={r.m}>
            <th scope="row" class="nm">{monthName(r.m)}</th>
            <td>{num(r.n)}</td>
            <td><b>{v(r.mean)}</b></td>
            <td>{v(r.min)}</td>
            <td>{v(r.max)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if rows.length > FIRST}
      <button type="button" class="btn sm more" aria-expanded={all} onclick={() => (all = !all)}>{all ? t('Show fewer') : t('Show all {n} months', { n: rows.length })}</button>
    {/if}
  </AnaCard>
{/if}

<style>
  .atab {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 9px 6px;
    text-align: right;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .nm {
    text-align: left;
    font-weight: 400;
  }
  thead .nm {
    font-weight: 600;
  }
  .more {
    align-self: flex-start;
  }
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 3px;
    }
  }
</style>
