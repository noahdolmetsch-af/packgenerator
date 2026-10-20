<script>
  /**
   * Paket G #9 «Seetemperatur Zürichsee als Verlauf» (Noah 19.10.2026, built without mockups): one
   * compact card. On top the measured water temperature of Lake Zurich (Stadt Zürich, Mythenquai) and
   * when it was measured, then a small line of the last 30 days (daily mean, inline SVG) and, dashed,
   * the preview of the next days, clearly a model calculation of Eawag (Alplakes). The swim hint is an
   * observation with a threshold the user can change. Offline it shows the last answer it saved.
   *
   * Thread «Seetemperatur und Sauna» (Noah 20.10.2026 «2a 3a 4a 5a»): the cold-water scale (pleasant,
   * fresh, cold, icy) instead of one threshold, «Sauna und See heute?» (SaunaSee.svelte) and the name
   * «Zürisee».
   *
   * Props: title (heading, default «Lake Zurich»), fetcher (for tests), auto (fetch on show, default
   * true), headingLevel (2 or 3), saunaSee (show «Sauna and lake today?», default true).
   */
  import { onMount } from 'svelte';
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { LAKE_CACHE_KEY, LAKE_SET_KEY, LAKE_NAME, SCALE_WORDS, lakeSetOf, saveLakeSet, loadLake, waterScale, isStale, trend, sparkline, WARM_MIN, WARM_MAX, COLD_MIN } from '../lake.js';
  import SaunaSee from './SaunaSee.svelte';
  import { localDay } from '../localday.js';
  import { t, locale } from '../i18n.svelte.js';
  import { Waves, RefreshCw } from '@lucide/svelte';

  let { title = '', fetcher = undefined, auto = true, headingLevel = 2, saunaSee = true } = $props();

  const q = liveQuery(async () => {
    const [c, s] = await Promise.all([db.meta.get(LAKE_CACHE_KEY), db.settings.get(LAKE_SET_KEY)]);
    return { cache: c?.value ?? null, set: lakeSetOf(s?.value) };
  });
  const st = $derived($q);
  let busy = $state(false);
  let failed = $state(false);
  let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  let now = $state(new Date());

  const data = $derived(st?.cache?.data ?? null);
  const set = $derived(st?.set ?? lakeSetOf());
  const warm = $derived(set.warm);
  const cur = $derived(data?.now ?? null);
  const tone = $derived(waterScale(cur?.water, set));
  const SCALE_LINE = {
    warm: 'Pleasant: from {warm} °C, by your scale.',
    fresh: 'Fresh: {cold} to {warm} °C, by your scale.',
    cold: 'Cold: {icy} to {cold} °C, by your scale.',
    icy: 'Icy: under {icy} °C, by your scale.',
  };
  const stale = $derived(cur ? isStale(cur.at, now) : false);
  const tr = $derived(trend(data?.days));
  const W = 300;
  const H = 64;
  const line = $derived(data ? sparkline(data.days, data.forecast, { w: W, h: H, warm }) : null);
  const ahead = $derived((data?.forecast ?? []).filter((d) => d.day > localDay(now)));
  const hid = `lake-${Math.random().toString(36).slice(2, 8)}`;

  const one = (n) => Number(n).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const whenOf = (iso) => {
    const d = new Date(iso);
    const time = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    return localDay(d) === localDay(now) ? t('today {time}', { time }) : `${d.toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}, ${time}`;
  };
  const dayName = (day) => new Date(`${day}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' });

  async function refresh(force = false) {
    if (busy) return;
    busy = true;
    try {
      const r = await loadLake(db, { ...(fetcher ? { fetcher } : {}), force });
      failed = !!r?.error;
    } finally {
      busy = false;
      now = new Date();
    }
  }

  function setLimit(key, e) {
    const v = Number(e.currentTarget.value);
    if (Number.isFinite(v)) saveLakeSet(db, { [key]: v });
  }

  onMount(() => {
    const on = () => {
      online = true;
      if (auto) refresh();
    };
    const off = () => (online = false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    if (auto) refresh();
    const tick = setInterval(() => (now = new Date()), 60000);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      clearInterval(tick);
    };
  });
</script>

<section class="card lake" aria-labelledby={hid} data-card="lake">
  <div class="lk-head">
    <span class="lk-ib" aria-hidden="true"><Waves size={18} /></span>
    <svelte:element this={headingLevel === 3 ? 'h3' : 'h2'} id={hid} class="lk-title">{title || t(LAKE_NAME)}</svelte:element>
    <button class="lk-re" type="button" onclick={() => refresh(true)} disabled={busy || !online} aria-label={t('Load again')} title={t('Load again')}>
      <RefreshCw size={16} aria-hidden="true" class={busy ? 'spin' : ''} />
    </button>
  </div>

  {#if !st || (busy && !data)}
    <p class="lk-quiet" aria-live="polite">{t('Loading the water temperature …')}</p>
  {:else if !data}
    <p class="lk-quiet" aria-live="polite">
      {online ? t('The water temperature could not be loaded right now. Try again later.') : t('Offline. The water temperature shows up once you are online.')}
    </p>
  {:else}
    {#if cur}
      <div class="lk-now">
        <span class="lk-big num">{one(cur.water)} °C</span>
        <span class="lk-sub">
          {t('Water, measured {when}', { when: whenOf(cur.at) })}{#if stale}<span class="lk-old"> · {t('older value')}</span>{/if}
          {#if cur.air != null}<br />{t('Air {v} °C', { v: one(cur.air) })}{/if}
        </span>
      </div>
      <p class="lk-hint {tone}" data-tone={tone}>
        {t(SCALE_LINE[tone], { warm: one(set.warm), cold: one(set.cold), icy: one(set.icy) })}
        {#if tr != null && tr !== 0}<span class="lk-tr"> {tr > 0 ? t('{n} °C warmer than a week ago.', { n: one(tr) }) : t('{n} °C colder than a week ago.', { n: one(-tr) })}</span>{/if}
      </p>
    {:else}
      <p class="lk-quiet">{t('No measurement right now; only the preview is there.')}</p>
    {/if}

    {#if saunaSee && set.saunaSee}<SaunaSee {cur} {set} today={localDay(now)} />{/if}

    {#if line}
      <figure class="lk-fig">
        <svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" role="img" aria-label={t('Water temperature of the last {n} days, from {lo} to {hi} °C', { n: data.days.length, lo: one(line.lo), hi: one(line.hi) })}>
          {#if line.warmY != null}<line class="lk-warm" x1="0" x2={W} y1={line.warmY} y2={line.warmY} />{/if}
          <path class="lk-past" d={line.past} />
          {#if line.ahead}<path class="lk-ahead" d={line.ahead} />{/if}
        </svg>
        <figcaption class="lk-axis num">
          <span>{t('{n} days', { n: data.days.length })}</span>
          <span>{one(line.lo)}–{one(line.hi)} °C</span>
          {#if line.ahead}<span class="lk-key"><i aria-hidden="true"></i>{t('preview')}</span>{/if}
        </figcaption>
      </figure>
    {/if}

    {#if ahead.length}
      <div class="lk-pre">
        <p class="lk-pre-h">{t('Preview (Eawag calculation)')}</p>
        <ul class="lk-days">
          {#each ahead as d (d.day)}
            <li><span>{dayName(d.day)}</span><b class="num">{one(d.water)} °C</b></li>
          {/each}
        </ul>
        <p class="lk-quiet small">{t('A model calculation, not a measurement. It can be off by a degree or more.')}</p>
      </div>
    {/if}

    {#if failed || !online}
      <p class="lk-quiet small" aria-live="polite">
        {!online ? t('Offline: last values from {when}.', { when: whenOf(st.cache.fetchedAt) }) : t('Could not refresh; last values from {when}.', { when: whenOf(st.cache.fetchedAt) })}
      </p>
    {/if}
  {/if}

  <details class="lk-set">
    <summary>{t('Cold-water scale')}</summary>
    <label class="lk-row">
      <span>{t('Pleasant from')}</span>
      <input type="number" inputmode="decimal" min={WARM_MIN} max={WARM_MAX} step="0.5" value={set.warm} onchange={(e) => setLimit('warm', e)} aria-describedby="{hid}-ex" data-limit="warm" />
      <span>°C</span>
    </label>
    <label class="lk-row">
      <span>{t('Cold under')}</span>
      <input type="number" inputmode="decimal" min={COLD_MIN} max={WARM_MAX} step="0.5" value={set.cold} onchange={(e) => setLimit('cold', e)} aria-describedby="{hid}-ex" data-limit="cold" />
      <span>°C</span>
    </label>
    <label class="lk-row">
      <span>{t('Icy under')}</span>
      <input type="number" inputmode="decimal" min={COLD_MIN} max={WARM_MAX} step="0.5" value={set.icy} onchange={(e) => setLimit('icy', e)} aria-describedby="{hid}-ex" data-limit="icy" />
      <span>°C</span>
    </label>
    <p id="{hid}-ex" class="lk-quiet small">{t('In between it is fresh. Only an observation for you, not advice. Change the numbers to what fits you.')}</p>
    {#if saunaSee}
      <label class="lk-row lk-check">
        <input type="checkbox" checked={set.saunaSee} onchange={(e) => saveLakeSet(db, { saunaSee: e.currentTarget.checked })} data-sauna-see-toggle />
        <span>{t('Show «Sauna and lake today?»')}</span>
      </label>
    {/if}
  </details>

  <p class="lk-src">{t('Measurement: City of Zurich, Mythenquai · Preview: Eawag Alplakes')}</p>
</section>

<style>
  .lake { padding: var(--sp-4); display: grid; gap: var(--sp-3); }
  .lk-head { display: flex; align-items: center; gap: var(--sp-2); }
  .lk-ib { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: var(--radius); background: var(--info-soft); color: var(--ink); flex: none; }
  .lk-title { margin: 0; font-size: var(--fs-sub); flex: 1; }
  .lk-re { min-width: 44px; min-height: 44px; border: 0; background: none; color: var(--ink-2); border-radius: var(--r-ctl); cursor: pointer; }
  .lk-re:disabled { opacity: 0.5; cursor: default; }
  .lk-re:focus-visible { outline: var(--focus-ring); }
  .lk-re :global(.spin) { animation: lk-spin 1s linear infinite; }
  @keyframes lk-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .lk-re :global(.spin) { animation: none; } }
  .lk-now { display: flex; align-items: baseline; gap: var(--sp-3); flex-wrap: wrap; }
  .lk-big { font-size: var(--fs-title); font-weight: 700; color: var(--ink); line-height: var(--lh-title); }
  .lk-sub { color: var(--ink-2); font-size: var(--fs-small); }
  .lk-old { color: var(--warn); }
  .lk-hint { margin: 0; font-size: var(--fs-small); padding: var(--sp-2) var(--sp-3); border-radius: var(--radius); background: var(--paper-2); color: var(--ink-2); }
  .lk-hint.warm { background: var(--ok-soft); color: var(--ok); }
  .lk-hint.fresh, .lk-hint.cold { background: var(--info-soft); color: var(--ink-2); }
  .lk-hint.icy { background: var(--info-soft); color: var(--ink); font-weight: 600; }
  .lk-fig { margin: 0; }
  .lk-fig svg { display: block; width: 100%; height: 64px; }
  .lk-past, .lk-ahead { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
  .lk-past { stroke: var(--accent); }
  .lk-ahead { stroke: var(--ink-3); stroke-dasharray: 4 3; }
  .lk-warm { stroke: var(--line); stroke-width: 1; stroke-dasharray: 2 3; vector-effect: non-scaling-stroke; }
  .lk-axis { display: flex; gap: var(--sp-3); justify-content: space-between; color: var(--ink-3); font-size: var(--fs-tiny); margin-top: var(--sp-1); }
  .lk-key { display: inline-flex; align-items: center; gap: var(--sp-1); }
  .lk-key i { display: inline-block; width: 14px; border-top: 2px dashed var(--ink-3); }
  .lk-pre { display: grid; gap: var(--sp-2); }
  .lk-pre-h { margin: 0; font-size: var(--fs-label); font-weight: 600; color: var(--ink-2); }
  .lk-days { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .lk-days li { display: grid; gap: 2px; padding: var(--sp-2) var(--sp-3); border: 1px dashed var(--line); border-radius: var(--radius); font-size: var(--fs-small); color: var(--ink-2); min-width: 64px; }
  .lk-days b { color: var(--ink); }
  .lk-quiet { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .lk-quiet.small { font-size: var(--fs-tiny); color: var(--ink-3); }
  .lk-set summary { cursor: pointer; color: var(--ink-2); font-size: var(--fs-small); min-height: 44px; display: flex; align-items: center; }
  .lk-set summary:focus-visible { outline: var(--focus-ring); }
  .lk-row { display: flex; align-items: center; gap: var(--sp-2); font-size: var(--fs-small); margin-bottom: var(--sp-2); }
  .lk-row input { width: 5.5em; min-height: 44px; padding: 0 var(--sp-2); border: 1px solid var(--line-strong); border-radius: var(--r-ctl); background: var(--input); color: var(--ink); font: inherit; }
  .lk-check input { width: 22px; height: 22px; min-height: 0; }
  .lk-src { margin: 0; font-size: var(--fs-tiny); color: var(--ink-3); }
</style>
