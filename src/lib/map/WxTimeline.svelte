<script>
  /**
   * Paket U «Wetter entlang der Strecke als Zeitleiste» (Noah 19.10.2026): a compact strip, one cell per
   * point about every 25 km, each with the hour you are expected there (plan or pace), the rain chance and
   * amount, the temperature and the wind as you feel it (headwind, tailwind, crosswind) in the riding
   * direction at that point. «As of HH:MM» and «Refresh»; offline the kept answer is shown with its time.
   * The sums are in wxline.js (tested). Network only on a tap, or once when `auto` is set.
   *
   * Props: route ({ line, km, profile }, a trip or race route), plan (schedule/simPlan with etaOf) or
   * pace (km/h or { kmh }) with startAt (ms or 'YYYY-MM-DDTHH:MM', default now), fromKm (where you are:
   * the strip starts there), tripId (cache key; '' = the live map), auto (load once when nothing fits or
   * it is older than 3 h). Key the component on tripId: the cache key is read once.
   */
  import { untrack } from 'svelte';
  import { CloudSun, RefreshCw, ArrowUp } from '@lucide/svelte';
  import { cacheGet, cacheSet, cacheQuery } from '../race/store.js';
  import { lineKm, hhmm, dayOfMs } from '../race/race.js';
  import { isOld } from './wx.js';
  import { linePoints, fetchWxLine, timelineRows, lineSummary, etaFn, routeKey, cacheFits, wxLineKey, WIND_KIND } from './wxline.js';
  import { t, num, locale } from '../i18n.svelte.js';

  let { route = null, plan = null, pace = null, startAt = null, fromKm = 0, tripId = '', auto = false } = $props();

  const key = untrack(() => wxLineKey(tripId));
  const q = cacheQuery(key);

  const pts = $derived(lineKm(route));
  const entry = $derived($q ?? null);
  const cache = $derived(cacheFits(entry?.data, pts) ? entry.data : null);
  const asOf = $derived(cache ? entry.at : '');

  let now = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => (now = Date.now()), 60_000);
    return () => clearInterval(timer);
  });

  const eta = $derived(etaFn({ plan, pace, startAt, fromKm: Number(fromKm) || 0, profile: route?.profile ?? [], totalKm: Number(route?.km) || 0, now }));
  const rows = $derived(cache ? timelineRows(cache, { eta, fromKm: Number(fromKm) || 0, now }) : []);
  const sum = $derived(lineSummary(rows));
  const inForecast = $derived(rows.some((r) => r.w));

  /* ---------- load, only on a tap (or once with auto) ---------- */
  let busy = $state(false);
  let msg = $state('');
  const offline = () => typeof navigator !== 'undefined' && navigator.onLine === false;
  async function load() {
    if (busy || pts.length < 2) return;
    msg = '';
    if (offline()) {
      msg = cache ? t('You are offline. This is the weather of {at}.', { at: stamp(asOf) }) : t('You are offline. Try again with internet.');
      return;
    }
    busy = true;
    try {
      const points = linePoints(pts);
      const series = await fetchWxLine(points);
      await cacheSet(key, { key: routeKey(pts), points, series });
    } catch (err) {
      console.error(err);
      msg = err?.message === 'busy' ? t('The free service is busy. Try again in a minute.') : t('Could not load. Try again later.');
    } finally {
      busy = false;
    }
  }
  // auto: once, when nothing kept fits this route or it is older than 3 h (the live store says
  // undefined both while it loads and when nothing is kept, so ask the store once instead)
  let tried = false;
  $effect(() => {
    if (!auto || tried || pts.length < 2) return;
    tried = true;
    untrack(async () => {
      const e = await cacheGet(key);
      if ((!cacheFits(e?.data, pts) || isOld(e?.at, 3)) && !offline()) load();
    });
  });

  /* ---------- formatting ---------- */
  const stamp = (iso) => {
    if (!iso) return '';
    const ms = Date.parse(iso);
    return dayOfMs(ms) === dayOfMs(now) ? hhmm(ms) : new Date(ms).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };
  const when = (ms) => (dayOfMs(ms) === dayOfMs(now) ? hhmm(ms) : `${new Date(ms).toLocaleDateString(locale(), { weekday: 'short' })} ${hhmm(ms)}`);
  const deg = (v) => (Number.isFinite(v) ? `${Math.round(v)}°` : '–');
  const mm = (v) => (Number.isFinite(v) && v >= 0.1 ? `${num(Math.round(v * 10) / 10)} mm` : '');
  // the arrow: where the wind blows, seen in your riding direction (up = it pushes you, down = against you)
  const turn = (r) => (Number.isFinite(r.dir) && Number.isFinite(r.deg) ? (r.dir + 180 - r.deg + 360) % 360 : null);
  const kindName = (k) => (WIND_KIND[k] ? t(WIND_KIND[k]) : '');
  const line = $derived.by(() => {
    if (!inForecast) return '';
    const parts = [];
    parts.push(sum.rain ? t('Rain from km {km} ({at})', { km: num(Math.round(sum.rain.km)), at: when(sum.rain.eta) }) : t('No rain expected'));
    if (sum.head) parts.push(t('Headwind up to {kmh} km/h at km {km}', { kmh: Math.round(sum.head.head), km: num(Math.round(sum.head.km)) }));
    if (sum.low != null) parts.push(sum.low === sum.high ? `${Math.round(sum.low)} °C` : `${Math.round(sum.low)}–${Math.round(sum.high)} °C`);
    return parts.join(' · ');
  });
</script>

{#if pts.length > 1}
  <section class="wt" aria-labelledby="wt-h" data-wx-timeline>
    <div class="wt-hd">
      <h3 id="wt-h"><CloudSun size={18} aria-hidden="true" />{t('Weather along the route')}</h3>
      <button type="button" class="btn sm" onclick={load} disabled={busy} data-wx-timeline-load>
        <RefreshCw size={16} aria-hidden="true" />{busy ? t('Loading…') : cache ? t('Refresh') : t('Load weather')}
      </button>
    </div>

    {#if cache}
      <p class="wt-meta num">
        {t('As of {at}', { at: stamp(asOf) })}{#if isOld(asOf, 3)}{' '}· <span class="wt-old">{t('Older than 3 hours')}</span>{/if}
        · {eta ? (plan ? t('For the hour of your plan at each point.') : t('For the hour you get there at your pace.')) : t('No plan: the weather of now at each point.')}
      </p>
      {#if line}<p class="wt-sum">{line}</p>{/if}
      {#if inForecast}
        <ol class="wt-strip" aria-label={t('Weather along the route')}>
          {#each rows as r (r.km)}
            <li class="wt-cell" class:wt-wet={r.w && r.rain}>
              <span class="wt-time num">{when(r.eta)}</span>
              <span class="wt-km num">{t('km {km}', { km: num(Math.round(r.km)) })}</span>
              {#if r.w}
                <span class="wt-temp num">{deg(r.temp)}</span>
                <span class="wt-rain" aria-label={t('Rain chance {p} %', { p: r.rainP ?? '–' })}>
                  <span class="wt-bar"><span class="wt-fill" style:height="{Math.max(2, Math.min(100, r.rainP ?? 0))}%"></span></span>
                  <span class="num">{r.rainP ?? '–'} %</span>
                </span>
                {#if mm(r.rainMm)}<span class="wt-mm num">{mm(r.rainMm)}</span>{/if}
                <span class="wt-wind wt-{r.kind}">
                  {#if turn(r) != null && r.kind !== 'calm'}<span class="wt-arrow" style:transform="rotate({turn(r)}deg)"><ArrowUp size={16} aria-hidden="true" /></span>{/if}
                  <span class="num">{r.wind != null ? `${Math.round(r.wind)} km/h` : '–'}</span>
                </span>
                <span class="wt-kind">{kindName(r.kind)}</span>
              {:else}
                <span class="wt-out">{t('Not in the forecast yet')}</span>
              {/if}
            </li>
          {/each}
        </ol>
        <p class="wt-help">{t('The arrow shows where the wind blows as you ride: up pushes you, down is against you. Swipe the strip for more points.')}</p>
      {:else}
        <p class="wt-help">{t('The forecast reaches about 16 days ahead. Load again closer to the start.')}</p>
      {/if}
    {:else}
      <p class="wt-help">{t('About every 25 km: rain, temperature and wind for the hour you are there, with headwind or tailwind. Loads once from Open-Meteo (free) and stays on this device.')}</p>
    {/if}
    {#if msg}<p class="wt-msg" role="status">{msg}</p>{/if}
  </section>
{/if}

<style>
  .wt {
    display: grid;
    gap: var(--sp-2);
    min-width: 0;
  }
  .wt-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    flex-wrap: wrap;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .wt-meta,
  .wt-help,
  .wt-msg {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .wt-old {
    color: var(--warn);
  }
  .wt-sum {
    margin: 0;
    color: var(--ink);
    font: 500 var(--fs-body) / 1.4 var(--font-body);
    overflow-wrap: break-word;
  }
  .wt-strip {
    display: flex;
    gap: var(--sp-2);
    margin: 0;
    padding: 0 0 var(--sp-1);
    list-style: none;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    max-width: 100%;
  }
  .wt-cell {
    flex: none;
    display: grid;
    justify-items: center;
    align-content: start;
    gap: 2px;
    width: 76px;
    padding: var(--sp-2) var(--sp-1);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper);
    scroll-snap-align: start;
    text-align: center;
  }
  .wt-cell.wt-wet {
    background: var(--info-soft);
  }
  .wt-time {
    font: 600 var(--fs-small) / 1.2 var(--font-body);
    color: var(--ink);
  }
  .wt-km,
  .wt-mm,
  .wt-kind,
  .wt-out {
    font-size: var(--fs-tiny);
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .wt-temp {
    font: 600 var(--fs-body) / 1.2 var(--font-body);
    color: var(--ink);
  }
  .wt-rain {
    display: flex;
    align-items: flex-end;
    gap: var(--sp-1);
    font-size: var(--fs-tiny);
    color: var(--ink-2);
  }
  .wt-bar {
    display: flex;
    align-items: flex-end;
    width: 8px;
    height: 24px;
    border-radius: 2px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .wt-fill {
    display: block;
    width: 100%;
    background: var(--l3);
  }
  .wt-wind {
    display: flex;
    align-items: center;
    gap: 2px;
    font: 500 var(--fs-tiny) / 1.2 var(--font-body);
    color: var(--ink);
  }
  .wt-arrow {
    display: inline-flex;
  }
  .wt-head,
  .wt-head + .wt-kind {
    color: var(--warn);
  }
  .wt-tail,
  .wt-tail + .wt-kind {
    color: var(--ok);
  }
  .wt-msg {
    color: var(--ink);
  }
</style>
