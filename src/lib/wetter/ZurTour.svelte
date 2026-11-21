<script>
  /**
   * «Für deine Tour» (UI-Prüfung 07.11.2026, T3, Noah «5b»): the card at the top of the weather page (part «Jetzt») for the
   * next planned trip: its day, the weather of that day, the state of the rain things on its packing list and three ways:
   * the packing list, «What do I wear?» and the best time for a ride (the part «Planen» of this page). Without the weather
   * service the card still stands, says so in one line and keeps its ways. Everything is a suggestion; it only looks.
   * trip: the trip (from the page); fallback: the home place, used when the trip has no place or route start of its own;
   * onplan: shows the part «Planen».
   */
  import { liveQuery } from 'dexie';
  import { CloudRain, Sun, Backpack, Shirt, Target, ChevronRight } from '@lucide/svelte';
  import { db } from '../db.js';
  import { loadCore, hoursBetween } from './kern.js';
  import { tourWeather, rainGear, tourDay } from './zurtour.js';
  import { localDay } from '../localday.js';
  import { daysTo } from '../touren.js';
  import { PACK_HREF } from '../touren.js';
  import { switchTrip, openWear } from '../nav.js';
  import { tourHref } from '../touren/tour.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';

  let { trip, fallback = null, onplan = () => {} } = $props();
  const today = localDay();
  const itemsQ = liveQuery(() => db.items.toArray());

  const own = $derived(trip?.place ?? trip?.route?.start ?? null);
  const place = $derived(own && Number.isFinite(Number(own.lat)) ? { lat: Number(own.lat), lon: Number(own.lon), name: own.name ?? '' } : fallback);
  let core = $state(null);
  let asked = $state(false);
  let key = '';
  $effect(() => {
    const p = place;
    const k = p ? `${p.lat},${p.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
    asked = false;
    if (!p) return (asked = true);
    loadCore(db, p)
      .then((c) => k === key && (core = c))
      .catch(() => {})
      .finally(() => k === key && (asked = true));
  });

  const day = $derived(tourDay(trip, today));
  const w = $derived(tourWeather(core, trip, today));
  const gear = $derived(rainGear(trip, $itemsQ ?? []));
  const off = $derived(core?.offset ?? 0);
  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hourCycle: 'h23' });
  const dayName = $derived(new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' }));
  const when = $derived.by(() => {
    const n = daysTo(day, today);
    return n === 0 ? t('Today') : n === 1 ? t('Tomorrow') : tn(n, 'in {n} day', 'in {n} days');
  });
  const rainy = $derived(!!w?.rainFrom);
  // the forecast reaches 16 days; the hours exist, but not for this day
  const covers = $derived(core ? hoursBetween(core, 0, Number.MAX_SAFE_INTEGER).length > 0 : false);
  const gearLine = $derived(gear.n === 0 ? t('nothing on the list yet') : gear.packed === gear.n ? t('packed') : tn(gear.n, '{done} of {n} packed', '{done} of {n} packed', { done: gear.packed }));
  const gearOk = $derived(gear.n > 0 && gear.packed === gear.n);
  const openPack = (e) => (e.preventDefault(), switchTrip(trip.id, PACK_HREF));
</script>

{#if trip}
  <section class="card zt" aria-labelledby="zt-h" data-zur-tour={trip.id}>
    <p class="zt-tag" id="zt-h">{t('For your trip')}</p>
    <p class="zt-head"><a class="zt-name" href={tourHref(`t:${trip.id}`)} data-zt-name>{trip.title}</a><small>{dayName} · {when}</small></p>
    {#if w}
      <p class="zt-wx" data-zt-weather>
        {#if rainy}<CloudRain size={16} aria-hidden="true" />{t('Rain from {at}', { at: hm(w.rainFrom + off * 1000) })}{:else}<Sun size={16} aria-hidden="true" />{t('dry')}{/if}
        <span>· {num(w.tmin)}–{num(w.tmax)} °C{w.windMax != null ? ` · ${t('{kmh} km/h', { kmh: num(w.windMax) })}` : ''}</span>
      </p>
      {#if rainy}
        <p class="zt-gear" data-zt-gear><span>{t('Rain things')}</span><b class:ok={gearOk} class:miss={!gearOk}>{gearLine}</b></p>
      {/if}
    {:else if asked}
      <p class="zt-note" data-zt-none role="status">{core && covers ? t('The forecast does not reach this day yet.') : t('The weather for this day is not available right now. The ways below still work.')}</p>
    {/if}
    <div class="zt-acts">
      <a class="btn k" href={PACK_HREF} onclick={openPack} data-zt-pack><Backpack size={16} aria-hidden="true" />{t('Open packing list')}<ChevronRight size={14} aria-hidden="true" /></a>
      <button type="button" class="btn sm" onclick={() => openWear()} data-zt-wear><Shirt size={16} aria-hidden="true" />{t('What do I wear?')}</button>
      <button type="button" class="btn sm" onclick={onplan} data-zt-plan><Target size={16} aria-hidden="true" />{t('Best time for a ride')}</button>
    </div>
  </section>
{/if}

<style>
  .zt {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .zt-tag {
    margin: 0;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .zt-head {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
  }
  .zt-name {
    color: var(--ink);
    font: 600 var(--fs-h3, 1.1rem) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .zt-head small {
    color: var(--ink-2);
  }
  .zt-wx,
  .zt-gear {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
  }
  .zt-wx span {
    color: var(--ink-2);
  }
  .zt-gear {
    justify-content: space-between;
  }
  .zt-gear span {
    color: var(--ink-2);
  }
  .zt-gear .ok {
    color: var(--ok, var(--st-plan));
  }
  .zt-gear .miss {
    color: var(--warn, var(--ink));
  }
  .zt-note {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .zt-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
  }
  .zt-acts .btn {
    min-height: 44px;
  }
</style>
