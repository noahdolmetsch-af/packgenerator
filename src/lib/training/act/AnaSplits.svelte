<script>
  /**
   * «Pro Kilometer» (Noah 19.10.2026 «2a»): Strava's splits per km: time, metres up or down, Ø km/h,
   * Ø heart rate. A long ride shows the first 10, «Alle zeigen» opens the rest. Observation only.
   */
  import AnaCard from '../AnaCard.svelte';
  import { mss } from './analysen.js';
  import { t, num } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const FIRST = 10;
  const rows = $derived(Array.isArray(act?.splits) ? act.splits.filter((x) => x && x.s > 0) : []);
  const hr = $derived(rows.some((x) => x.hr > 0));
  let all = $state(false);
  const shown = $derived(all ? rows : rows.slice(0, FIRST));
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');
  const signed = (x) => (Number.isFinite(x) ? `${x > 0 ? '+' : ''}${num(x)}` : '–');
</script>

{#if rows.length > 1}
  <AnaCard key="splits" sub={t('{n} km from Strava', { n: rows.length })} wide>
    <table class="atab" data-splits>
      <thead>
        <tr>
          <th scope="col" class="nm">{t('km|an')}</th>
          <th scope="col">{t('Time|an')}</th>
          <th scope="col">{t('Up/down m|an')}</th>
          <th scope="col">{t('Ø km/h|an')}</th>
          {#if hr}<th scope="col" class="wide-only">{t('Ø HR|an')}</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each shown as x (x.k)}
          <tr>
            <th scope="row" class="nm">{x.k}</th>
            <td>{mss(x.s)}</td>
            <td>{signed(x.hm)}</td>
            <td><b>{v(x.kmh)}</b></td>
            {#if hr}<td class="wide-only">{v(x.hr)}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if rows.length > FIRST}
      <button type="button" class="btn sm more" aria-expanded={all} onclick={() => (all = !all)} data-splits-all>{all ? t('Show fewer') : t('Show all {n} km', { n: rows.length })}</button>
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
    white-space: normal;
    overflow-wrap: break-word;
  }
  thead .nm {
    font-weight: 600;
  }
  .cap {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .more {
    align-self: flex-start;
  }
  @media (max-width: 640px) {
    .wide-only {
      display: none;
    }
    th,
    td {
      padding: 8px 3px;
    }
  }
</style>
