<script>
  /**
   * «Heute passt: Ausflugstipps» (Träume und Neuland N3, Noah 27.10.2026 «1-5 a»), at the top of Touren › Träume:
   * three places you have never been (passes, lakes, municipalities from Neuland) that fit the free time of the
   * day, with the weather at home. The hours start from the Google calendar copy when there is one; they can
   * be changed. «Round through it» plans the Neuland-Runde (SpotRoundSheet.svelte, one router request per tap).
   * After 17:00 the tips are for tomorrow. Rules in tipps.js (pure, tests/tipps.test.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { readRaw, computeFrom } from './store.js';
  import { tripTips, freeTime, startHours, TIP_KINDS, TIP_HOURS } from './tipps.js';
  import { homeForecast } from '../home-weather.js';
  import { localDay } from '../localday.js';
  import Seg from '../ui/Seg.svelte';
  import HomePlaceSheet from '../ich/HomePlaceSheet.svelte';
  import SpotRoundSheet from './SpotRoundSheet.svelte';
  import { t, num } from '../i18n.svelte.js';
  import { MapPin, Route, Mountain, Waves, Landmark, CloudSun } from '@lucide/svelte';

  const now = new Date();
  const hourZ = Number(now.toLocaleTimeString('de-CH', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' }).slice(0, 2));
  const late = hourZ >= 17;
  const today = localDay();
  const day = late ? ((d) => (d.setUTCDate(d.getUTCDate() + 1), d.toISOString().slice(0, 10)))(new Date(`${today}T12:00:00Z`)) : today;

  const rawQ = liveQuery(() => readRaw(db));
  const evQ = liveQuery(async () => (db.gEvents ? await db.gEvents.toArray() : []));
  let cols = $state.raw(null);
  let failed = $state(false);
  $effect(() => {
    const raw = $rawQ;
    if (!raw) return;
    let live = true;
    computeFrom(raw, { only: TIP_KINDS })
      .then((r) => live && ((cols = r.collections), (failed = false)))
      .catch((err) => {
        console.error(err);
        if (live) failed = true;
      });
    return () => (live = false);
  });
  const home = $derived($rawQ?.homePlace ?? null);
  const hasCal = $derived(($evQ ?? []).length > 0);
  const free = $derived(hasCal ? freeTime($evQ, day, late ? null : now.toISOString()) : null);
  let picked = $state(null); // the hours the user chose; else from the calendar
  const hours = $derived(picked ?? startHours(free));
  const tips = $derived(cols && home ? tripTips(cols, home, { hours }) : null);

  let wx = $state(null);
  $effect(() => {
    if (!home) return;
    let live = true;
    homeForecast(db)
      .then((f) => live && (wx = f?.days?.find((d) => d.date === day) ?? null))
      .catch(() => {});
    return () => (live = false);
  });
  const wxText = $derived.by(() => {
    if (!wx) return '';
    const rain = wx.rain === 'rain' ? t('rain likely') : wx.rain === 'showers' ? t('showers possible') : t('dry');
    return Number.isFinite(wx.max) ? `${Math.round(wx.max)}° · ${rain}` : rain;
  });
  const freeText = $derived(!hasCal ? '' : free ? t('Calendar: free {from}–{to}', { from: free.from, to: free.to }) : t('Calendar: the day is full'));
  const KIND = { passes: { name: 'Pass', icon: Mountain }, lakes: { name: 'Lake', icon: Waves }, municipalities: { name: 'Municipality', icon: Landmark } };

  let placeOpen = $state(false);
  let roundTo = $state(null);
</script>

<section class="ich-sec" aria-labelledby="tt-h" data-trip-tips>
  <div class="ich-h">
    <div>
      <h2 id="tt-h">{late ? t('Fits tomorrow: trip tips') : t('Fits today: trip tips')}</h2>
      <p class="ich-hs">{t('Three places you have never been, in reach of your free time.')}</p>
    </div>
  </div>
  {#if $rawQ !== undefined && !home}
    <div class="card ich-body">
      <p class="ich-help">{t('Set your home place, then the app finds new places around it.')}</p>
      <button type="button" class="btn" onclick={() => (placeOpen = true)} data-tt-home><MapPin size={16} aria-hidden="true" />{t('Set your home place')}</button>
    </div>
  {:else if failed}
    <p class="ich-help" role="status">{t('The places could not be loaded. Try again later.')}</p>
  {:else if !tips}
    <p class="ich-help" role="status">{t('Looking for places …')}</p>
  {:else}
    <div class="card ich-body tt">
      <div class="tt-top">
        <p class="tt-ctx" data-tt-ctx>
          {#if wxText}<span data-tt-wx><CloudSun size={16} aria-hidden="true" />{wxText}</span>{/if}
          {#if freeText}<span data-tt-free>{freeText}</span>{/if}
        </p>
        <Seg small full={false} label={t('Time for the ride')} value={String(hours)} onchange={(v) => (picked = Number(v))} options={TIP_HOURS.map((h) => ({ key: String(h), name: t('{n} h', { n: h }) }))} />
      </div>
      {#if tips.length}
        <ul class="tt-list">
          {#each tips as x (x.id)}
            {@const K = KIND[x.cid]}
            <li class="tt-row" data-tt-tip={x.id}>
              <span class="ich-ib"><K.icon size={18} aria-hidden="true" /></span>
              <span class="tt-m"><b>{x.name}</b><small>{t(K.name)} · {t('≈ {km} km there and back', { km: num(x.roundKm) })}{#if x.alt}{' · '}{num(x.alt)} m{/if}</small></span>
              <button type="button" class="btn sm" onclick={() => (roundTo = x)} data-tt-round><Route size={16} aria-hidden="true" />{t('Round through it')}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="ich-help">{t('No new place within reach. Choose more time.')}</p>
      {/if}
    </div>
  {/if}
</section>

{#if placeOpen}<HomePlaceSheet current={null} onclose={() => (placeOpen = false)} />{/if}
{#if roundTo}<SpotRoundSheet {home} spot={roundTo} onclose={() => (roundTo = null)} />{/if}

<style>
  .tt {
    display: grid;
    gap: var(--sp-3);
  }
  .tt-top {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    justify-content: space-between;
  }
  .tt-ctx {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tt-ctx span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .tt-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .tt-row {
    display: flex;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
    flex-wrap: wrap;
  }
  .tt-m {
    flex: 1;
    min-width: 9em;
    display: grid;
    overflow-wrap: break-word;
  }
  .tt-m small {
    color: var(--ink-3);
  }
  .tt-row .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
