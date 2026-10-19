<script>
  /**
   * «Runden» (Noah 19.10.2026 «2a»): the laps of the bike computer (lap button or auto lap) from Strava,
   * per lap km, time, metres climbed, Ø km/h, Ø heart rate, Ø watts (power meter only). Only with two laps or more.
   * Observation only.
   */
  import AnaCard from '../AnaCard.svelte';
  import { mss } from './analysen.js';
  import { t, num } from '../../i18n.svelte.js';

  let { act = null } = $props();
  const rows = $derived(Array.isArray(act?.laps) ? act.laps.filter((l) => l && l.s > 0) : []);
  const power = $derived(rows.some((l) => l.w > 0));
  const hr = $derived(rows.some((l) => l.hr > 0));
  const v = (x) => (Number.isFinite(x) ? num(x) : '–');
</script>

{#if rows.length > 1}
  <AnaCard key="laps" sub={t('{n} laps from your bike computer', { n: rows.length })} wide>
    <table class="atab" data-laps>
      <thead>
        <tr>
          <th scope="col" class="nm">{t('Lap|an')}</th>
          <th scope="col">{t('km|an')}</th>
          <th scope="col">{t('Time|an')}</th>
          <th scope="col">{t('Hm|an')}</th>
          <th scope="col">{t('Ø km/h|an')}</th>
          {#if hr}<th scope="col" class="wide-only">{t('Ø HR|an')}</th>{/if}
          {#if power}<th scope="col" class="wide-only">{t('Ø W|an')}</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as l (l.n)}
          <tr>
            <th scope="row" class="nm">{l.name && !/^Lap \d+$/i.test(l.name) ? l.name : t('Lap {n}', { n: l.n })}</th>
            <td>{v(l.km)}</td>
            <td>{mss(l.s)}</td>
            <td>{v(l.hm)}</td>
            <td><b>{v(l.kmh)}</b></td>
            {#if hr}<td class="wide-only">{v(l.hr)}</td>{/if}
            {#if power}<td class="wide-only">{v(l.w)}</td>{/if}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="cap">{t('A lap starts when you press the lap button, or every few km when your bike computer counts laps by itself.')}</p>
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
