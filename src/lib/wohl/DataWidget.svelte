<script>
  /**
   * Paket P #293 «Daten-Widget» (Noah 19.10.2026 «2 beides»: on Heute as its own tile AND on the
   * Auswertung): km today and this week, the weather at home, sleep, HRV and resting pulse, each next to
   * your normal of the 30 days before. Observation only: no colours for good or bad, no score.
   * The values: lib/wohl.js widgetValues. Without Fitbit or a home place those lines say how they come.
   */
  import { liveQuery } from 'dexie';
  import { Bike, CloudSun, Moon, Activity, HeartPulse } from '@lucide/svelte';
  import { db } from '../db.js';
  import { homeForecast } from '../home-weather.js';
  import { lastDays, addDays } from '../flow.js';
  import { localDay } from '../localday.js';
  import { widgetValues } from '../wohl.js';
  import { countedRidesSince } from '../kmbook.js';
  import { health } from '../health/client.svelte.js';
  import { t, locale } from '../i18n.svelte.js';

  let { title = '', idp = 'dw' } = $props();
  const today = localDay();
  const from = lastDays(today, 40)[0];
  const q = liveQuery(async () => {
    // UI-Test T5: the km of today and 7 days from the same rides as «Diese Woche» (Strava, files, recordings)
    const [rides, health] = await Promise.all([countedRidesSince(db, from), db.healthDays ? db.healthDays.where('date').aboveOrEqual(from).toArray() : []]);
    return { rides, health };
  });
  let forecast = $state(null);
  $effect(() => {
    homeForecast(db)
      .then((f) => (forecast = f))
      .catch(() => (forecast = null));
  });
  const v = $derived($q ? widgetValues({ ...$q, forecast, today }) : null);
  const n1 = (x) => (x == null ? '–' : Number(x).toLocaleString(locale(), { maximumFractionDigits: 1 }));
  // Fitbit is live (Noah 20.10.2026 «prüfe, dass wir Fitbit überall einbinden»): a missing value says why
  const missing = (what) => (health.prefs.connected ? t('{what}: no value yet', { what }) : t('{what}: connect Fitbit', { what }));
  // Noah 26.10.2026 «1a»: a value from an earlier day says which day (Fitbit often sends the night later)
  const dayWord = (d) => (d === addDays(today, -1) ? t('yesterday') : wd(d));
  const wd = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' });
  // a night counts to the day you woke up: «Schlaf · Nacht auf So.»
  const sleepLabel = (day, normal) => (day && day !== today ? t('sleep · night to {day}', { day: wd(day) }) : normal ?? t('sleep'));
  const label = (what, day, normal) => (day && day !== today ? t('{what} · {day}', { what, day: dayWord(day) }) : normal ?? what);
  const RAIN = { none: 'dry', showers: 'showers', rain: 'rain' };
</script>

<section class="dw card" aria-labelledby="{idp}-h" data-data-widget>
  <h2 id="{idp}-h">{title || t('Your values today')}</h2>
  {#if v}
    <ul>
      <li data-dw="km"><Bike size={18} aria-hidden="true" /><span><b class="num">{n1(v.kmToday)} km</b><small>{t('today · {km} km in 7 days', { km: n1(v.kmWeek) })}</small></span></li>
      <li data-dw="weather"><CloudSun size={18} aria-hidden="true" /><span>{#if v.weather}<b class="num">{v.weather.min}–{v.weather.max} °C</b><small>{t(RAIN[v.weather.rain] ?? 'weather at home')}</small>{:else}<b>–</b><small>{t('weather: set a home place under Me')}</small>{/if}</span></li>
      <li data-dw="sleep"><Moon size={18} aria-hidden="true" /><span><b class="num">{v.sleepH == null ? '–' : `${n1(v.sleepH)} h`}</b><small>{v.sleepH == null ? missing(t('sleep')) : sleepLabel(v.sleepDay, v.sleepNormal != null ? t('sleep · your normal {n} h', { n: n1(v.sleepNormal) }) : null)}</small></span></li>
      <li data-dw="hrv"><Activity size={18} aria-hidden="true" /><span><b class="num">{v.hrv == null ? '–' : `${v.hrv} ms`}</b><small>{v.hrv == null ? missing(t('HRV')) : label(t('HRV'), v.hrvDay, v.hrvNormal != null ? t('HRV · your normal {n} ms', { n: Math.round(v.hrvNormal) }) : null)}</small></span></li>
      <li data-dw="pulse"><HeartPulse size={18} aria-hidden="true" /><span><b class="num">{v.restingHr == null ? '–' : `${v.restingHr}`}</b><small>{v.restingHr == null ? missing(t('resting pulse')) : label(t('resting pulse'), v.restingDay, v.restingNormal != null ? t('resting pulse · your normal {n}', { n: Math.round(v.restingNormal) }) : null)}</small></span></li>
    </ul>
    <p class="note">{t('Only to look at, no score.')}</p>
  {/if}
</section>

<style>
  .dw {
    padding: 14px 16px;
    margin: 0 0 18px;
  }
  h2 {
    margin: 0 0 10px;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px 16px;
  }
  li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    min-width: 0;
  }
  li span {
    display: grid;
    min-width: 0;
  }
  small,
  .note {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .note {
    margin: 10px 0 0;
  }
</style>
