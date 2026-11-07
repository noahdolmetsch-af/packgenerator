<script>
  /**
   * «Sonnenaufgang auf dem Hügel» (Träume und Neuland N9, Noah 27.10.2026 «1-5 a»), on Touren › Träume: the next
   * clear morning and evening in the home forecast, with the sunrise or sunset and when to leave for your
   * nearest view point (own points of the kind «View»). Quiet when the forecast has no cloud cover yet.
   * Rules in sonne.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { ownQuery } from '../map/ownpoints.js';
  import { homeForecast } from '../home-weather.js';
  import { nextClear, viewSpots, leaveAt } from './sonne.js';
  import { t, num, locale } from '../i18n.svelte.js';
  import { Sunrise, Sunset } from '@lucide/svelte';

  const homeQ = liveQuery(async () => (await db.settings.get('homePlace'))?.value ?? null);
  const ownQ = ownQuery();
  const home = $derived($homeQ ?? null);
  let days = $state.raw(null);
  $effect(() => {
    if (!home) return;
    let live = true;
    homeForecast(db)
      .then((f) => live && (days = f?.days ?? []))
      .catch(() => live && (days = []));
    return () => (live = false);
  });
  const hasClouds = $derived((days ?? []).some((d) => Array.isArray(d.hourly?.c)));
  const clear = $derived(home && days ? nextClear(days, home) : { rise: null, set: null });
  const views = $derived(viewSpots($ownQ ?? [], home));
  const view = $derived(views[0] ?? null);
  const dayName = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const goText = (x) =>
    view
      ? t('Leave {at} for {name} ({km} km)', { at: leaveAt(x.at, view.km), name: view.name || t('View|point'), km: num(view.km) })
      : t('Leave {at} for a hill nearby', { at: leaveAt(x.at, null) });
</script>

{#if home && hasClouds}
  <section class="ich-sec" aria-labelledby="st-h" data-sun-tip>
    <div class="ich-h">
      <div>
        <h2 id="st-h">{t('Sunrise on the hill')}</h2>
        <p class="ich-hs">{t('The next clear morning and evening, with when to leave.')}</p>
      </div>
    </div>
    <div class="card ich-body st">
      {#if clear.rise || clear.set}
        <ul class="st-list">
          {#if clear.rise}
            <li class="st-row" data-st="rise">
              <span class="ich-ib"><Sunrise size={18} aria-hidden="true" /></span>
              <span class="st-m"><b>{t('Clear morning {day}: sunrise {at}', { day: dayName(clear.rise.date), at: clear.rise.hm })}</b><small>{goText(clear.rise)}</small></span>
            </li>
          {/if}
          {#if clear.set}
            <li class="st-row" data-st="set">
              <span class="ich-ib"><Sunset size={18} aria-hidden="true" /></span>
              <span class="st-m"><b>{t('Clear evening {day}: sunset {at}', { day: dayName(clear.set.date), at: clear.set.hm })}</b><small>{goText(clear.set)}</small></span>
            </li>
          {/if}
        </ul>
      {:else}
        <p class="ich-help" data-st-none>{t('No clear morning or evening in the forecast yet.')}</p>
      {/if}
      {#if !view}<p class="ich-help" data-st-hint>{t('Mark a «View» point on the map near home, then the tip names it.')}</p>{/if}
    </div>
  </section>
{/if}

<style>
  .st {
    display: grid;
    gap: var(--sp-2);
  }
  .st-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .st-row {
    display: flex;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
  }
  .st-m {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow-wrap: break-word;
  }
  .st-m small {
    color: var(--ink-3);
  }
</style>
