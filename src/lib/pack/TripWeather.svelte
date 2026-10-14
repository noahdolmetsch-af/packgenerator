<script module>
  // The forecasts of the campsites in this visit of the app (place → forecast): a second look asks no one.
  const cache = new Map();
</script>

<script>
  /**
   * v0.102.0 Design-Refresh P4 «Touren» (T4 «Wetter am Event», T5 «Wetter an den Zeltplätzen», approved
   * 12.10.2026). kind 'event': the days of the event from the trip's saved forecast (weather.js). kind
   * 'camps': a trip of several days with a route asks Open-Meteo for the place where each day ends
   * (stages.js), only online and only when the day is in the forecast's reach (16 days); the query
   * carries the map point, never a name. Offline or too early: one quiet line. Read-only.
   */
  import DayTiles from '../ui/DayTiles.svelte';
  import Skeleton from '../ui/Skeleton.svelte';
  import { forecastForTrip, fetchForecast, FORECAST_DAYS } from '../weather.js';
  import { stagePlan } from '../stages.js';
  import { daysTo } from '../touren.js';
  import { localDay } from '../localday.js';
  import { t } from '../i18n.svelte.js';

  let { trip, kind = 'event' } = $props();

  const today = localDay();
  const stops = $derived(kind === 'camps' ? stagePlan(trip).filter((s) => s.end && s.date) : []);
  const reach = $derived(stops.length > 0 && stops.every((s) => { const n = daysTo(s.date, today); return n >= 0 && n < FORECAST_DAYS; }));
  let camps = $state(null); // null: not asked; [] … the days
  let failed = $state(false);
  const key = (p) => `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

  $effect(() => {
    if (kind !== 'camps' || !reach) return;
    const want = stops.map((s) => ({ s, k: key(s.end) }));
    let gone = false;
    (async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine && !want.every((w) => cache.has(w.k))) {
        failed = true;
        return;
      }
      try {
        const out = [];
        for (const { s, k } of want) {
          if (!cache.has(k)) cache.set(k, await fetchForecast({ name: '', lat: s.end.lat, lon: s.end.lon }));
          const d = cache.get(k).days.find((x) => x.date === s.date);
          if (d) out.push({ ...d, label: s.to || '' });
        }
        if (!gone) camps = out;
      } catch {
        if (!gone) failed = true;
      }
    })();
    return () => (gone = true);
  });

  const days = $derived(kind === 'event' ? forecastForTrip(trip) : (camps ?? []));
  const sub = $derived(kind === 'event' ? ['Open-Meteo', trip.place?.name ?? ''].filter(Boolean).join(' · ') : t('where each day ends · Open-Meteo'));
</script>

{#if kind === 'event' ? days.length : stops.length}
  <section class="tw" aria-labelledby="tw-{kind}-h">
    <h2 id="tw-{kind}-h">{kind === 'event' ? t('Weather at the event') : t('Weather at the campsites')}</h2>
    <p class="sub">{sub}</p>
    <!-- FE9 «Ruhiges Laden» (Noah 13.10.2026): while the forecast loads, calm bars in its height, nothing jumps -->
    {#if kind === 'camps' && reach && !failed && camps === null}<Skeleton rows={3} />{:else}
    <div class="card body">
      {#if days.length}
        <DayTiles {days} />
      {:else}
        <p class="quiet">{!reach ? t('The forecast comes about two weeks before the trip, online.') : failed ? t('No forecast right now. It needs the internet once.') : t('Loading…')}</p>
      {/if}
    </div>
    {/if}
  </section>
{/if}

<style>
  .tw {
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sub {
    margin: 2px 0 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .quiet {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
