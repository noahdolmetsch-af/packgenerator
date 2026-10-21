<script>
  /**
   * «Pro Monat» (Noah 20.10.2026, like «Pro Kilometer» on the ride page): one row per month of the period,
   * newest first: days with a tick, ticks, minutes, Ø per week. More than 6 months: «Alle zeigen».
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { months } from '../auswertung.js';
  import { monthName } from './words.js';
  import { t, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const FIRST = 6;
  const rows = $derived(months(d.list, d.from, d.to));
  const hasMin = $derived(rows.some((r) => r.min > 0));
  let all = $state(false);
  const shown = $derived(all ? rows : rows.slice(0, FIRST));
</script>

{#if rows.length > 1 && rows.some((r) => r.ticks > 0)}
  <AnaCard key="tkmonths" sub={t('{n} months', { n: rows.length })} wide>
    <table class="atab" data-months>
      <thead>
        <tr>
          <th scope="col" class="nm">{t('Month|tk')}</th>
          <th scope="col">{t('Days|tk')}</th>
          <th scope="col">{t('Ticks')}</th>
          {#if hasMin}<th scope="col">{t('Minutes|tk')}</th>{/if}
          <th scope="col">{t('Ø per week|tk')}</th>
        </tr>
      </thead>
      <tbody>
        {#each shown as r (r.m)}
          <tr data-month={r.m}>
            <th scope="row" class="nm">{monthName(r.m)}</th>
            <td>{num(r.days)}</td>
            <td><b>{num(r.ticks)}</b></td>
            {#if hasMin}<td>{r.min ? num(r.min) : '–'}</td>{/if}
            <td>{num(r.perWeek)}</td>
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
