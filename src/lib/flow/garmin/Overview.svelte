<script>
  /**
   * Garmin-Übersicht (Noah 20.10.2026 «genau so kann es aussehen … baue sie 1:1 nach», light like the app):
   * on Aktiv, in Garmin Connect's order: «Aktivitäten von heute», «Im Fokus» (per sport, to swipe),
   * «Überblick» (2×2: heart rate, active zone minutes, calories, sleep) and «Letzte 7 Tage» (the sports,
   * the calories and «Deine Woche in Zahlen» with the comparison to your usual week).
   * The values come from Strava, the rides of the app and Fitbit (messwerte.js, uebersicht.js).
   */
  import { Heart, Flame, Moon, ChevronRight } from '@lucide/svelte';
  import Sec from '../kit/Sec.svelte';
  import TodayActs from './TodayActs.svelte';
  import Focus from './Focus.svelte';
  import AzmWeek from '../../health/AzmWeek.svelte';
  import WeekNumbers from '../WeekNumbers.svelte';
  import { tableQuery } from '../../messwerte-data.js';
  import { kindsOf, lastWeek, caloriesOf, rhrLine, latestOf } from '../../uebersicht.js';
  import { shown } from '../../messwerte.js';
  import { addDays } from '../../health.js';
  import { health, FITBIT_HASH } from '../../health/client.svelte.js';
  import { SPORT_ICON, sportName, km2 } from './words.js';
  import { t, tn, num } from '../../i18n.svelte.js';

  let { today, children } = $props();
  const q = tableQuery();
  const table = $derived($q ?? new Map());
  const todays = $derived(table.get(today)?.acts ?? []);
  const kinds = $derived(kindsOf(table, today));
  const week = $derived(lastWeek(table, today));
  const kcal = $derived(caloriesOf(table.get(today)));
  const rhr = $derived(latestOf(table, today, 'rhr'));
  const high = $derived(latestOf(table, today, 'hrMax'));
  const sleep = $derived(latestOf(table, today, 'sleep'));
  const line = $derived(rhrLine(table, today));
  const spark = $derived.by(() => {
    const v = line.filter((x) => x != null);
    if (v.length < 2) return '';
    const lo = Math.min(...v) - 2;
    const hi = Math.max(...v) + 2;
    let out = '';
    line.forEach((x, i) => {
      if (x == null) return;
      out += `${out ? 'L' : 'M'}${((i / (line.length - 1)) * 100).toFixed(1)} ${(40 - ((x - lo) / (hi - lo)) * 36 - 2).toFixed(1)}`;
    });
    return out;
  });
  // the sleep tile: the last 7 nights as small bars, today on the right
  const nights = $derived(Array.from({ length: 7 }, (_, i) => table.get(addDays(today, i - 6))?.sleep ?? null));
  const nightTop = $derived(Math.max(480, ...nights.map((v) => v ?? 0)));
  const fitbitOff = $derived(!health.prefs.connected);
  const kcalPct = $derived(kcal.total && kcal.active != null ? Math.max(3, Math.min(97, Math.round((kcal.active / kcal.total) * 100))) : null);
</script>

{#if todays.length}
  <Sec id="todayacts-h" title={t('Activities today')}>
    <TodayActs acts={todays} />
  </Sec>
{/if}

{#if kinds.length}
  <Sec id="focus-h" title={t('In focus')} sub={t('per sport, the last 7 days · swipe for the next sport')}>
    <Focus {table} {today} {kinds} />
  </Sec>
{/if}

<Sec id="overview-h" title={t('Overview|garmin')} sub={t('from Fitbit and Strava · tap a tile for more')}>
  <div class="ov" data-overview>
    <a class="card tile" href="#/flow/stats/hr" data-ov="hr">
      <span class="th"><span class="ico hrt" aria-hidden="true"><Heart size={18} /></span><span>{t('Heart rate')}</span></span>
      {#if high}<b class="num big">{num(high.v)} <small>bpm</small></b><small class="q">{high.day === today ? t('highest today') : t('highest on the latest day')}</small>{/if}
      {#if spark}<svg class="spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d={spark} /></svg><small class="q">{t('resting pulse, 14 days')}</small>{/if}
      {#if rhr}<b class="num">{num(rhr.v)} <small>bpm</small></b><small class="q">{t('at rest')}</small>{:else}<small class="q">{fitbitOff ? t('comes with Fitbit') : t('no value yet')}</small>{/if}
      <ChevronRight class="go" size={16} aria-hidden="true" />
    </a>
    <AzmWeek {today} tile />
    <a class="card tile" href="#/flow/stats/kcal" data-ov="kcal">
      <span class="th"><span class="ico fl" aria-hidden="true"><Flame size={18} /></span><span>{t('Calories burned')}</span></span>
      {#if kcal.total != null}
        <b class="num big">{num(kcal.total)}</b>
        {#if kcalPct != null}<span class="kb" aria-hidden="true"><i class="a" style="width:{kcalPct}%"></i><i class="r"></i></span>{/if}
        <span class="two">
          <span><b class="num">{kcal.active == null ? '–' : num(kcal.active)}</b><small>{t('Active|kcal')}</small></span>
          <span class="rt"><b class="num">{kcal.rest == null ? '–' : num(kcal.rest)}</b><small>{t('At rest|kcal')}</small></span>
        </span>
      {:else if kcal.active != null}
        <b class="num big">{num(kcal.active)}</b><small class="q">{t('active, from your Strava activities')}</small>
        <small class="q">{fitbitOff ? t('At rest: comes with Fitbit') : t('At rest: comes with the next Fitbit fetch')}</small>
      {:else}
        <b class="num big">–</b><small class="q">{fitbitOff ? t('comes with Fitbit') : t('no value yet')}</small>
      {/if}
      <ChevronRight class="go" size={16} aria-hidden="true" />
    </a>
    <a class="card tile" href="#/flow/stats/sleep" data-ov="sleep">
      <span class="th"><span class="ico mo" aria-hidden="true"><Moon size={18} /></span><span>{t('Sleep|metric')}</span></span>
      {#if sleep}
        <b class="num big">{shown('sleep', sleep.v, num)}</b><small class="q">{sleep.day === today ? t('last night') : t('latest night')}</small>
        <span class="nights" aria-hidden="true">{#each nights as v, i (i)}<i style="height:{v ? Math.max(8, Math.round((v / nightTop) * 100)) : 0}%" class:now={i === 6}></i>{/each}</span>
        <small class="q">{t('the last 7 nights')}</small>
      {:else}
        <b class="num big">–</b><small class="q">{fitbitOff ? t('comes with Fitbit') : t('no value yet')}</small>
      {/if}
      <ChevronRight class="go" size={16} aria-hidden="true" />
    </a>
  </div>
  {#if fitbitOff}<a class="fb" href={FITBIT_HASH}>{t('Connect Fitbit')} ›</a>{/if}
</Sec>

<Sec id="km-h" title={t('Last 7 days')} sub={t('compared with your usual week')}>
  <ul class="card l7" data-last7>
    {#each week.kinds as k (k.kind)}
      {@const I = SPORT_ICON[k.kind]}
      <li><a href="#/flow/stats/{k.kind}" data-l7={k.kind}><span class="ico si" aria-hidden="true"><I size={20} /></span><span>{tn(k.n, '{n}× {sport}', '{n}× {sport}', { sport: sportName(k.kind) })}</span><b class="num">{k.km ? `${km2(k.km)} km` : ''}</b></a></li>
    {/each}
    <li><a href="#/flow/stats/hr" data-l7="hr"><span class="ico hrt" aria-hidden="true"><Heart size={20} /></span><span>{t('Heart rate')}</span><b class="num">{week.rhr == null ? '–' : t('{n} avg at rest', { n: num(week.rhr) })}</b></a></li>
    <li data-l7="kcal"><span class="ico fl" aria-hidden="true"><Flame size={20} /></span><span>{t('Calories burned')}</span><b class="num">{week.kcal == null ? '–' : t('avg {n}', { n: num(week.kcal) })}</b></li>
  </ul>
  <WeekNumbers {today} />
  {@render children?.()}
</Sec>

<style>
  .ov {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .tile {
    position: relative;
    display: grid;
    align-content: start;
    gap: 4px;
    min-height: 196px;
    padding: 12px;
    color: var(--ink);
    text-decoration: none;
  }
  a.tile:hover {
    background: var(--paper-2);
  }
  .th {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .th :global(svg) {
    flex: none;
  }
  .ico {
    display: inline-grid;
    flex: none;
  }
  .hrt {
    color: var(--bad);
  }
  .fl {
    color: var(--ok);
  }
  .mo {
    color: var(--l4);
  }
  .tile b {
    font: 600 var(--fs-sub) / 1.2 var(--font-body);
  }
  .tile b.big {
    font-size: var(--fs-title);
  }
  .tile b small {
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .q {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    line-height: 1.3;
  }
  .tile :global(.go) {
    position: absolute;
    top: 12px;
    right: 10px;
    color: var(--ink-3);
  }
  .spark {
    width: 100%;
    height: 44px;
    margin-top: 6px;
  }
  .spark path {
    fill: none;
    stroke: var(--hi);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .nights {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    align-items: end;
    gap: 5px;
    height: 56px;
    margin-top: 10px;
  }
  .nights i {
    display: block;
    border-radius: 4px 4px 0 0;
    background: var(--l4-soft);
  }
  .nights i.now {
    background: var(--l4);
  }
  .kb {
    display: flex;
    gap: 3px;
    height: 10px;
    margin: 18px 0 6px;
  }
  .kb i {
    display: block;
    border-radius: 99px;
  }
  .kb .a {
    background: var(--bad);
  }
  .kb .r {
    flex: 1;
    background: var(--hi);
  }
  .two {
    display: flex;
    justify-content: space-between;
    gap: 6px;
  }
  .two > span {
    display: grid;
  }
  .two small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .two .rt {
    text-align: right;
  }
  .fb {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: 4px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .l7 {
    margin: 0 0 10px;
    padding: 0;
    list-style: none;
  }
  .l7 li {
    border-top: 1px solid var(--line);
  }
  .l7 li:first-child {
    border-top: 0;
  }
  .l7 li,
  .l7 a {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .l7 li:has(a) {
    display: block;
    padding: 0;
  }
  .l7 a:hover {
    background: var(--paper-2);
  }
  .si {
    color: var(--hi);
  }
  .l7 b {
    font-weight: 600;
  }
</style>
