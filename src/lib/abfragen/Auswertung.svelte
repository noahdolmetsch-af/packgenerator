<script>
  /**
   * AB6 «So wird ausgewertet» (Noah 14.10.2026 «freigabe»; Noah 14.10. 00:52:22 1a 2a 3b 4ab — 4ab: it lives
   * under Ich › Daten › Auswertung AND directly on «Deine Abfragen»; the same component in both places).
   * Everything reads the one history (abdb.js historyQuery), only to look at: no grades, no colours for
   * good or bad, every part names its sources. The rules are in abauswertung.js.
   * compact: on «Deine Abfragen» (fewer parts, a link to the whole page).
   */
  import { ArrowRight, ArrowUpRight, ArrowDownRight, Eye, Hourglass, Lock, Hand, Watch, Bike, Smartphone, ChevronRight } from '@lucide/svelte';
  import { historyQuery } from '../abdb.js';
  import { tableQuery } from '../messwerte-data.js';
  import { QUESTION, configOf } from '../abfragen.js';
  import { ownNormal, withWithout, feltMeasured, areaWeek, observation, sourceCounts, weekOf, dailyValues, MIN_GROUP, MIN_OBS_DAYS } from '../abauswertung.js';
  import { lastDays } from '../flow.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';
  import { qText, areaName, dayShort, dayName, srcText } from './words.js';
  import Insights from '../erkenntnisse/Insights.svelte';
  import './ab.css';

  let { compact = false, idp = 'aw' } = $props();
  const today = localDay();
  const query = historyQuery();
  const rows = $derived($query?.rows ?? []);
  const own = $derived(configOf($query?.cfg).own);
  const forms = $derived(Object.fromEntries(own.map((q) => [q.id, q.form])));

  // 1 own normal: the battery (or the first 1–10 question with answers)
  const scaleIds = $derived([...new Set(rows.filter((r) => r.kind === 'scale').map((r) => r.qid))]);
  const normalId = $derived(scaleIds.includes('erholung.akku') ? 'erholung.akku' : (scaleIds[0] ?? 'erholung.akku'));
  const normal = $derived(ownNormal(rows, normalId, today, { forms }));
  const normalQ = $derived(QUESTION[normalId] ?? own.find((x) => x.id === normalId));

  // 2 with and without: «Zufriedenheit mit dem Tag» on days with nature, with friends, with a ride
  const days30 = lastDays(today, 30);
  const has = (qid) => {
    const per = dailyValues(rows, qid);
    return (day) => (per[day] == null ? null : per[day] > 0);
  };
  const rideDays = $derived(new Set(rows.filter((r) => r.kind === 'ride').map((r) => r.day)));
  const compares = $derived([
    { key: 'nature', label: t('Nature'), yes: t('with nature'), no: t('without nature'), r: withWithout(rows, 'erreicht.zufrieden', has('natur.draussen'), days30, { forms }) },
    { key: 'friends', label: t('Friends'), yes: t('with friends'), no: t('without friends'), r: withWithout(rows, 'erreicht.zufrieden', has('freunde.zeit'), days30, { forms }) },
    { key: 'rides', label: t('Trips'), yes: t('ride days'), no: t('other days'), r: withWithout(rows, 'erreicht.zufrieden', (d) => (rideDays.size ? rideDays.has(d) : null), days30, { forms }) },
  ]);

  // 3 felt next to measured: sleep felt / Fitbit (later), battery / resting pulse
  // «Aktiv neu» (20.10.2026): the Fitbit nights and the resting pulse from the day table (messwerte.js)
  const tq = tableQuery();
  const fitOf = (k, f = (v) => v) => Object.fromEntries([...($tq ?? new Map()).values()].filter((r) => r[k] != null).map((r) => [r.day, f(r[k])]));
  const fitbitSleep = $derived(fitOf('sleep', (m) => Math.round((m / 60) * 10) / 10));
  const fitbitRhr = $derived(fitOf('rhr'));
  const handRhr = $derived(dailyValues(rows, 'koerper.ruhepuls'));
  const pairs = $derived([
    { key: 'sleep', title: t('Sleep|felt'), a: { name: t('felt 1–10'), v: dailyValues(rows, 'erholung.schlaf') }, b: { name: t('Fitbit sleep'), v: fitbitSleep }, src: ['hand', 'fitbit'] },
    { key: 'pulse', title: t('Battery and resting pulse'), a: { name: t('Battery 1–10'), v: dailyValues(rows, 'erholung.akku') }, b: { name: t('Resting pulse'), v: { ...handRhr, ...fitbitRhr } }, src: Object.keys(fitbitRhr).length ? ['hand', 'fitbit'] : ['hand'] },
  ]);
  const f1 = (v) => (v == null ? '–' : Number.isInteger(v) ? String(v) : v.toFixed(1));

  // 4 the week by area (0–100)
  const week = weekOf(today);
  const areas = $derived(areaWeek(rows, week, { forms }));

  // 5 one observation: after nights felt 1–4, the battery mostly under 5
  const obs = $derived.by(() => {
    const sleep = dailyValues(rows, 'erholung.schlaf');
    const akku = dailyValues(rows, 'erholung.akku');
    const days = lastDays(today, 60);
    return observation(days, (d) => (sleep[d] == null ? null : sleep[d] <= 4), (d) => (akku[d] == null ? null : akku[d] < 5));
  });

  // + where the values come from (this month)
  const month = today.slice(0, 7);
  const srcs = $derived(sourceCounts(rows.filter((r) => r.day.startsWith(month))));
  const ICON = { hand: Hand, fitbit: Watch, strava: Bike, app: Smartphone };

  // the chart of the own normal
  // AB: the chart is drawn at its real width, so the axis text keeps its size on the phone and on the computer
  let cw = $state(620);
  const W = $derived(Math.max(260, Math.round(cw || 620)));
  const H = 170;
  const chart = $derived.by(() => {
    const L = 26;
    const R = 8;
    const T0 = 10;
    const B = 24;
    const s = normal.series;
    const x = (i) => L + (i * (W - L - R)) / (s.length - 1);
    const y = (v) => T0 + ((10 - v) / 9) * (H - T0 - B);
    const avg = s.map((_, i) => {
      const w = s.slice(Math.max(0, i - 6), i + 1).map((p) => p.v).filter((v) => v != null);
      return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
    });
    const pts = avg.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean);
    return { x, y, L, R, T0, B, s, line: pts.length > 1 ? `M${pts.join(' L')}` : null };
  });
</script>

<div class="aw" class:compact>
  <!-- Erkenntnisse (Noah 19.10.2026 «4b»): the strongest three first, all on Ich › Erkenntnisse -->
  <Insights compact idp="{idp}-ek" />
  <section class="ich-sec" aria-labelledby="{idp}-n-h">
    <div class="ich-h"><div><h2 id="{idp}-n-h">{t('History and your own normal')}</h2><p class="ich-hs">{t('day value, mean of 7 days and your normal of the last 30 days')}</p></div></div>
    <div class="card pad">
      <div class="ch-h"><b>{qText(normalQ)}</b><span class="srcs"><span class="ab-src hand"><Hand size={13} aria-hidden="true" />{srcText('hand')}</span></span></div>
      {#if normal.n}
        <div class="chw" bind:clientWidth={cw}><svg class="chart" width={W} height={H} viewBox="0 0 {W} {H}" role="img" aria-label={t('{q}: the last 30 days with your normal', { q: qText(normalQ) })}>
          {#if normal.band}<rect class="band" x={chart.L} y={chart.y(normal.band[1])} width={W - chart.L - chart.R} height={Math.max(2, chart.y(normal.band[0]) - chart.y(normal.band[1]))} rx="4" />{/if}
          {#each [1, 5, 10] as v (v)}<text class="ax" x={chart.L - 8} y={chart.y(v) + 4} text-anchor="end">{v}</text>{/each}
          {#if chart.line}<path class="ln" d={chart.line} />{/if}
          {#each chart.s as p, i (p.day)}{#if p.v != null}<circle class="dot" cx={chart.x(i)} cy={chart.y(p.v)} r="4"><title>{dayShort(p.day)}: {f1(p.v)}</title></circle>{/if}{/each}
          <text class="ax" x={chart.L} y={H - 4}>{dayShort(chart.s[0].day)}</text>
          <text class="ax" x={W - chart.R} y={H - 4} text-anchor="end">{dayShort(today)}</text>
        </svg></div>
        <div class="leg"><span><i class="d"></i>{t('day value')}</span><span><i class="l"></i>{t('mean of 7 days')}</span>{#if normal.band}<span><i class="b"></i>{t('your normal {lo}–{hi}', { lo: normal.band[0], hi: normal.band[1] })}</span>{/if}</div>
      {:else}
        <p class="wait"><Hourglass size={15} aria-hidden="true" /><span>{t('No answers yet. The line shows from the first answers on.')}</span></p>
      {/if}
      <dl class="tiles">
        <div><dd class="num">{f1(normal.today)}</dd><dt>{t('today')}</dt></div>
        <div><dd class="num">{f1(normal.avg7)}</dd><dt>{t('mean of 7 days')}</dt></div>
        <div><dd class="num">{normal.band ? `${normal.band[0]}–${normal.band[1]}` : '–'}</dd><dt>{t('your normal')}</dt></div>
        <div><dd>{#if normal.dir === 'up'}<ArrowUpRight size={22} aria-hidden="true" />{:else if normal.dir === 'down'}<ArrowDownRight size={22} aria-hidden="true" />{:else}<ArrowRight size={22} aria-hidden="true" />{/if}</dd><dt>{normal.dir === 'up' ? t('direction: up') : normal.dir === 'down' ? t('direction: down') : normal.dir === 'same' ? t('direction: the same') : t('direction: not yet')}</dt></div>
      </dl>
    </div>
  </section>

  <section class="ich-sec" aria-labelledby="{idp}-m-h">
    <div class="ich-h"><div><h2 id="{idp}-m-h">{t('With and without')}</h2><p class="ich-hs">{t('days with a thing next to days without it · a result only from {n} days per group', { n: MIN_GROUP })}</p></div></div>
    <div class="card pad">
      <div class="ch-h"><b>{qText(QUESTION['erreicht.zufrieden'])}</b><span class="srcs"><span class="ab-src hand"><Hand size={13} aria-hidden="true" />{srcText('hand')}</span><span class="ab-src app"><Smartphone size={13} aria-hidden="true" />{srcText('app')}</span></span></div>
      {#each compact ? compares.slice(0, 1) : compares as c (c.key)}
        <div class="mo" data-compare={c.key}>
          <b>{c.label}</b>
          {#if c.r.ready}
            <div class="bar"><span>{c.yes}</span><i style:--w="{(c.r.with.mean / 10) * 100}%"></i><em class="num">Ø {c.r.with.mean}</em><small class="num">{tn(c.r.with.n, '{n} day', '{n} days')}</small></div>
            <div class="bar o"><span>{c.no}</span><i style:--w="{(c.r.without.mean / 10) * 100}%"></i><em class="num">Ø {c.r.without.mean}</em><small class="num">{tn(c.r.without.n, '{n} day', '{n} days')}</small></div>
          {:else}
            <p class="wait"><Hourglass size={15} aria-hidden="true" /><span>{t('{a}: {n} · {b}: {m}. A result from {min} days per group.', { a: c.yes, n: tn(c.r.with.n, '{n} day', '{n} days'), b: c.no, m: tn(c.r.without.n, '{n} day', '{n} days'), min: MIN_GROUP })}</span></p>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  {#if !compact}
    <section class="ich-sec" aria-labelledby="{idp}-p-h">
      <div class="ich-h"><div><h2 id="{idp}-p-h">{t('Felt next to measured')}</h2><p class="ich-hs">{t('the last 7 days · both side by side, without judgement')}</p></div></div>
      <div class="card pad">
        {#each pairs as p (p.key)}
          <div class="pair">
            <div class="ch-h"><b>{p.title}</b><span class="srcs">{#each p.src as k (k)}{@const I = ICON[k]}<span class="ab-src {k}"><I size={13} aria-hidden="true" />{srcText(k)}</span>{/each}</span></div>
            <table class="pt">
              <thead><tr><th></th>{#each feltMeasured(p.a.v, p.b.v, today) as d (d.day)}<th>{dayName(new Date(`${d.day}T00:00:00Z`).getUTCDay())}</th>{/each}</tr></thead>
              <tbody>
                <tr><th>{p.a.name}</th>{#each feltMeasured(p.a.v, p.b.v, today) as d (d.day)}<td class="num">{f1(d.felt)}</td>{/each}</tr>
                <tr><th>{p.b.name}</th>{#each feltMeasured(p.a.v, p.b.v, today) as d (d.day)}<td class="num">{f1(d.measured)}</td>{/each}</tr>
              </tbody>
            </table>
          </div>
        {/each}
        {#if !Object.keys(fitbitSleep).length}<p class="note">{t('Connect Fitbit (Me › Fitbit): then sleep and resting pulse come by themselves.')}</p>{/if}
      </div>
    </section>
  {/if}

  <section class="ich-sec" aria-labelledby="{idp}-w-h">
    <div class="ich-h"><div><h2 id="{idp}-w-h">{t('Your week by area')}</h2><p class="ich-hs">{t('value 0–100 from the questions, {from} to {to}', { from: dayShort(week[0]), to: dayShort(week[6]) })}</p></div></div>
    <ul class="card pad areas">
      {#each areas as a (a.area)}
        <li data-area-value={a.area}><span>{areaName(a.area)}</span><i style:--w="{a.value ?? 0}%"></i><b class="num">{a.value ?? '–'}</b></li>
      {/each}
    </ul>
  </section>

  {#if !compact}
    <section class="ich-sec" aria-labelledby="{idp}-o-h">
      <div class="ich-h"><div><h2 id="{idp}-o-h">{t('An observation')}</h2><p class="ich-hs">{t('from your own similar days · only after about 2 weeks of data')}</p></div></div>
      <div class="card pad">
        <!-- AB: the sentence only with enough days and with the counted days, so it never says more than the data -->
        {#if obs.ready}
          <p class="obs"><Eye size={18} aria-hidden="true" /><span>{t('After nights you felt as 1–4, your battery was under 5 on {n} of {m} days.', { n: obs.hits, m: obs.n })}</span></p>
        {:else}
          <p class="wait"><Hourglass size={15} aria-hidden="true" /><span>{t('Not enough days yet: an observation shows after about {n} days with answers.', { n: MIN_OBS_DAYS })}</span></p>
        {/if}
      </div>
    </section>

    <section class="ich-sec" aria-labelledby="{idp}-s-h">
      <div class="ich-h"><div><h2 id="{idp}-s-h">{t('Where the values come from')}</h2><p class="ich-hs">{t('this month in the history')}</p></div></div>
      <ul class="card pad srcl">
        {#each ['hand', 'fitbit', 'strava', 'app'] as k (k)}{@const I = ICON[k]}<li><span class="ab-src {k}"><I size={13} aria-hidden="true" />{srcText(k)}</span><b class="num">{srcs[k]}</b></li>{/each}
      </ul>
    </section>
  {/if}
  <p class="local"><Lock size={15} aria-hidden="true" /><span>{t('Everything stays on the device and is in the backup. Nothing goes to a service.')}</span></p>
  {#if compact}<a class="btn" href="#/me/analysis">{t('The whole analysis')}<ChevronRight size={16} aria-hidden="true" /></a>{/if}
</div>

<style>
  .aw {
    min-width: 0;
  }
  .pad {
    padding: 14px 16px;
  }
  .ch-h {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 10px;
    margin-bottom: 10px;
  }
  .ch-h b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .srcs {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chw {
    width: 100%;
  }
  .chart {
    display: block;
  }
  .band {
    fill: var(--paper-2);
    stroke: var(--line-strong);
    stroke-dasharray: 4 3;
  }
  .ln {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .dot {
    fill: var(--paper);
    stroke: var(--ink-3);
    stroke-width: 1.5;
  }
  .ax {
    fill: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .leg {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 6px 0 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .leg span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .leg i {
    display: inline-block;
  }
  .leg .d {
    width: 9px;
    height: 9px;
    border: 1.5px solid var(--ink-3);
    border-radius: 50%;
  }
  .leg .l {
    width: 16px;
    height: 3px;
    border-radius: 2px;
    background: var(--ink-2);
  }
  .leg .b {
    width: 16px;
    height: 10px;
    border: 1px dashed var(--line-strong);
    border-radius: 3px;
    background: var(--paper-2);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin: 0;
  }
  .tiles div {
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .tiles dd {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    color: var(--ink);
  }
  .tiles dt {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wait {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .wait :global(svg),
  .obs :global(svg),
  .local :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .mo {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .mo > b {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
  }
  .bar {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr) 52px 70px;
    gap: 10px;
    align-items: center;
    min-height: 30px;
    font-size: var(--fs-small);
  }
  .bar span {
    color: var(--ink-2);
  }
  .bar i {
    display: block;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(90deg, var(--ink-2) var(--w), var(--paper-2) var(--w));
  }
  .bar.o i {
    background: linear-gradient(90deg, var(--line-strong) var(--w), var(--paper-2) var(--w));
  }
  .bar em {
    font-style: normal;
    font-weight: 600;
    text-align: right;
  }
  .bar small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
  .pair + .pair {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .pt {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: var(--fs-small);
  }
  .pt th {
    padding: 0 0 4px;
    color: var(--ink-3);
    font-weight: 500;
    text-align: center;
  }
  .pt tbody th {
    width: 120px;
    color: var(--ink-2);
    text-align: left;
  }
  .pt td {
    padding: 4px 2px;
    text-align: center;
  }
  .note {
    margin: 12px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .areas {
    list-style: none;
    margin: 0;
  }
  .areas li {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr) 36px;
    gap: 10px;
    align-items: center;
    min-height: 32px;
    font-size: var(--fs-small);
  }
  .areas i {
    display: block;
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--line-strong) var(--w), var(--paper-2) var(--w));
  }
  .areas b {
    text-align: right;
    font-weight: 600;
  }
  .obs {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
  }
  .srcl {
    list-style: none;
    margin: 0;
  }
  .srcl li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    border-top: 1px solid var(--line);
  }
  .srcl li:first-child {
    border-top: 0;
  }
  .local {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin: 0 2px 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (max-width: 719px) {
    .tiles {
      grid-template-columns: 1fr 1fr;
    }
    .bar {
      grid-template-columns: 96px minmax(0, 1fr) 46px;
    }
    .bar small {
      grid-column: 1;
      grid-row: 2;
      text-align: left;
    }
    .pt tbody th {
      width: 72px;
    }
    .areas li {
      grid-template-columns: 112px minmax(0, 1fr) 32px;
    }
  }
</style>
