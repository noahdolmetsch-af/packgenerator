<script>
  /**
   * «Bestwerte» (Noah 20.10.2026, like «Bestwerte» on the ride page): the longest run, the best week and
   * month, the most in one day and the most minutes in a day, for the period chosen next to the last
   * 90 days and the year. A star when the period is as good as the 90 days.
   */
  import AnaCard from '../../training/AnaCard.svelte';
  import { bestTable } from '../auswertung.js';
  import { t, tn, num } from '../../i18n.svelte.js';

  let { d } = $props();
  const tab = $derived(bestTable(d.list, d.from, d.to));
  const NAMES = { run: 'Days in a row|tk', week: 'Best week|tk', month: 'Best month|tk', day: 'Most in one day|tk', minDay: 'Most minutes in a day|tk' };
  const fmt = (k, v) => (!v ? '–' : k === 'run' ? tn(v, '{n} day', '{n} days') : k === 'minDay' ? t('{n} min', { n: num(v) }) : tn(v, '{n} tick', '{n} ticks'));
</script>

{#if tab}
  <AnaCard key="tkbest" sub={t('runs, weeks and days')} wide>
    <table class="atab">
      <thead>
        <tr>
          <th scope="col" class="l">{t('Value|tk')}</th>
          <th scope="col">{t('This period|tk')}</th>
          <th scope="col">{t('Best 90 days')}</th>
          <th scope="col">{t('Best {year}', { year: tab.year })}</th>
        </tr>
      </thead>
      <tbody>
        {#each tab.rows as r (r.k)}
          <tr data-best={r.k}>
            <th scope="row" class="l">{t(NAMES[r.k])}</th>
            <td><b>{fmt(r.k, r.me)}</b>{#if r.star}<span class="bst" role="img" aria-label={t('best of the last 90 days or as good')}>☆</span>{/if}</td>
            <td>{fmt(r.k, r.d90)}</td>
            <td>{fmt(r.k, r.year)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('Star = best of the last 90 days or as good.')}</p>
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
    vertical-align: top;
    white-space: nowrap;
  }
  thead th {
    color: var(--ink-3);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    vertical-align: bottom;
    white-space: normal;
  }
  .l {
    text-align: left;
    font-weight: 400;
    white-space: normal;
  }
  thead .l {
    font-weight: 600;
  }
  .bst {
    margin-left: 4px;
    color: var(--warn);
  }
  @media (max-width: 640px) {
    th,
    td {
      padding: 8px 3px;
    }
  }
</style>
