<script>
  /**
   * «Wetter oben» W2 (Noah 23.11.2026 «b»): three small cards under the weather card on Today, for the home place:
   * «Weather of the week» (the best day to ride), «After the rain: oil the chain» (it rained in the last 24 hours, only with
   * a bike) and «Ride window» (how long it stays dry today and how long the light lasts). Each one can be put aside for the
   * day with «Not today»; the rules are in heutekarten.js. Nothing shows without a weather answer. A guess, like all weather.
   */
  import { liveQuery } from 'dexie';
  import { CalendarCheck, Droplets, Clock } from '@lucide/svelte';
  import { db } from '../db.js';
  import { HOME_PLACE } from '../know.js';
  import { REFRESHED } from '../home/refresh.js';
  import { localDay } from '../localday.js';
  import { loadCore, COST_WORD } from './kern.js';
  import { weekBest, afterRain, rideWindow } from './heutekarten.js';
  import { t, num, locale } from '../i18n.svelte.js';

  const KEY = 'heuteKartenOff'; // { week, chain, window: 'YYYY-MM-DD' of the day it was put aside }
  const homeQ = liveQuery(() => db.settings.get(HOME_PLACE));
  const offQ = liveQuery(() => db.settings.get(KEY));
  const bikesQ = liveQuery(() => db.bikes.count());

  const home = $derived($homeQ?.value && Number.isFinite(Number($homeQ.value.lat)) ? { lat: Number($homeQ.value.lat), lon: Number($homeQ.value.lon) } : null);
  let core = $state(null);
  let key = '';
  const read = (pl, k) => loadCore(db, pl).then((c) => (k == null || k === key) && (core = c)).catch(() => {});
  $effect(() => {
    const k = home ? `${home.lat},${home.lon}` : '';
    if (k === key) return;
    key = k;
    core = null;
    if (home) read(home, k);
  });
  $effect(() => {
    const again = () => home && read(home, null);
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 5 * 60_000);
    return () => clearInterval(id);
  });

  const day = $derived(localDay(new Date(now)));
  const off = $derived($offQ?.value ?? {});
  const shown = (k) => off[k] !== day;
  async function later(k) {
    await db.settings.put({ key: KEY, value: { ...off, [k]: day } });
  }

  const week = $derived(core && shown('week') ? weekBest(core, now) : null);
  const rain = $derived(core && shown('chain') && ($bikesQ ?? 0) > 0 ? afterRain(core, now) : null);
  const win = $derived(core && shown('window') ? rideWindow(core, now) : null);

  const hm = (ms) => new Date(ms).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  const weekday = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long' });
  const weekName = $derived.by(() => {
    if (!week) return '';
    const w = week.day === 'today' ? t('today') : week.day === 'tomorrow' ? t('tomorrow') : weekday(week.date);
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  const weekDry = $derived(week ? (week.rainMm < 0.5 ? t('dry') : t('{mm} mm rain', { mm: num(week.rainMm) })) : '');
</script>

{#if week || rain || win}
  <div class="hk" data-heute-karten>
    {#if week}
      <section class="hk-card" aria-label={t('Weather of the week')} data-heute-woche>
        <a class="hk-link" href="#/wetter">
          <span class="hk-h"><CalendarCheck size={16} aria-hidden="true" />{t('Best day to ride')}</span>
          <b>{weekName}, {hm(week.start)}–{hm(week.end)}</b>
          <span class="hk-sub">{num(week.tmin)}–{num(week.tmax)} °C · {weekDry} · {t(COST_WORD[week.word])}</span>
        </a>
        <button type="button" class="hk-later" onclick={() => later('week')}>{t('Not today')}</button>
      </section>
    {/if}
    {#if rain}
      <section class="hk-card" aria-label={t('After the rain: oil the chain')} data-heute-kette>
        <a class="hk-link" href="#/bikes?tab=care&view=rounds">
          <span class="hk-h"><Droplets size={16} aria-hidden="true" />{t('After the rain: oil the chain')}</span>
          <b>{t('{mm} mm of rain in the last 24 hours', { mm: num(rain.mm) })}</b>
        </a>
        <button type="button" class="hk-later" onclick={() => later('chain')}>{t('Not today')}</button>
      </section>
    {/if}
    {#if win}
      <section class="hk-card" aria-label={t('Ride window')} data-heute-fenster>
        <a class="hk-link" href="#/wetter">
          <span class="hk-h"><Clock size={16} aria-hidden="true" />{t('Ride window')}</span>
          <b>{win.by === 'rain' ? t('Dry until {at}', { at: hm(win.until) }) : t('Dry until sunset')}</b>
          <span class="hk-sub">{t('Daylight until {set}, lights on from {lamp}', { set: hm(win.set), lamp: hm(win.lampOn) })}</span>
        </a>
        <button type="button" class="hk-later" onclick={() => later('window')}>{t('Not today')}</button>
      </section>
    {/if}
  </div>
{/if}

<style>
  .hk {
    flex: 1 1 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .hk-card {
    flex: 1 1 150px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 10px 12px;
    font-size: var(--fs-small);
  }
  .hk-link {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--ink);
    text-decoration: none;
    min-width: 0;
  }
  .hk-h {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .hk-sub {
    color: var(--ink-2);
  }
  .hk-later {
    align-self: flex-start;
    background: none;
    border: 0;
    padding: 4px 0;
    min-height: 32px;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
