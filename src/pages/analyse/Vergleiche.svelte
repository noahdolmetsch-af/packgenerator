<script>
  /**
   * «Analyse» M3 «Vergleichen» (Noah 27.10.2026 «alle Mockups 1:1», idea «Woche vor gegen Woche nach einer
   * Tour»), under «Eigenes Diagramm»: «Zeitraum gegen Zeitraum» (this week, month or year against the one
   * before, one line each), «Aktivität gegen Aktivität» (how often per week, 12 weeks) and «Vor und nach
   * einer Tour» (the 7 days before against the 7 days after). Only to look at. Rules in lib/analyse/compare.js.
   * byKey: the values; acts, log: Aktiv; trips; today.
   */
  import { X } from '@lucide/svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { UNITS, MAX_ACTS, AROUND, compareWindows, running, sameDay, weeklyCounts, meanPerWeek, aroundTrip, pastTrips } from '../../lib/analyse/compare.js';
  import { ticksPerDay } from '../../lib/analyse/overview.js';
  import { SERIES_COLORS } from '../../lib/analyse/diagram.js';
  import { tripEnd } from '../../lib/tripstate.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { byKey = new Map(), acts = [], log = [], trips = [], today } = $props();

  const LS = 'pg.analyse.compare';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  let unit = $state(UNITS.includes(saved.unit) ? saved.unit : 'month');
  let valueKey = $state(typeof saved.value === 'string' ? saved.value : null);
  let actIds = $state(Array.isArray(saved.acts) ? saved.acts.filter((x) => typeof x === 'string') : null);
  let tripId = $state(saved.trip ?? null);

  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const has = (it, days) => days.some((d) => {
    const v = it.get(d);
    return typeof v === 'number' && Number.isFinite(v);
  });

  // — Zeitraum gegen Zeitraum —
  const win = $derived(compareWindows(today, unit));
  const perDay = $derived(ticksPerDay(log));
  const ticksItem = $derived({ key: 'ticks', name: t('Ticks|compare'), unit: '×', sum: true, get: (d) => perDay.get(d) ?? null });
  const CANDIDATES = ['km:bike', 'ticks', 'sleep', 'azm', 'steps', 'rhr', 'felt:energy'];
  const values = $derived(
    CANDIDATES.map((k) => (k === 'ticks' ? ticksItem : byKey.get(k)))
      .filter((it) => it?.get && has(it, [...win.prev.days, ...win.now.days]))
      .slice(0, 5),
  );
  const value = $derived(values.find((v) => v.key === valueKey) ?? values[0] ?? null);
  const lineNow = $derived(value ? running(win.now.days, value.get, value.sum) : []);
  const linePrev = $derived(value ? running(win.prev.days, value.get, value.sum) : []);
  const diffNow = $derived(sameDay(lineNow, linePrev));
  const W = 600;
  const H = 180;
  const PAD = 8;
  const len = $derived(Math.max(win.now.days.length, win.prev.days.length, 2));
  const lo = $derived(value?.sum ? 0 : Math.min(...[...lineNow, ...linePrev].filter((v) => v != null), Infinity));
  const hi = $derived(Math.max(...[...lineNow, ...linePrev].filter((v) => v != null), -Infinity));
  const yOf = (v) => {
    const a = Number.isFinite(lo) ? lo : 0;
    const b = Number.isFinite(hi) && hi > a ? hi : a + 1;
    return H - PAD - ((v - a) / (b - a)) * (H - 2 * PAD);
  };
  const xOf = (i) => (i / (len - 1)) * W;
  const pathOf = (line) => {
    let d = '';
    let pen = false;
    line.forEach((v, i) => {
      if (v == null) return (pen = false);
      d += `${pen ? 'L' : 'M'}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const UNIT_NAMES = { week: 'Week|compare', month: 'Month|compare', year: 'Year|analyse' };
  const unitOpts = $derived(UNITS.map((u) => ({ key: u, name: t(UNIT_NAMES[u]) })));
  const nameOf = (w) => (unit === 'month' ? dfmt(w.from, { month: 'long' }) : unit === 'year' ? w.from.slice(0, 4) : t('Week of {day}|compare', { day: dfmt(w.from, { day: 'numeric', month: 'short' }) }));
  const prevPhrase = $derived(unit === 'month' ? t('in {month}|compare', { month: dfmt(win.prev.from, { month: 'long' }) }) : unit === 'year' ? t('in {year}|compare', { year: win.prev.from.slice(0, 4) }) : t('in the week before|compare'));
  const vText = (v) => `${valueText(value, Math.abs(v), num)}${unitText(value) ? ` ${unitText(value)}` : ''}`;
  const sentence = $derived.by(() => {
    if (!value || !diffNow) return '';
    const day = dfmt(win.prev.days[diffNow.at], { day: 'numeric', month: 'long' });
    if (Math.abs(diffNow.diff) < 1e-9) return t('Today you are where you were on {day}.|compare', { day });
    if (value.sum)
      return diffNow.diff > 0
        ? t('Today you are {d} further than on {day}.|compare', { d: vText(diffNow.diff), day })
        : t('Today you are {d} behind {day}.|compare', { d: vText(diffNow.diff), day });
    return diffNow.diff > 0
      ? t('So far on average {d} more than {prev}.|compare', { d: vText(diffNow.diff), prev: prevPhrase })
      : t('So far on average {d} less than {prev}.|compare', { d: vText(diffNow.diff), prev: prevPhrase });
  });

  // — Aktivität gegen Aktivität —
  const WEEKS = 12;
  const allWeeks = $derived(weeklyCounts(log, acts.map((a) => a.id), today, WEEKS));
  const busiest = $derived(acts.map((a) => ({ id: a.id, n: meanPerWeek(allWeeks, a.id) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n));
  const chosen = $derived((actIds ?? busiest.slice(0, 2).map((x) => x.id)).filter((id) => acts.some((a) => a.id === id)).slice(0, MAX_ACTS));
  const actOf = (id) => acts.find((a) => a.id === id);
  const others = $derived(acts.filter((a) => !chosen.includes(a.id)));
  const weekTop = $derived(Math.max(1, ...allWeeks.flatMap((w) => chosen.map((id) => w.n[id] ?? 0))));
  const AH = 150;
  const ax = (i) => (i / Math.max(1, WEEKS - 1)) * W;
  const ay = (n) => AH - PAD - (n / weekTop) * (AH - 2 * PAD);
  const addAct = (id) => {
    if (!id) return;
    actIds = [...chosen, id].slice(0, MAX_ACTS);
  };
  const dropAct = (id) => (actIds = chosen.filter((x) => x !== id));

  // — Vor und nach einer Tour —
  const past = $derived(pastTrips(trips, tripEnd, today));
  const trip = $derived(past.find((tr) => String(tr.id) === String(tripId)) ?? past[0] ?? null);
  const AROUND_KEYS = ['sleep', 'rhr', 'hrv', 'azm', 'steps', 'felt:energy', 'felt:mood', 'ticks'];
  const aroundRows = $derived.by(() => {
    if (!trip) return [];
    const end = tripEnd(trip) ?? trip.startDate;
    return AROUND_KEYS.map((k) => (k === 'ticks' ? ticksItem : byKey.get(k)))
      .filter((it) => it?.get)
      .map((it) => ({ it, r: aroundTrip(trip, end, it.get, today) }))
      .filter((x) => x.r && (x.r.before != null || x.r.after != null));
  });
  const rText = (it, v) => (v == null ? '–' : `${valueText(it, v, num)}${unitText(it) ? ` ${unitText(it)}` : ''}`);
  const dText = (it, v) => (v == null ? '' : `${v > 0 ? '+' : v < 0 ? '−' : '±'}${valueText(it, Math.abs(v), num)}`);

  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ unit, value: valueKey, acts: actIds, trip: tripId }));
    } catch {
      /* a private window: the choice is only for now */
    }
  });
</script>

<div class="two">
  <section class="card cmp" aria-labelledby="cmp-h" data-compare-period>
    <div class="ch"><h2 id="cmp-h">{t('Period against period|compare')}</h2><small>{nameOf(win.now)} {t('against|compare')} {nameOf(win.prev)}</small></div>
    <Seg options={unitOpts} value={unit} onchange={(v) => (unit = v)} label={t('Compare by|compare')} full={false} />
    {#if values.length}
      <div class="chips" role="group" aria-label={t('Value|compare')}>
        {#each values as v (v.key)}
          <button type="button" class="chip" class:on={value?.key === v.key} aria-pressed={value?.key === v.key} data-cmp-value={v.key} onclick={() => (valueKey = v.key)}>{v.name}</button>
        {/each}
      </div>
      <svg viewBox="0 0 {W} {H}" role="img" aria-label={`${value.name}: ${nameOf(win.now)} ${t('against|compare')} ${nameOf(win.prev)}`}>
        <line class="base" x1="0" x2={W} y1={H - PAD} y2={H - PAD} />
        <path class="prev" d={pathOf(linePrev)} data-cmp-prev />
        <path class="now" d={pathOf(lineNow)} data-cmp-now />
        {#if lineNow.at(-1) != null}<circle class="dot" cx={xOf(lineNow.length - 1)} cy={yOf(lineNow.at(-1))} r="4" />{/if}
      </svg>
      <ul class="legend"><li><i class="lsw now"></i>{nameOf(win.now)}</li><li><i class="lsw prev"></i>{nameOf(win.prev)}</li></ul>
      {#if sentence}<p class="say" data-cmp-say>{sentence}</p>{/if}
      <p class="hint">{value.sum ? t('Summed up day by day.|compare') : t('The mean so far, day by day.|compare')}</p>
    {:else}
      <p class="hint">{t('No values in these two periods yet.|compare')}</p>
    {/if}
  </section>

  <section class="card cmp" aria-labelledby="aa-h" data-compare-acts>
    <div class="ch"><h2 id="aa-h">{t('Activity against activity|compare')}</h2><small>{t('per week · {n} weeks|compare', { n: WEEKS })}</small></div>
    {#if acts.length}
      <div class="chips" role="group" aria-label={t('Activities|compare')}>
        {#each chosen as id, i (id)}
          <span class="chip on ca" data-cmp-act={id}><i class="dot" style="background:{SERIES_COLORS[i]}"></i>{actName(actOf(id))}<button type="button" class="x" aria-label={t('Remove {name}|compare', { name: actName(actOf(id)) })} onclick={() => dropAct(id)}><X size={14} aria-hidden="true" /></button></span>
        {/each}
        {#if chosen.length < MAX_ACTS && others.length}
          <label class="add">
            <span class="sr">{t('Add an activity|compare')}</span>
            <select class="sel" value="" onchange={(e) => { addAct(e.currentTarget.value); e.currentTarget.value = ''; }} data-cmp-add>
              <option value="">{t('+ Activity|compare')}</option>
              {#each others as a (a.id)}<option value={a.id}>{actName(a)}</option>{/each}
            </select>
          </label>
        {/if}
      </div>
      {#if chosen.length}
        <svg viewBox="0 0 {W} {AH}" role="img" aria-label={t('How often per week|compare')}>
          <line class="base" x1="0" x2={W} y1={AH - PAD} y2={AH - PAD} />
          {#each chosen as id, i (id)}
            <path class="al" style="stroke:{SERIES_COLORS[i]}" d={allWeeks.map((w, j) => `${j ? 'L' : 'M'}${ax(j).toFixed(1)} ${ay(w.n[id] ?? 0).toFixed(1)}`).join('')} data-cmp-line={id} />
            <circle cx={ax(WEEKS - 1)} cy={ay(allWeeks.at(-1)?.n[id] ?? 0)} r="4" style="fill:{SERIES_COLORS[i]}" />
          {/each}
        </svg>
        <div class="xl" aria-hidden="true"><span>{dfmt(allWeeks[0].key, { day: 'numeric', month: 'short' })}</span><span>{dfmt(allWeeks.at(-1).key, { day: 'numeric', month: 'short' })}</span></div>
        <ul class="legend">
          {#each chosen as id, i (id)}<li><i class="lsw ln" style="background:{SERIES_COLORS[i]}"></i>{actName(actOf(id))}: {t('{n} a week|compare', { n: num(Math.round(meanPerWeek(allWeeks, id) * 10) / 10) })}</li>{/each}
        </ul>
      {:else}
        <p class="hint">{t('Choose an activity above.|compare')}</p>
      {/if}
    {:else}
      <p class="hint">{t('No activities in Aktiv yet.|compare')}</p>
    {/if}
  </section>
</div>

{#if past.length}
  <section class="card cmp" aria-labelledby="tr-h" data-compare-trip>
    <div class="ch"><h2 id="tr-h">{t('Before and after a trip|compare')}</h2><small>{t('{n} days before against {n} days after|compare', { n: AROUND })}</small></div>
    <label class="tsel">
      <span class="pl">{t('Trip|compare')}</span>
      <select class="sel" value={trip ? String(trip.id) : ''} onchange={(e) => (tripId = e.currentTarget.value)} data-cmp-trip>
        {#each past as tr (tr.id)}<option value={String(tr.id)}>{tr.name || dfmt(tr.startDate, { day: 'numeric', month: 'long', year: 'numeric' })}</option>{/each}
      </select>
    </label>
    {#if aroundRows.length}
      <table>
        <thead><tr><th scope="col">{t('Value|compare')}</th><th scope="col">{t('Before|compare')}</th><th scope="col">{t('After|compare')}</th><th scope="col">{t('Change|compare')}</th></tr></thead>
        <tbody>
          {#each aroundRows as row (row.it.key)}
            <tr data-cmp-row={row.it.key}><th scope="row">{row.it.name}</th><td class="num">{rText(row.it, row.r.before)}</td><td class="num">{rText(row.it, row.r.after)}</td><td class="num">{dText(row.it, row.r.diff)}</td></tr>
          {/each}
        </tbody>
      </table>
      <p class="hint">{t('Only an observation: a trip is never the only thing that changes.|compare')}</p>
    {:else}
      <p class="hint">{t('No values around this trip.|compare')}</p>
    {/if}
  </section>
{/if}

<style>
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
  }
  @media (max-width: 860px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .cmp {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ch {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 8px;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ch small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip.on {
    border-color: var(--line-strong, var(--line));
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
  }
  .ca {
    padding-right: 6px;
    cursor: default;
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .x {
    display: inline-flex;
    padding: 2px;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .add .sel {
    min-height: 36px;
    max-width: 100%;
    border-radius: 999px;
    font-size: var(--fs-small);
  }
  .tsel .sel {
    max-width: 100%;
  }
  .tsel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 100%;
  }
  .pl {
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  svg {
    width: 100%;
    height: auto;
  }
  .base {
    stroke: var(--line);
  }
  .now,
  .al {
    fill: none;
    stroke: var(--l1);
    stroke-width: 2.5;
  }
  .prev {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 2;
    stroke-dasharray: 5 4;
  }
  .dot,
  circle.dot {
    fill: var(--l1);
  }
  .xl {
    display: flex;
    justify-content: space-between;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .lsw {
    display: inline-block;
    width: 16px;
    height: 3px;
    border-radius: 2px;
    background: var(--l1);
  }
  .lsw.prev {
    background: none;
    border-top: 2px dashed var(--ink-3);
    height: 0;
  }
  .say {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  th,
  td {
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
    text-align: right;
  }
  td {
    white-space: nowrap;
  }
  th[scope='row'],
  thead th:first-child {
    text-align: left;
    font-weight: 500;
    overflow-wrap: break-word;
  }
  thead th {
    color: var(--ink-3);
    font-weight: 500;
  }
</style>
