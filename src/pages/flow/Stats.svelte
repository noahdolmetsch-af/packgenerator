<script>
  /**
   * Garmin-Übersicht (Noah 20.10.2026, screenshots 4 and 5): the pages behind «Im Fokus» and «Überblick».
   * #/flow/stats/<sport>  all of one sport: 7 days / 4 weeks / 1 year, back in time with ‹, the tabs
   *                       distance, time, climbing, calories, one bar per day (per month for a year), the
   *                       total and the daily mean, the activities of the range;
   * #/flow/stats/hr       the heart rate: resting pulse and highest pulse per day, their means, one row
   *                       per day. Garmin's «1 T» (the pulse over one day) is missing: the app gets
   *                       only day values from Fitbit.
   * Loaded only when opened (Flow.svelte).
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import Crumb from '../../lib/flow/kit/Crumb.svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import { tableQuery } from '../../lib/messwerte-data.js';
  import { stats, hrStats, STAT_KEYS, KIND_ORDER } from '../../lib/uebersicht.js';
  import { SPORT_ICON, sportName, hms, km2, dm, rangeText, monthShort } from '../../lib/flow/garmin/words.js';
  import { localDay } from '../../lib/localday.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { id = 'bike' } = $props();
  const kind = $derived(id === 'hr' ? null : KIND_ORDER.includes(id) ? id : 'other');
  const today = localDay();
  const q = tableQuery();
  const table = $derived($q ?? new Map());
  let range = $state('d7');
  let back = $state(0);
  let key = $state('km');
  const RANGE_NAMES = { d7: '7 d.|range', w4: '4 wk.|range', y1: '1 y|range' };
  const TAB = { km: 'Distance', time: 'Time|stat', hm: 'Climbing', kcal: 'Calories' };
  const TOTAL = { km: 'Total distance', time: 'Total time', hm: 'Total climbing', kcal: 'Total calories' };
  const st = $derived(kind ? stats(table, today, kind, key, range, back) : null);
  const hr = $derived(kind ? null : hrStats(table, today, range, back));
  const span = $derived(st ?? hr);
  const fmtV = (k, v) => (k === 'time' ? hms(v) : k === 'km' ? km2(v) : num(Math.round(v)));
  const unit = (k) => (k === 'km' ? 'km' : k === 'hm' ? 'm' : k === 'kcal' ? 'kcal' : '');
  // the axis: four round steps up to the highest bar
  const axis = (max) => {
    const raw = Math.max(1, max) / 4;
    const p = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 4, 5, 10].map((m) => m * p).find((m) => m >= raw);
    return [0, 1, 2, 3, 4].map((i) => i * step);
  };
  const ticks = $derived(st ? (key === 'time' ? axis(Math.max(...st.bars.map((b) => b.v)) / 3600).map((h) => h * 3600) : axis(Math.max(...st.bars.map((b) => b.v)))) : hr ? axis(Math.max(60, ...hr.points.map((p) => p.high ?? p.rest ?? 0))) : [0]);
  const topV = $derived(ticks.at(-1) || 1);
  const label = (k) => (range === 'y1' ? monthShort(k) : dm(k));
  const tickLabel = (k) => (key === 'time' && st ? `${num(Math.round((k / 3600) * 10) / 10)} h` : num(k));
  const day = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { weekday: 'long', timeZone: 'UTC' });
  const date = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const setRange = (r) => ((range = r), (back = 0));
  const hrY = (v) => 100 - (v / topV) * 100;
  const hrLine = (k) => {
    let out = '';
    hr?.points.forEach((p, i) => {
      if (p[k] == null) return;
      const x = hr.points.length > 1 ? (i / (hr.points.length - 1)) * 100 : 50;
      out += `${out ? 'L' : 'M'}${x.toFixed(1)} ${hrY(p[k]).toFixed(1)}`;
    });
    return out;
  };
  const title = $derived(kind ? sportName(kind) : t('Heart rate'));
</script>

<div class="gs" data-stats={id}>
  <header class="hd">
    <Crumb path={[{ href: '#/flow', label: t('Active|place') }]} here={title} />
    <h1 class="ptitle" tabindex="-1" data-page-title>{#if kind}{@const I = SPORT_ICON[kind]}<I size={24} aria-hidden="true" />{/if}{title}</h1>
  </header>

  <div data-ranges><Seg options={Object.keys(RANGE_NAMES).map((r) => ({ key: r, name: t(RANGE_NAMES[r]) }))} value={range} onchange={setRange} label={t('Range')} /></div>
  {#if span}
    <div class="per">
      <button type="button" class="nav" aria-label={t('Earlier')} data-back onclick={() => back++}><ChevronLeft size={20} aria-hidden="true" /></button>
      <b class="num" data-span>{range === 'y1' ? `${monthShort(span.from)} ${span.from.slice(0, 4)}–${monthShort(span.to)} ${span.to.slice(0, 4)}` : rangeText(span.from, span.to)}</b>
      <button type="button" class="nav" aria-label={t('Later')} disabled={back === 0} onclick={() => (back = Math.max(0, back - 1))}><ChevronRight size={20} aria-hidden="true" /></button>
    </div>
  {/if}

  {#if st}
    <div class="tabs" role="tablist">
      {#each STAT_KEYS as k (k)}<button type="button" role="tab" aria-selected={key === k} data-tab={k} onclick={() => (key = k)}>{t(TAB[k])}</button>{/each}
    </div>
    <section class="card ch" aria-label={t(TOTAL[key])}>
      <h2>{t(TOTAL[key])}</h2>
      <div class="plot">
        <div class="yl">{#each [...ticks].reverse() as k (k)}<span class="num">{tickLabel(k)}</span>{/each}</div>
        <div class="area" style="--n:{st.bars.length}">
          {#each ticks as k (k)}<i class="gl" style="bottom:{(k / topV) * 100}%"></i>{/each}
          {#each st.bars as b (b.key)}
            <span class="bc" title="{label(b.key)}: {fmtV(key, b.v)} {unit(key)}"><i style="height:{b.v ? Math.max(1.5, (b.v / topV) * 100) : 0}%"></i></span>
          {/each}
        </div>
      </div>
      <div class="xl"><span>{label(st.bars[0].key)}</span><span>{label(st.bars.at(-1).key)}</span></div>
      <div class="tot">
        <span><b class="num" data-total>{fmtV(key, st.total)}{#if unit(key)}{' '}<small>{unit(key)}</small>{/if}</b><small>{t(TOTAL[key])}</small></span>
        <span><b class="num">{fmtV(key, st.perDay)}{#if unit(key)}{' '}<small>{unit(key)}</small>{/if}</b><small>{t('Daily average')}</small></span>
      </div>
      {#if key === 'kcal' && !st.total}<p class="q">{t('Calories come with the details of an activity from Strava.')}</p>{/if}
    </section>
    <section aria-labelledby="gs-acts">
      <h2 id="gs-acts" class="cap">{t('Activities of type «{sport}»', { sport: title })}</h2>
      {#if st.acts.length}
        <ul class="card list">
          {#each st.acts as a (a.id)}
            <li><a href="#/flow/training/a/{encodeURIComponent(a.id)}" data-stat-act={a.id}><span class="m"><b>{a.name || title}</b><small>{date(a.day)}{a.time ? ` · ${a.time}` : ''}</small></span><span class="v num">{a.km ? `${km2(a.km)} km` : ''}<small>{hms(a.movingS)}</small></span></a></li>
          {/each}
        </ul>
      {:else}
        <p class="q">{t('No activity in this range.')}</p>
      {/if}
    </section>
  {:else if hr}
    <section class="card ch" aria-label={t('Daily values')}>
      <h2>{t('Daily values')}</h2>
      <div class="plot">
        <div class="yl">{#each [...ticks].reverse() as k (k)}<span class="num">{num(k)}</span>{/each}</div>
        <div class="area">
          {#each ticks as k (k)}<i class="gl" style="bottom:{(k / topV) * 100}%"></i>{/each}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="hl" aria-hidden="true"><path d={hrLine('rest')} class="rest" /><path d={hrLine('high')} class="high" /></svg>
        </div>
      </div>
      <div class="xl"><span>{label(hr.points[0].key)}</span><span>{label(hr.points.at(-1).key)}</span></div>
      <ul class="leg"><li><i class="rest"></i>{t('at rest')}</li><li><i class="high"></i>{t('highest')}</li></ul>
      <div class="tot">
        <span><b class="num" data-hr-rest>{hr.rest ?? '--'} <small>bpm</small></b><small>{t('avg resting pulse')}</small></span>
        <span><b class="num" data-hr-high>{hr.high ?? '--'} <small>bpm</small></b><small>{t('avg highest')}</small></span>
      </div>
    </section>
    <ul class="days">
      {#each hr.days as d (d.key)}
        <li class="card" data-hr-day={d.key}><span class="m"><b>{day(d.key)}</b><small>{date(d.key)}</small></span><span class="v num"><span>{d.rest ?? '--'}{d.rest != null ? ' bpm' : ''}</span><span>{d.high ?? '--'}{d.high != null ? ' bpm' : ''}</span></span></li>
      {/each}
    </ul>
    <p class="q">{t('At rest from Fitbit; highest from Fitbit, else from your activities. Garmin’s view of one day is missing: Fitbit gives the app only day values.')}</p>
  {/if}
</div>

<style>
  .gs {
    display: grid;
    gap: var(--sp-4);
    max-width: 760px;
  }
  .hd {
    display: grid;
    gap: 4px;
  }
  .ptitle {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font: 600 var(--fs-page) / var(--lh-title) var(--font-title);
  }
  .ptitle :global(svg) {
    color: var(--hi);
  }
  .per {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }
  .nav {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-bottom: 1px solid var(--line);
  }
  .tabs button {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    border-bottom: 3px solid transparent;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .tabs button[aria-selected='true'] {
    border-bottom-color: var(--ink);
    color: var(--ink);
    font-weight: 600;
  }
  .ch {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
  }
  .ch h2,
  .cap {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .cap {
    margin: 0 2px 8px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .plot {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
    height: 200px;
  }
  .yl {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    text-align: right;
  }
  .yl span {
    line-height: 0;
  }
  .yl span:first-child {
    line-height: 1;
  }
  .yl span:last-child {
    line-height: 0.6;
  }
  .area {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--n, 7), minmax(0, 1fr));
    align-items: end;
    gap: 2px;
  }
  .gl {
    position: absolute;
    right: 0;
    left: 0;
    height: 1px;
    background: var(--line);
  }
  .bc {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    height: 100%;
  }
  .bc i {
    display: block;
    width: min(70%, 14px);
    border-radius: 99px 99px 0 0;
    background: var(--hi);
  }
  .hl {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .hl path {
    fill: none;
    stroke-width: 2.5;
    vector-effect: non-scaling-stroke;
  }
  .hl .rest {
    stroke: var(--hi);
  }
  .hl .high {
    stroke: var(--bad);
  }
  .xl {
    display: flex;
    justify-content: space-between;
    padding-left: 32px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .leg {
    display: flex;
    justify-content: center;
    gap: 18px;
    margin: 0;
    padding: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    list-style: none;
  }
  .leg li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .leg i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .leg .rest {
    background: var(--hi);
  }
  .leg .high {
    background: var(--bad);
  }
  .tot {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .tot > span {
    display: grid;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .tot b {
    font: 600 var(--fs-title) / 1.15 var(--font-body);
  }
  .tot b small {
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .tot > span > small,
  .q {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .q {
    margin: 0 2px;
  }
  .list,
  .days {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    border-top: 1px solid var(--line);
  }
  .list li:first-child {
    border-top: 0;
  }
  .list a,
  .days li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 56px;
    padding: 10px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .list a:hover {
    background: var(--paper-2);
  }
  .days {
    display: grid;
    gap: 8px;
  }
  .m,
  .v {
    display: grid;
    min-width: 0;
  }
  .m small,
  .v small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .v {
    justify-items: end;
    font-weight: 600;
  }
</style>
