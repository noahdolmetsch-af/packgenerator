<script>
  /**
   * «Feierabend-Biwak» (Träume und Neuland N6, Noah 27.10.2026 «1-5 a»), on Touren › Träume: a night out
   * after work, «Friday 17:30 off, Saturday 9:00 back», with your places to sleep near home (best rated
   * first), the night's weather and «Plan it» (a two-day trip with the bivouac building block, so the
   * packing list is ready). The evening, the times and the distance can be changed under «Change».
   * Rules in biwak.js. onplan({ name, day, spot }).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { BIWAK_KEY, BIWAK_KM, biwakCfg, nextEvening, biwakSpots, rideMin, nightWx } from './biwak.js';
  import { ownQuery } from '../map/ownpoints.js';
  import { homeForecast } from '../home-weather.js';
  import { localDay } from '../localday.js';
  import { WEEKDAYS } from '../routine.js';
  import Seg from '../ui/Seg.svelte';
  import HomePlaceSheet from '../ich/HomePlaceSheet.svelte';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, num, locale } from '../i18n.svelte.js';
  import { Tent, MapPin, Star, CloudMoon, Backpack } from '@lucide/svelte';

  let { onplan } = $props();

  const cfgQ = liveQuery(async () => (await db.settings.get(BIWAK_KEY))?.value ?? null);
  const homeQ = liveQuery(async () => (await db.settings.get('homePlace'))?.value ?? null);
  const ownQ = ownQuery();
  const cfg = $derived(biwakCfg($cfgQ));
  const home = $derived($homeQ ?? null);
  const nowHm = new Date().toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' });
  const ev = $derived(nextEvening(localDay(), nowHm, cfg));
  const spots = $derived(biwakSpots($ownQ ?? [], home, cfg.maxKm));
  const save = (patch) => db.settings.put({ key: BIWAK_KEY, value: { ...cfg, ...patch } });

  let days = $state.raw([]);
  $effect(() => {
    if (!home) return;
    let live = true;
    homeForecast(db)
      .then((f) => live && (days = f?.days ?? []))
      .catch(() => {});
    return () => (live = false);
  });
  const wx = $derived(nightWx(days, ev));
  const wxText = $derived.by(() => {
    if (!wx) return '';
    const rain = wx.rain === 'rain' ? t('rain likely') : wx.rain === 'showers' ? t('showers possible') : t('dry');
    return Number.isFinite(wx.min) ? t('Night down to {n}° · {rain}', { n: Math.round(wx.min), rain }) : rain;
  });
  const dayName = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const wdName = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });

  let editing = $state(false);
  let placeOpen = $state(false);
  async function reset() {
    const before = $cfgQ;
    await db.settings.delete(BIWAK_KEY);
    offerDone(t('Back to Friday 17:30 to Saturday 9:00.'), () => (before ? db.settings.put({ key: BIWAK_KEY, value: before }) : null));
  }
</script>

<section class="ich-sec" aria-labelledby="bw-h" data-biwak>
  <div class="ich-h">
    <div>
      <h2 id="bw-h">{t('After-work bivouac')}</h2>
      <p class="ich-hs">{t('Off after work, back in the morning: a night out near home. Only a suggestion.')}</p>
    </div>
  </div>
  <div class="card ich-body bw">
    <p class="bw-when" data-bw-when>
      <span class="ich-ib"><Tent size={18} aria-hidden="true" /></span>
      <span><b>{t('{day} {start} off', { day: dayName(ev.day), start: cfg.start })}</b>{' · '}{t('{day} {back} back', { day: wdName(ev.next), back: cfg.back })}</span>
    </p>
    {#if wxText}<p class="bw-wx" data-bw-wx><CloudMoon size={16} aria-hidden="true" />{wxText}</p>{/if}

    {#if $homeQ !== undefined && !home}
      <p class="ich-help">{t('Set your home place, then the app looks for places to sleep around it.')}</p>
      <button type="button" class="btn" onclick={() => (placeOpen = true)} data-bw-home><MapPin size={16} aria-hidden="true" />{t('Set your home place')}</button>
    {:else if home}
      {#if spots.length}
        <ul class="bw-list">
          {#each spots as p (p.id)}
            <li class="bw-row" data-bw-spot={p.id}>
              <span class="bw-m">
                <b>{p.name || t('Place to sleep')}</b>
                <small>{t('{km} km · about {min} min', { km: num(p.km), min: rideMin(p.km) })}{#if p.stars}{' · '}<span class="bw-stars" aria-label={t('{n} of 5 stars', { n: p.stars })}><Star size={12} aria-hidden="true" />{p.stars}</span>{/if}</small>
              </span>
              <button type="button" class="btn sm" onclick={() => onplan?.({ name: t('After-work bivouac: {name}', { name: p.name || t('Place to sleep') }), day: ev.day, spot: p, cfg })} data-bw-plan><Backpack size={16} aria-hidden="true" />{t('Plan it')}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="ich-help" data-bw-none>{t('No place to sleep within {km} km yet. After a trip, rate where you slept, or mark a «Place to sleep» on the map.', { km: cfg.maxKm })}</p>
        <button type="button" class="btn sm" onclick={() => onplan?.({ name: t('After-work bivouac'), day: ev.day, spot: null, cfg })} data-bw-plan><Backpack size={16} aria-hidden="true" />{t('Plan it without a place')}</button>
      {/if}
    {/if}

    <button type="button" class="btn btn-link" aria-expanded={editing} onclick={() => (editing = !editing)} data-bw-change>{editing ? t('Close') : t('Change evening, times, distance')}</button>
    {#if editing}
      <div class="bw-edit" data-bw-edit>
        <p class="lbl" id="bw-wd">{t('Evening')}</p>
        <Seg small full={false} labelledby="bw-wd" value={String(cfg.weekday)} onchange={(v) => save({ weekday: Number(v) })} options={WEEKDAYS.map((w, i) => ({ key: String(i + 1), name: t(w) }))} />
        <div class="bw-times">
          <label><span class="lbl">{t('Off at')}</span><input class="inp" type="time" value={cfg.start} onchange={(e) => e.currentTarget.value && save({ start: e.currentTarget.value })} data-bw-start /></label>
          <label><span class="lbl">{t('Back at')}</span><input class="inp" type="time" value={cfg.back} onchange={(e) => e.currentTarget.value && save({ back: e.currentTarget.value })} data-bw-back /></label>
        </div>
        <p class="lbl" id="bw-km">{t('Places to sleep up to')}</p>
        <Seg small full={false} labelledby="bw-km" value={String(cfg.maxKm)} onchange={(v) => save({ maxKm: Number(v) })} options={BIWAK_KM.map((k) => ({ key: String(k), name: `${k} km` }))} />
        {#if $cfgQ}<button type="button" class="btn btn-link" onclick={reset} data-bw-reset>{t('Back to Friday 17:30 to Saturday 9:00')}</button>{/if}
      </div>
    {/if}
  </div>
</section>

{#if placeOpen}<HomePlaceSheet current={null} onclose={() => (placeOpen = false)} />{/if}

<style>
  .bw {
    display: grid;
    gap: var(--sp-3);
  }
  .bw-when {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    margin: 0;
    overflow-wrap: break-word;
  }
  .bw-wx {
    display: flex;
    gap: 6px;
    align-items: center;
    margin: 0;
    color: var(--ink-2);
  }
  .bw-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--sp-2);
  }
  .bw-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-3);
    align-items: center;
  }
  .bw-m {
    flex: 1;
    min-width: 10em;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    overflow-wrap: break-word;
  }
  .bw-m small {
    color: var(--ink-3);
  }
  .bw-stars {
    display: inline-flex;
    gap: 2px;
    align-items: center;
  }
  .bw-row .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .bw-edit {
    display: grid;
    gap: var(--sp-2);
  }
  .bw-edit .lbl {
    margin: 0;
  }
  .bw-times {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-3);
  }
  .bw-times label {
    display: grid;
    gap: 4px;
  }
</style>
