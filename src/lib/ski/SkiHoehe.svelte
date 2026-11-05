<script>
  /**
   * «Temperaturen nach Höhe» in «Tour planen» (Noah 05.11.2026 «4b»): the air temperature at 500, 1000 … 4000 m over the
   * place of the tour, on the day of the tour (6, 9, 12 and 15 h). Two optional heights (start and peak, saved in the plan)
   * turn it into the temperature at the start (a button puts it into «Temperature at the start», nothing is filled
   * in on its own) and a few hints: the 0 °C line, a very cold peak, a peak or a start above zero. The hints are a
   * suggestion from the weather model and say so: the avalanche bulletin and your own eyes decide. The layers
   * (profil.js, shared with «Nebelgrenze» and the weather page) reach today and two days; the card says so for a later tour.
   * SkiPlan mounts it with one line.
   *
   * Props: trip (with place and startDate), plan (trip.ski.plan).
   */
  import { Lightbulb } from '@lucide/svelte';
  import { db } from '../db.js';
  import { REFRESHED } from '../home/refresh.js';
  import { setPlan } from './skidb.js';
  import { loadProfil } from '../wetter/profil.js';
  import { hasDay, dayRows, skiHints, tempOnDay, DAY_HOURS } from '../wetter/hoehe.js';
  import { minutesOf } from '../skiplan.js';
  import { openTrip } from '../nav.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { trip, plan = {} } = $props();

  const place = $derived(trip?.place && Number.isFinite(Number(trip.place.lat)) ? { lat: Number(trip.place.lat), lon: Number(trip.place.lon) } : null);
  let air = $state(null);
  let loaded = $state(false);
  let key = '';
  const read = (pl, k) => loadProfil(db, pl).then((f) => (k == null || k === key) && (air = f)).catch(() => {}).finally(() => (loaded = true));
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    air = null;
    loaded = false;
    if (place) read(place, k);
  });
  $effect(() => {
    const again = () => place && read(place, null);
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });

  const date = $derived(trip?.startDate ?? '');
  const known = $derived(air && hasDay(air, date));
  const rows = $derived(known ? dayRows(air, date) : []);
  const ascentMin = $derived(minutesOf(plan.ascentAt) ?? 7 * 60);
  const peakMin = $derived(minutesOf(plan.peakPlanAt) ?? 11 * 60);
  const startM = $derived(Number.isFinite(plan.startM) ? plan.startM : null);
  const peakM = $derived(Number.isFinite(plan.peakM) ? plan.peakM : null);
  const hints = $derived(known ? skiHints(air, date, { startM, peakM, ascentMin, peakMin }) : []);
  const atStart = $derived(known && startM != null ? tempOnDay(air, date, ascentMin, startM) : null);
  const clock = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const deg = (v) => (v == null ? '–' : `${v < 0 && Math.round(Math.abs(v)) > 0 ? '−' : ''}${num(Math.round(Math.abs(v)))}°`);
  const days = $derived(air ? new Set(air.hours.map((h) => new Date(h.ms + (air.offset ?? 0) * 1000).toISOString().slice(0, 10))).size : 0);
  const longDay = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  const setNum = (field, value) => {
    const raw = String(value).replace(/[^\d]/g, '');
    const n = Number(raw);
    return setPlan(trip.id, { [field]: raw && Number.isFinite(n) && n <= 4800 ? n : null });
  };
  const use = () => setPlan(trip.id, { temp: Math.round(atStart) });
  const used = $derived(atStart != null && plan.temp === Math.round(atStart));
  const goPlace = () => {
    openTrip(trip.id);
    location.hash = '#/pack';
  };
</script>

<section class="surf sk-pad box" aria-labelledby="hh-h" data-plan="heights">
  <h2 id="hh-h" class="sk-title">{t('Temperatures by height')}</h2>
  <p class="sk-quiet">{t('The air temperature at 500 to 4000 m over the place of your tour, on the day of the tour.')}</p>

  {#if !place}
    <p class="sk-quiet" data-heights-noplace>{t('Give the tour a place to see the temperatures by height.')}</p>
    <button type="button" class="btn sm" onclick={goPlace} data-heights-place>{t('Open the tour')}</button>
  {:else if !loaded}
    <p class="sk-quiet" data-heights-wait>{typeof navigator !== 'undefined' && navigator.onLine === false ? t('Offline: no air layers kept for this place yet.') : t('Looking up the air layers …')}</p>
  {:else if !air}
    <p class="sk-quiet" data-heights-none>{typeof navigator !== 'undefined' && navigator.onLine === false ? t('Offline: no air layers kept for this place yet.') : t('The weather service did not answer. Try again in a moment.')}</p>
  {:else if !known}
    <p class="sk-quiet" data-heights-later>{t('The air layers reach {n} days from today. Your tour is on {day}: the temperatures show here then.', { n: num(days), day: longDay(date) })}</p>
  {:else}
    <div class="hk-wrap">
      <table class="hk-tab" data-heights-table>
        <thead>
          <tr>
            <th scope="col"><span class="sr">{t('Height')}</span></th>
            {#each DAY_HOURS as h (h)}<th scope="col">{t('{h} h', { h })}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.z)}
            <tr data-heights-row={r.z}>
              <th scope="row">{num(r.z)} m</th>
              {#each r.cells as c (c.hour)}<td>{deg(c.t)}</td>{/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="sk-grid2">
      <label class="sk-field"><span>{t('Height of the start (m)')}</span><input class="inp num" inputmode="numeric" value={plan.startM ?? ''} onchange={(e) => setNum('startM', e.currentTarget.value)} data-f="startM" /></label>
      <label class="sk-field"><span>{t('Height of the peak (m)')}</span><input class="inp num" inputmode="numeric" value={plan.peakM ?? ''} onchange={(e) => setNum('peakM', e.currentTarget.value)} data-f="peakM" /></label>
    </div>

    {#if atStart != null}
      <p class="sk-tip" data-heights-start><Lightbulb size={16} aria-hidden="true" /><span>{t('Air at the start ({m} m, {at}): {t} °C', { m: num(startM), at: clock(ascentMin), t: deg(atStart).replace('°', '') })}</span></p>
      <button type="button" class="btn sm" onclick={use} disabled={used} data-heights-use>{used ? t('Used|hoehe') : t('Use for «Temperature at the start»')}</button>
    {/if}

    {#each hints as h (h.key)}
      <p class="sk-tip" data-heights-hint={h.key}>
        <Lightbulb size={16} aria-hidden="true" />
        <span>
          {#if h.key === 'zero'}{t('0 °C line at {at} about {m} m above sea level.', { at: clock(h.min), m: num(h.m) })}
          {:else if h.key === 'peakCold'}{t('About {t} °C at the peak ({m} m): warm layers, a spare jacket and warm gloves.', { t: deg(h.t).replace('°', ''), m: num(h.m) })}
          {:else if h.key === 'peakWarm'}{t('About {t} °C at the peak ({m} m): above zero, the snow can get wet. Think about an early start and an earlier turnaround.', { t: deg(h.t).replace('°', ''), m: num(h.m) })}
          {:else}{t('About {t} °C already at the start ({m} m): the snow may not have frozen overnight.', { t: deg(h.t).replace('°', ''), m: num(h.m) })}{/if}
        </span>
      </p>
    {/each}
    <p class="sk-quiet">{t('The temperature of the free air at that height, from the air layers of the weather model (Open-Meteo). On a slope in the sun it can differ by a few degrees. A guess for planning.')} {t('A suggestion from the weather model, not a judgement of the slope. The avalanche bulletin and your own eyes decide.')}</p>
  {/if}
</section>

<style>
  .hk-wrap {
    overflow-x: auto;
  }
  .hk-tab {
    width: 100%;
    max-width: 30em;
    border-collapse: collapse;
    font-size: var(--fs-small);
    font-variant-numeric: tabular-nums;
    text-align: center;
  }
  .hk-tab th,
  .hk-tab td {
    padding: 4px;
    white-space: nowrap;
  }
  .hk-tab thead th {
    color: var(--ink-2);
    font-weight: 500;
  }
  .hk-tab tbody th {
    text-align: left;
    font-weight: 600;
  }
</style>
