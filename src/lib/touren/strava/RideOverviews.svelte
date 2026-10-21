<script>
  /**
   * Die Strava-Übersicht im Rückblick (Noah 21.10.2026 «diese übersicht und peak power und der karte mit
   * linie der tour … beide übersichten 1:1 übernehmen und bei uns integrieren»): per Strava ride of the
   * trip, as on Strava's activity page: «Peak Power» on the left, the «Übersicht» on the right
   * (StravaOverview.svelte) and the map with the line of the ride below. Several rides: one chip each.
   * acts: the Strava rides (bike); ftp, kg, bike as StravaOverview; bikeOf(act): the bike of one ride (first).
   */
  import { t, locale } from '../../i18n.svelte.js';
  import { linesOf } from '../tour.js';
  import StravaOverview from './StravaOverview.svelte';
  import PeakPower from './PeakPower.svelte';
  import { phone } from '../../media.svelte.js';

  let { acts = [], ftp = null, kg = null, bike = '', bikeOf = null } = $props();
  let pick = $state(null);
  const a = $derived(acts.find((x) => x.id === pick) ?? acts[0] ?? null);
  const lines = $derived(a ? linesOf([a]) : []);
  const when = (x) => [x.day ? new Date(`${x.day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' }) : '', x.time].filter(Boolean).join(' · ');
</script>

{#if a}
  <section class="rv-sec ro" aria-labelledby="ro-h" data-ride-overview>
    <div class="rv-h"><div><h2 id="ro-h">{t('Overview like Strava')}</h2><p class="rv-sub">{t('from Strava · to look at, without rating')}</p></div></div>
    {#if acts.length > 1}
      <div class="chips" role="group" aria-label={t('Which ride')}>
        {#each acts as x (x.id)}<button type="button" class="chip" aria-pressed={x.id === a.id} onclick={() => (pick = x.id)} data-ro-pick={x.id}><b>{x.name || t('1 activity')}</b><small>{when(x)}</small></button>{/each}
      </div>
    {/if}
    {#key a.id}
      <div class="grid">
        <div class="side"><PeakPower {a} /></div>
        <div class="ovcard"><StravaOverview {a} {ftp} {kg} bike={bikeOf?.(a) || bike} /></div>
      </div>
      {#if lines.length}
        <div class="map" data-ro-map>
          {#await import('../../spur/TourMap.svelte') then m}<m.default {lines} height={phone.matches ? 260 : 360} label={t('Map of «{name}»: drag to move, pinch or wheel to zoom', { name: a.name || t('1 activity') })} />{:catch}{/await}
        </div>
      {/if}
    {/key}
  </section>
{/if}

<style>
  .ro {
    display: grid;
    gap: var(--sp-2);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: grid;
    min-height: 44px;
    padding: 6px 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  .chip small {
    color: var(--ink-2);
  }
  .chip[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
  }
  .chip[aria-pressed='true'] small {
    color: var(--paper);
  }
  .grid {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: var(--sp-3);
    align-items: start;
  }
  .ovcard {
    min-width: 0;
    padding: var(--sp-3);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    overflow: hidden;
  }
  .map {
    overflow: hidden;
    border-radius: var(--radius-card);
  }
  @media (max-width: 760px) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .side {
      order: 2;
    }
  }
</style>
