<script>
  /**
   * «Nachttemperatur» on the weather page (Noah 06.11.2026 «1a und c 2a 3a 4a 5a»): the card «Night» under «Today» (part
   * «Jetzt»). The lowest temperature of the night that just ended («Heute früh») and of the coming night («Morgen früh»)
   * at the place the page shows, the change against yesterday and against a week ago, the trend and «5 Plus in X Tagen»,
   * and 14 bars (7 nights back, today, 6 ahead). A calm hint appears only when it is worth a word. The value is the
   * weather model's, not a thermometer, and the card says so. wetter-seite mounts it with one line.
   */
  import { Moon, TrendingDown, TrendingUp, Snowflake, Sun } from '@lucide/svelte';
  import { db } from '../db.js';
  import { REFRESHED } from '../home/refresh.js';
  import { liveQuery } from 'dexie';
  import { loadNacht, summary, PLUS_C, HOME_KEY } from './nacht.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { core, now = Date.now() } = $props();
  const homeQ = liveQuery(() => db.settings.get(HOME_KEY));
  const onHome = $derived($homeQ?.value !== false);
  const toggleHome = (e) => db.settings.put({ key: HOME_KEY, value: e.currentTarget.checked });

  const place = $derived(core?.place && Number.isFinite(Number(core.place.lat)) ? { lat: Number(core.place.lat), lon: Number(core.place.lon), name: core.place.name ?? '' } : null);
  let data = $state(null);
  let asked = $state(false);
  let key = '';
  const read = (pl, k, force = false) =>
    loadNacht(db, pl, { force })
      .then((d) => {
        if (k == null || k === key) {
          data = d;
          asked = true;
        }
      })
      .catch(() => (asked = true));
  $effect(() => {
    const k = place ? `${place.lat},${place.lon}` : '';
    if (k === key) return;
    key = k;
    data = null;
    asked = false;
    if (place) read(place, k);
  });
  $effect(() => {
    const again = () => place && read(place, null, true);
    globalThis.addEventListener(REFRESHED, again);
    return () => globalThis.removeEventListener(REFRESHED, again);
  });

  const s = $derived(data ? summary(data, now) : null);
  const at = $derived(data?.old && data.at ? new Date(data.at).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '');
  const wd = (date) => new Date(`${date}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', weekday: 'short' });

  // the bars: one scale for all of them, the lowest night as a short stub
  const bars = $derived.by(() => {
    const v = (s?.bars ?? []).filter((b) => b.deg != null).map((b) => b.deg);
    if (!v.length) return [];
    const lo = Math.min(...v);
    const hi = Math.max(...v);
    return s.bars.map((b) => ({ ...b, h: b.deg == null ? 0 : 10 + (hi === lo ? 30 : ((b.deg - lo) / (hi - lo)) * 60) }));
  });

  // every text is spelled out once, so the German list and its test can find it
  const vsDay = (d) => (d > 0 ? t('{d}° warmer than yesterday morning', { d: num(d) }) : t('{d}° colder than yesterday morning', { d: num(-d) }));
  const vsWeek = (d) => (d > 0 ? t('{d}° warmer than a week ago', { d: num(d) }) : t('{d}° colder than a week ago', { d: num(-d) }));
  const plusText = (n) => (n === 1 ? t('Back to 5 °C or more tomorrow morning') : t('Back to 5 °C or more in {n} days', { n: num(n) }));
  const frostText = (f) =>
    f.ends
      ? f.days === 1 ? t('Frost-free tomorrow morning') : t('Frost-free in {n} days', { n: num(f.days) })
      : f.days === 1 ? t('Frost tomorrow morning (under 0 °C)') : t('Frost in {n} days (under 0 °C)', { n: num(f.days) });
  const unsure = $derived(Boolean(s?.plus?.unsure || s?.frost?.unsure));
</script>

{#if place && (s || asked)}
  <section class="card nt" aria-labelledby="nt-h" data-nacht>
    <h2 id="nt-h" class="wx-h"><Moon size={18} aria-hidden="true" />{t('Night temperature')}</h2>
    <p class="nt-where" data-nacht-where>{place.name ? `${place.name} · ` : ''}{t('Lowest value 18 to 8 h')}</p>
    {#if s}
      <div class="nt-two">
        <div class="nt-tile" data-nacht-last>
          <small>{t('This morning')}</small>
          <b>{s.last != null ? num(s.last) : '–'}<i>°C</i></b>
          <em>{t('last night')}</em>
        </div>
        <div class="nt-tile" data-nacht-next>
          <small>{t('Tomorrow morning')}</small>
          <b>{s.next != null ? num(s.next) : '–'}<i>°C</i></b>
          <em>{t('next night (forecast)')}</em>
        </div>
      </div>

      {#if s.vsYesterday != null}<p class="nt-row" data-nacht-vs-yesterday>{#if s.vsYesterday > 0}<TrendingUp size={16} aria-hidden="true" />{:else}<TrendingDown size={16} aria-hidden="true" />{/if}{vsDay(s.vsYesterday)} ({num(s.yesterday)} °C)</p>{/if}
      {#if s.vsWeek != null}<p class="nt-row" data-nacht-vs-week>{#if s.vsWeek > 0}<TrendingUp size={16} aria-hidden="true" />{:else}<TrendingDown size={16} aria-hidden="true" />{/if}{vsWeek(s.vsWeek)} ({num(s.week)} °C)</p>{/if}
      {#if s.nextVsLast != null}<p class="nt-row" data-nacht-next-vs>{#if s.nextVsLast > 0}<TrendingUp size={16} aria-hidden="true" />{:else}<TrendingDown size={16} aria-hidden="true" />{/if}{s.nextVsLast > 0 ? t('Tomorrow morning {d}° warmer than this morning', { d: num(s.nextVsLast) }) : t('Tomorrow morning {d}° colder than this morning', { d: num(-s.nextVsLast) })}</p>{/if}

      {#if bars.length}
        <ul class="nt-bars" aria-label={t('Night temperature, 7 nights back and 6 ahead')} data-nacht-bars>
          {#each bars as b (b.date)}
            <li class:today={b.k === 0}>
              <b>{b.deg != null ? num(b.deg) : '–'}</b>
              <i class:cold={b.deg != null && b.deg < PLUS_C} class:none={b.deg == null} style="height:{b.h}px"></i>
              <span>{wd(b.date)}</span>
            </li>
          {/each}
        </ul>
        <p class="nt-legend"><span class="cold">{t('under 5 °C')}</span><span class="warm">{t('5 °C and more')}</span><span class="frame">{t('Frame: this morning')}</span></p>
      {/if}

      {#if s.trend || s.plus || s.frost}
        <div class="nt-trend" data-nacht-trend>
          {#if s.trend}<p data-nacht-trend-word>{#if s.trend === 'falling'}<TrendingDown size={16} aria-hidden="true" />{t('Forecast: falling')}{:else}<TrendingUp size={16} aria-hidden="true" />{t('Forecast: rising')}{/if}</p>{/if}
          {#if s.plus}<p data-nacht-plus><Sun size={16} aria-hidden="true" />{plusText(s.plus.days)}</p>{/if}
          {#if s.frost}<p data-nacht-frost><Snowflake size={16} aria-hidden="true" />{frostText(s.frost)}</p>{/if}
          {#if unsure}<small>{t('After 5 days a forecast is unsure.')}</small>{/if}
        </div>
      {/if}
      <p class="nt-src" data-nacht-src>{t('A model value for the place, not a thermometer on the spot. In valleys and at lakes it can be 1 to 3 degrees off.')}{#if at}{' '}{t('As of {at}', { at })}{/if}</p>
      <details class="nt-set" data-nacht-set>
        <summary>{t('Set night line')}</summary>
        <label class="nt-check"><input type="checkbox" checked={onHome} onchange={toggleHome} data-nacht-home />{t('Show the night temperature on Today')}</label>
      </details>
    {:else}
      <p class="rc-note" data-nacht-empty>{t('No night values yet. They come as soon as the weather service answers; try again online.')}</p>
    {/if}
  </section>
{/if}

<style>
  .nt {
    padding: 12px;
    display: grid;
    gap: 8px;
  }
  .nt-where {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nt-two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .nt-tile {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .nt-tile small {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .nt-tile b {
    font-size: var(--fs-num);
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .nt-tile i {
    font-style: normal;
    font-size: var(--fs-body);
    margin-left: 4px;
    color: var(--ink-2);
  }
  .nt-tile em {
    font-style: normal;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nt-row,
  .nt-trend p {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-small);
  }
  .nt-trend {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--info-soft);
  }
  .nt-trend small,
  .nt-src,
  .nt-legend {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nt-bars {
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 112px;
  }
  .nt-bars li {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 3px;
    height: 100%;
    font-size: var(--fs-tiny);
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .nt-bars li b {
    font-weight: 600;
    color: var(--ink);
  }
  .nt-bars i {
    display: block;
    width: 100%;
    border-radius: 4px 4px 2px 2px;
    background: var(--accent);
  }
  .nt-bars i.cold {
    background: var(--l3);
  }
  .nt-bars i.none {
    background: var(--line);
    height: 4px !important;
  }
  .nt-bars li.today i {
    outline: 2px solid var(--ink);
    outline-offset: 1px;
  }
  .nt-set summary {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nt-set > * {
    margin-top: 8px;
  }
  .nt-check {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .nt-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: var(--fs-tiny);
  }
  .nt-legend span::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
    margin-right: 5px;
    background: var(--accent);
  }
  .nt-legend .cold::before {
    background: var(--l3);
  }
  .nt-legend .frame::before {
    background: var(--paper);
    outline: 2px solid var(--ink);
    outline-offset: -2px;
  }
</style>
