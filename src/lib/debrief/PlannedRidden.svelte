<script>
  /**
   * SN2+ SN2h T2 «Geplant und gefahren» (mockup approved 13.10.2026): per trip the planned and the ridden
   * moving time, the difference in grey (no good or bad), km and Hm with the plan small below. Newest
   * first, five at first and «Alle n Touren». A table on a computer, cards on a phone.
   * rows / avgMin: werte.js plannedRidden(); surfaceOf(row): the surface name of the trip's bike, or ''.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { n0, dates, signedHours } from '../review/fmt.js';
  import { hm } from '../gpx.js';
  import { ChevronRight, ChevronUp } from '@lucide/svelte';

  let { rows = [], avgMin = null, surfaceOf = () => '' } = $props();
  const FIRST = 5;
  let all = $state(false);
  const shown = $derived(all ? rows : rows.slice(0, FIRST));
  const sub = (r) => [dates(r.start, r.end), r.bike, surfaceOf(r)].filter(Boolean).join(' · ');
  const diff = (r) => signedHours(r.diffMin / 60);
</script>

<section class="rv-sec pr" aria-labelledby="pr-h" data-planned-ridden>
  <div class="rv-h"><div><h2 id="pr-h">{t('Planned and ridden')}</h2><p class="rv-sub num">{[t('per trip, newest first'), avgMin != null ? t('on average {n} min off', { n: avgMin }) : ''].filter(Boolean).join(' · ')}</p></div></div>
  <div class="rv-box pad">
    {#if rows.length}
      <table class="prt pc-only">
        <thead><tr><th scope="col">{t('Trip')}</th><th scope="col" class="r">{t('Planned|time')}</th><th scope="col" class="r">{t('Ridden|time')}</th><th scope="col" class="r">{t('Difference|pace')}</th><th scope="col" class="r">km</th><th scope="col" class="r">Hm</th></tr></thead>
        <tbody>
          {#each shown as r (r.id)}
            <tr data-trip={r.id}>
              <th scope="row"><span class="tt">{r.title}</span><small>{sub(r)}</small></th>
              <td class="r num">{hm(r.planH)}</td>
              <td class="r num">{hm(r.realH)}</td>
              <td class="r"><span class="df num">{diff(r)}</span></td>
              <td class="r num">{n0(r.km)}{#if r.planKm != null}<small>{t('planned {v}', { v: n0(r.planKm) })}</small>{/if}</td>
              <td class="r num">{n0(r.gainM)}{#if r.planGain != null}<small>{t('planned {v}', { v: n0(r.planGain) })}</small>{/if}</td>
            </tr>
          {/each}
        </tbody>
      </table>
      <ul class="prc ph-only">
        {#each shown as r (r.id)}
          <li data-trip={r.id}>
            <span class="cm"><span class="tt">{r.title}</span><small>{sub(r)}</small><small class="num">{t('{a} h planned · {b} h ridden', { a: hm(r.planH), b: hm(r.realH) })}</small><small class="num">{[r.km != null ? `${n0(r.km)} km` : '', r.gainM != null ? `${n0(r.gainM)} Hm` : ''].filter(Boolean).join(' · ')}</small></span>
            <span class="df num">{diff(r)}</span>
          </li>
        {/each}
      </ul>
      {#if rows.length > FIRST}<button type="button" class="more" aria-expanded={all} onclick={() => (all = !all)}>{all ? t('Show fewer') : tn(rows.length, 'All {n} trip', 'All {n} trips')}{#if all}<ChevronUp size={16} aria-hidden="true" />{:else}<ChevronRight size={16} aria-hidden="true" />{/if}</button>{/if}
    {:else}
      <p class="none">{t('Trips with a planned riding time and a recorded ride show up here.')}</p>
    {/if}
  </div>
</section>

<style>
  .prt {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-body);
  }
  .prt th,
  .prt td {
    padding: 10px 8px;
    border-top: 1px solid var(--line);
    text-align: left;
    vertical-align: middle;
  }
  .prt thead th {
    border-top: 0;
    color: var(--ink-3);
    font: 500 var(--fs-small) var(--font-body);
  }
  .prt th[scope='row'] {
    font-weight: 400;
  }
  .prt .r {
    text-align: right;
  }
  .tt {
    display: block;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .df {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-weight: 500;
    white-space: nowrap;
  }
  .prc {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .prc li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
  }
  .prc li + li {
    border-top: 1px solid var(--line);
  }
  .cm {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    margin-top: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .none {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ph-only {
    display: none;
  }
  @media (max-width: 719px) {
    .pc-only {
      display: none;
    }
    .ph-only {
      display: block;
    }
  }
</style>
