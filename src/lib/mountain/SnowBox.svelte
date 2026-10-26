<script>
  /**
   * Paket J #160 (Noah 19.10.2026 «1a und b und als sichtbar auf der skitouren seite»): freezing level
   * and fresh snow for a tour in the mountains, from Open-Meteo (snow.js). In the planning of every
   * ski tour and mountain tour (TripRoute) and on the Skitouren page (compact). Online it fetches
   * once when the saved numbers are older than 3 hours; offline the saved ones show. Numbers only,
   * never a rating. «Hide» takes the box away for this trip (trip.snowOff), «Show snow» brings it back.
   *
   * save(fields): stores the fields on the trip (Pack: onchange; Skitouren: the database).
   */
  import { Snowflake, ThermometerSnowflake, RefreshCw } from '@lucide/svelte';
  import { fetchSnow, snowForTrip, snowReach, snowStale, FRESH_DAYS } from './snow.js';
  import { ageText } from '../weather.js';
  import { localDay } from '../localday.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { trip, save, compact = false } = $props();

  const today = localDay();
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);
  $effect(() => {
    const up = () => (online = navigator.onLine);
    window.addEventListener('online', up);
    window.addEventListener('offline', up);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', up);
    };
  });

  let loading = $state(false);
  let failed = $state(false);
  const reach = $derived(snowReach(trip, today));
  const shown = $derived(snowForTrip(trip));

  async function load() {
    if (!trip.place) return;
    loading = true;
    failed = false;
    try {
      const snow = await fetchSnow(trip.place);
      await save({ snow });
    } catch {
      failed = true;
    } finally {
      loading = false;
    }
  }
  let tried = '';
  $effect(() => {
    if (trip.snowOff || !online || !reach || tried === trip.id) return;
    tried = trip.id;
    if (snowStale(trip)) load();
  });

  const day = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  const metres = (v) => (v == null ? '–' : `${num(v)} m`);
  const cm = (v) => (v == null ? '–' : `${num(v)} cm`);
</script>

{#if trip.snowOff}
  {#if !compact}<p class="sn-off"><button type="button" class="link" onclick={() => save({ snowOff: false })} data-snow-on>{t('Show freezing level and fresh snow')}</button></p>{/if}
{:else if compact}
  {#if shown}
    {@const d = shown.days[0]}
    <p class="sk-quiet sn-line num" data-snow-line><Snowflake size={16} aria-hidden="true" /><span>{t('Freezing level {m}', { m: metres(d.freezeM) })}{#if shown.fresh != null}{' · '}{t('Fresh snow {n} days: {cm}', { n: FRESH_DAYS, cm: cm(shown.fresh) })}{/if}{#if d.snowCm}{' · '}{t('{cm} on the day', { cm: cm(d.snowCm) })}{/if}</span></p>
  {:else if reach && loading}
    <p class="sk-quiet sn-line" data-snow-line><Snowflake size={16} aria-hidden="true" /><span>{t('Loading snow and freezing level…')}</span></p>
  {:else}
    <!-- «332 Use Cases» (Noah 26.10.2026 «nullgradgrenze und neuschnee» sichtbar): say where the values will come -->
    <p class="sk-quiet sn-line" data-snow-later><Snowflake size={16} aria-hidden="true" /><span>{t('Freezing level and fresh snow')}: {t('shows here in the days before the tour, when online')}</span></p>
  {/if}
{:else}
  <section class="sn" aria-labelledby="sn-h-{trip.id}" data-snow>
    <div class="sn-head">
      <span class="lbl" id="sn-h-{trip.id}"><ThermometerSnowflake size={16} aria-hidden="true" />{t('Snow and freezing level')}</span>
      <button type="button" class="link" onclick={() => save({ snowOff: true })} data-snow-off>{t('Hide')}</button>
    </div>
    {#if shown}
      <ul class="sn-days">
        {#each shown.days as d (d.date)}
          <li><span>{day(d.date)}</span><b class="num">{t('0° at {m}', { m: metres(d.freezeM) })}</b><span class="num sub">{d.freezeLowM != null && d.freezeLowM !== d.freezeM ? t('morning {m}', { m: metres(d.freezeLowM) }) : ''}</span><span class="num sub">{d.snowCm ? t('{cm} fresh snow', { cm: cm(d.snowCm) }) : t('no fresh snow')}</span></li>
        {/each}
      </ul>
      {#if shown.fresh != null}<p class="sn-fresh num" data-fresh>{t('Fresh snow in the {n} days before: {cm}', { n: shown.freshDays, cm: cm(shown.fresh) })}</p>{/if}
      <p class="hint">{t('Open-Meteo for {place}{height}, {age}. Numbers only: read the avalanche bulletin before every tour.', { place: shown.days.length ? (trip.snow.place?.name || trip.place?.name || '') : '', height: shown.elevation != null ? ` (${num(Math.round(shown.elevation))} m)` : '', age: ageText(shown.fetchedAt) })}
        <button type="button" class="link" disabled={loading || !online} onclick={load}><RefreshCw size={13} aria-hidden="true" />{loading ? t('Loading…') : t('Update')}</button></p>
    {:else if !trip.place}
      <p class="hint">{t('Set the start place under «Forecast»: then the freezing level and the fresh snow show here.')}</p>
    {:else if !trip.startDate}
      <p class="hint">{t('Set a start date for the trip to get its forecast.')}</p>
    {:else if !reach}
      <p class="hint">{t('Freezing level and fresh snow show from 16 days before the tour.')}</p>
    {:else}
      <p class="acts"><button type="button" class="btn sm" disabled={loading || !online} onclick={load}>{loading ? t('Loading…') : t('Get snow and freezing level')}</button>{#if !online}<span class="hint">{t('Needs the internet.')}</span>{/if}</p>
    {/if}
    {#if failed}<p class="hint" role="alert">{online ? t('The snow could not be loaded. Try again later.') : t('Offline: showing the last saved numbers.')}</p>{/if}
  </section>
{/if}

<style>
  .sn {
    display: grid;
    gap: 6px;
    width: 100%;
  }
  .sn-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  .sn-head .lbl {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sn-days {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sn-days li {
    display: grid;
    grid-template-columns: 64px auto 1fr auto;
    gap: 10px;
    padding: 3px 0;
    border-bottom: 1px solid var(--paper-2);
    font-size: var(--fs-small);
  }
  .sn-days .sub {
    color: var(--ink-3);
  }
  .sn-fresh,
  .hint,
  .acts,
  .sn-off {
    margin: 0;
  }
  .sn-fresh {
    font-size: var(--fs-small);
  }
  .hint {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    align-items: center;
  }
  .sn-line {
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-decoration: underline;
    cursor: pointer;
  }
  .link:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  @media (max-width: 520px) {
    .sn-days li {
      grid-template-columns: 56px 1fr auto;
    }
    .sn-days li > span.sub:nth-of-type(2) {
      display: none;
    }
  }
</style>
