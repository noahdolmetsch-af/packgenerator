<script>
  /**
   * C «Wetter pro Etappe» (Wetter-Ausbau, Noah 22.11.2026 «a»): on a tour of several days, one line per riding day with its
   * date and the place it ends, the temperature, the rain (dry, or from when) and the wind. It reads the points that the strip
   * «Weather along the route» has already kept on this device (nothing is fetched here) and rides each day from 08:00 at the
   * pace of the tour. A day the forecast does not reach says so. Everything is a hint; the stages stay as they are.
   */
  import { CloudRain, Wind, CalendarDays } from '@lucide/svelte';
  import { cacheQuery } from '../race/store.js';
  import { lineKm } from '../race/race.js';
  import { cacheFits, wxLineKey } from '../map/wxline.js';
  import { stageWeather } from './routewx.js';
  import { hasStages } from '../stages.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { trip, kmh = null, off = 0 } = $props();

  const q = $derived(cacheQuery(wxLineKey(trip?.id ?? '')));
  const entry = $derived($q ?? null);
  const pts = $derived(lineKm(trip?.route));
  const cache = $derived(cacheFits(entry?.data, pts) ? entry.data : null);
  const days = $derived(cache ? stageWeather(cache, trip, { kmh, off }) : []);
  const show = $derived(hasStages(trip) && !!trip?.route?.line?.length && kmh > 0);

  const wd = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'numeric' });
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const where = (d) => (d.to ? t('to {place}', { place: d.to }) : t('{km} km', { km: num(Math.round(d.km)) }));
</script>

{#if show}
  <section class="ew" aria-labelledby="ew-h" data-wx-stages>
    <h3 id="ew-h"><CalendarDays size={18} aria-hidden="true" />{t('Weather per riding day')}</h3>
    {#if days.length}
      <ol class="ew-list">
        {#each days as d (d.day)}
          <li data-wx-stage={d.day}>
            <b>{wd(d.date)}</b>
            <span class="ew-where">{where(d)}</span>
            {#if d.ok}
              <span class="ew-t num">{d.tmin === d.tmax ? `${d.tmin} °C` : `${d.tmin}–${d.tmax} °C`}</span>
              <span class="ew-r" class:wet={d.rainShare > 0}><CloudRain size={14} aria-hidden="true" />{d.rainAt ? t('rain from {at}', { at: hm(d.rainAt) }) : t('dry')}</span>
              {#if d.windMax != null}<span class="ew-w"><Wind size={14} aria-hidden="true" />{t('{kmh} km/h', { kmh: num(d.windMax) })}</span>{/if}
            {:else}
              <span class="ew-none">{t('The forecast does not reach this day yet.')}</span>
            {/if}
          </li>
        {/each}
      </ol>
      <p class="ew-src">{t('Each day starts at 08:00 and rides at the pace of the tour. A guide, not a promise.')}</p>
    {:else}
      <p class="ew-none" data-wx-stages-empty>{t('Load the weather along the route above, then the days show here.')}</p>
    {/if}
  </section>
{/if}

<style>
  .ew { margin: 10px 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; display: grid; gap: 6px; }
  h3 { margin: 0; font-size: var(--fs-sub); display: flex; align-items: center; gap: 6px; }
  .ew-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  li { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; }
  .ew-where, .ew-none, .ew-src { color: var(--ink-2); }
  .ew-r, .ew-w { display: inline-flex; align-items: center; gap: 3px; }
  .ew-r.wet { font-weight: 600; }
  .ew-src { margin: 0; font-size: 0.85rem; }
  .ew-none { margin: 0; }
</style>
