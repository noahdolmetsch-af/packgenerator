<script>
  /**
   * «Eigenes Diagramm» (Noah 27.10.2026 «1a 2a 3a und b möglich 4a 5a», mockups D1, D2, D3, D6), at the top
   * of Analyse: up to 6 values from every area on one time axis. Each value its own row with its own scale
   * («Untereinander», the start), or all in one picture measured from their own mean («Übereinander»).
   * Period 30 days, 90 days, a year or your own, back with ‹ ›; one point per day, week or month. Trips
   * as a band over every row. A tap on a day draws a line through all rows and shows that day with every
   * value. The order: arrows and drag. Your choice stays on this device. Only to look at, nothing is rated.
   * The filters (D4) and «Was hängt zusammen?» (D5) come in the next steps. Rules in lib/analyse/diagram.js.
   */
  import { ChevronLeft, ChevronRight, X, Plus, ArrowUpDown, Filter, Check } from '@lucide/svelte';
  import Seg from '../../lib/ui/Seg.svelte';
  import SortArrows from '../../lib/ui/SortArrows.svelte';
  import SortGrip from '../../lib/ui/SortGrip.svelte';
  import { sortable } from '../../lib/ui/sortable.js';
  import ValuePicker from './ValuePicker.svelte';
  import DaySheet from './DaySheet.svelte';
  import FilterSheet from './FilterSheet.svelte';
  import Zusammenhang from './Zusammenhang.svelte';
  import { strongest, afterTicks, strengthOf } from '../../lib/analyse/links.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { tripBands } from '../../lib/analyse/detail.js';
  import { DPERIODS, DEFAULT_DPERIOD, STEPS, MODES, DEFAULT_KEYS, SERIES_COLORS, MAX_VALUES, diagramWindow, stepBuckets, seriesOf, rolling7, rangeOf, fromMean, toggleKey, moveKey, cleanFilter, filterCount, keepOf, bothKeep, dropOutliers, tripDaySet, tickDays, FELT_HI, FELT_LO } from '../../lib/analyse/diagram.js';
  import { tripEnd } from '../../lib/tripstate.js';
  import { addDays } from '../../lib/analyse.js';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { groups = [], byKey = new Map(), trips = [], acts = [], log = [], today } = $props();

  const LS = 'pg.analyse.diagramm';
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LS) ?? '{}') ?? {};
    } catch {
      return {};
    }
  })();
  let keys = $state(Array.isArray(saved.keys) ? saved.keys.slice(0, MAX_VALUES) : null);
  let period = $state(DPERIODS.some((p) => p.key === saved.period) ? saved.period : DEFAULT_DPERIOD);
  let step = $state(STEPS.includes(saved.step) ? saved.step : 'day');
  let mode = $state(MODES.includes(saved.mode) ? saved.mode : 'rows');
  let own = $state(saved.own && typeof saved.own === 'object' ? { from: saved.own.from ?? '', to: saved.own.to ?? '' } : { from: '', to: '' });
  let recent = $state(Array.isArray(saved.recent) ? saved.recent.slice(0, 8) : []);
  // every value keeps its colour while it is in the diagram, also when the order changes
  let colors = $state(saved.colors && typeof saved.colors === 'object' ? { ...saved.colors } : {});
  let back = $state(0);
  let picked = $state(null);
  let showDay = $state(false);
  let picking = $state(false);
  let sorting = $state(false);
  // D4: one filter for everything, and on wish one more per value («3a und b»)
  let filter = $state(cleanFilter(saved.filter));
  let rowFilters = $state(Object.fromEntries(Object.entries(saved.rowFilters && typeof saved.rowFilters === 'object' ? saved.rowFilters : {}).map(([k, f]) => [k, cleanFilter(f)])));
  let mark = $state(typeof saved.mark === 'string' ? saved.mark : null);
  let band = $state(saved.band !== false);
  let filtering = $state(null); // null, 'all' or a value key

  // a new diagram starts with sleep, resting pulse, active zone minutes, bike km and energy (the ones you have)
  const shownKeys = $derived((keys ?? DEFAULT_KEYS).filter((k) => byKey.has(k) && !byKey.get(k).later));
  $effect(() => {
    try {
      localStorage.setItem(LS, JSON.stringify({ keys, period, step, mode, own, recent, colors, filter, rowFilters, mark, band }));
    } catch {
      /* a private window: only for now */
    }
  });

  const win = $derived(diagramWindow(period, today, back, own));
  const buckets = $derived(stepBuckets(win.days, step));
  const idxOfDay = $derived(new Map(buckets.flatMap((b, i) => b.days.map((d) => [d, i]))));
  const colorMap = $derived.by(() => {
    const out = {};
    for (const k of shownKeys) if (SERIES_COLORS.includes(colors[k])) out[k] = colors[k];
    for (const k of shownKeys) if (!out[k]) out[k] = SERIES_COLORS.find((c) => !Object.values(out).includes(c)) ?? SERIES_COLORS[0];
    return out;
  });
  $effect(() => {
    if (JSON.stringify(colorMap) !== JSON.stringify(colors)) colors = colorMap;
  });
  // what the filters need: the ticked days, the trip days, «Wi gaht's?»
  const ticks = $derived(tickDays(log));
  const tripDays = $derived(tripDaySet(trips, tripEnd));
  const fctx = $derived({ ticks, tripDays, felt: (part, d) => byKey.get(`felt:${part}`)?.get(d) ?? null });
  const keepAll = $derived(keepOf(filter, fctx));
  const keptDays = $derived(win.days.filter(keepAll).length);
  const actList = $derived(
    [...acts]
      .map((a) => ({ id: a.id, name: actName(a), n: ticks.get(a.id)?.size ?? 0 }))
      .sort((a, b) => b.n - a.n),
  );
  const markIdx = $derived(mark ? new Set([...(ticks.get(mark) ?? [])].map((d) => idxOfDay.get(d)).filter((i) => i != null)) : new Set());
  // «Was auffällt» (D1): the two strongest links among the values of the diagram (an activity may lead)
  const notice = $derived.by(() => {
    const items = [...shownKeys.map((k) => byKey.get(k)), ...actList.slice(0, 6).map((a) => byKey.get(`act:${a.id}`))].filter((it) => it?.get).map((it) => ({ ...it, group: it.group }));
    const ys = new Set(shownKeys);
    return strongest(items, win.days, { keep: keepAll, top: 8 })
      .filter((l) => ys.has(l.y) && strengthOf(l.r) !== 'weak')
      .slice(0, 2)
      .map((l) => {
        const x = byKey.get(l.x);
        const y = byKey.get(l.y);
        const when = t(OFF_NAMES[l.offset]);
        if (x.tick) {
          const a = afterTicks(win.days, ticks.get(l.x.slice(4)) ?? new Set(), y.get, l.offset, keepAll);
          if (a) {
            const diff = y.key === 'sleep' ? `${num(Math.round(Math.abs(a.diff)))} min` : `${valueText(y, Math.abs(a.diff), num)}${unitText(y) ? ` ${unitText(y)}` : ''}`;
            return t(a.diff > 0 ? 'After {x} days {y} is {diff} higher {when} on average ({k} of {n}).|link' : 'After {x} days {y} is {diff} lower {when} on average ({k} of {n}).|link', { x: x.name, y: y.name, diff, when, k: a.diff > 0 ? a.above : a.n - a.above, n: a.n });
          }
        }
        return t(l.r > 0 ? 'On days with more {x}, {y} is a little higher {when}.|link' : 'On days with more {x}, {y} is a little lower {when}.|link', { x: x.name, y: y.name, when });
      });
  });
  const OFF_NAMES = { 0: 'the same day|link', 1: 'the day after (night after)|link', 2: 'two days later|link' };
  const rows = $derived(
    shownKeys.map((k) => {
      const it = byKey.get(k);
      const own = rowFilters[k] && filterCount(rowFilters[k]) ? rowFilters[k] : null;
      const keep = bothKeep(keepAll, own ? keepOf(own, fctx) : null);
      let vals = seriesOf(buckets, it.get, { sum: !!it.sum, keep });
      if (filter.outliers || own?.outliers) vals = dropOutliers(vals);
      const bars = !!(it.sum || it.bars);
      return { it, own, color: colorMap[k], vals, bars, smooth: !bars && step === 'day' ? rolling7(vals) : null, sc: rangeOf(vals, bars), over: fromMean(vals) };
    }),
  );
  const overSc = $derived.by(() => {
    const all = rows.flatMap((r) => r.over).filter((v) => v != null);
    const m = Math.max(10, ...all.map((v) => Math.abs(v)));
    return { lo: -m, hi: m };
  });
  const bands = $derived(!band ? [] : tripBands(trips, win.days, tripEnd).map((b) => ({ ...b, a: idxOfDay.get(b.from) ?? 0, b: idxOfDay.get(b.to) ?? 0 })));
  const pickIdx = $derived(picked ? (idxOfDay.get(picked) ?? -1) : -1);

  const W = 1000;
  const RH = 80;
  const OH = 240;
  const n = $derived(Math.max(buckets.length, 1));
  const xOf = (i) => ((i + 0.5) / n) * W;
  const yOf = (v, s, h) => h - 4 - ((v - s.lo) / (s.hi - s.lo || 1)) * (h - 10);
  const pathOf = (vals, s, h) => {
    let d = '';
    let open = false;
    vals.forEach((v, i) => {
      if (v == null) return void (open = false);
      d += `${open ? 'L' : 'M'}${xOf(i).toFixed(1)} ${yOf(v, s, h).toFixed(1)}`;
      open = true;
    });
    return d;
  };
  const barW = $derived(Math.max(1.5, W / n - (n > 120 ? 1 : 3)));

  function tap(e) {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.max(0, Math.min(buckets.length - 1, Math.floor(((e.clientX - r.left) / r.width) * buckets.length)));
    open(buckets[i]?.days.at(-1));
  }
  function open(day) {
    if (!day) return;
    picked = day;
    showDay = true;
  }

  // texts
  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const short = (d) => dfmt(d, { day: 'numeric', month: 'short' });
  const PNAMES = { '30': '30 d|diagram', '90': '90 d|diagram', '365': 'Year|analyse', own: 'Own|diagram' };
  const periodOpts = $derived(DPERIODS.map((p) => ({ key: p.key, name: t(PNAMES[p.key]) })));
  const stepOpts = $derived([
    { key: 'day', name: t('Day|diagram') },
    { key: 'week', name: t('Week|diagram') },
    { key: 'month', name: t('Month|diagram') },
  ]);
  const modeOpts = $derived([
    { key: 'rows', name: t('Under each other|diagram') },
    { key: 'over', name: t('On top of each other|diagram') },
  ]);
  const SRC = { fitbit: 'Fitbit', strava: 'Strava', body: 'Body|group', check: "Wi gaht's?|analyse", aktiv: 'Aktiv' };
  const xticks = $derived.by(() => {
    const k = Math.min(4, buckets.length);
    if (!k) return [];
    return Array.from({ length: k }, (_, j) => Math.round((j * (buckets.length - 1)) / Math.max(k - 1, 1))).map((i) => ({ i, text: step === 'month' ? dfmt(`${buckets[i].key}-01`, { month: 'short', year: '2-digit' }) : short(buckets[i].key) }));
  });
  const rangeText = $derived(`${short(win.from)} – ${dfmt(win.to, { day: 'numeric', month: 'short', year: 'numeric' })}`);
  const v = (it, val) => valueText(it, val, num);
  const tripOn = (d) => trips.find((tr) => tr.startDate && tr.startDate <= d && (tripEnd(tr) ?? tr.startDate) >= d);

  // the set parts of a filter as chips: the text and what × sets back
  const wdText = (wd) => {
    const runs = [];
    for (const d of wd) {
      const last = runs.at(-1);
      if (last && d === last[1] + 1) last[1] = d;
      else runs.push([d, d]);
    }
    const name = (i) => dfmt(addDays('2026-10-05', i), { weekday: 'short' }).replace(/\.$/, '');
    return runs.map(([a, b]) => (a === b ? name(a) : b === a + 1 ? `${name(a)}, ${name(b)}` : `${name(a)}–${name(b)}`)).join(', ');
  };
  function partsOf(f) {
    const out = [];
    const aname = (id) => actList.find((a) => a.id === id)?.name ?? '';
    if (f.wd.length) out.push({ key: 'wd', text: t('only {days}|filter', { days: wdText(f.wd) }), off: { wd: [] } });
    if (f.act) out.push({ key: 'act', text: f.act.mode === 'with' ? t('only with {name}|filter', { name: aname(f.act.id) }) : t('without {name}|filter', { name: aname(f.act.id) }), off: { act: null } });
    if (f.trip !== 'all') out.push({ key: 'trip', text: f.trip === 'only' ? t('only trip days|filter') : t('without trip days|filter'), off: { trip: 'all' } });
    if (f.felt) {
      const what = f.felt.part === 'mood' ? 'Mood' : 'Energy';
      out.push({ key: 'felt', text: f.felt.op === 'hi' ? t(`${what} ≥ {n}|filter`, { n: FELT_HI }) : t(`${what} ≤ {n}|filter`, { n: FELT_LO }), off: { felt: null } });
    }
    if (f.outliers) out.push({ key: 'out', text: t('without outliers|filter'), off: { outliers: false } });
    return out;
  }

  function toggle(k) {
    const before = keys ?? shownKeys;
    keys = toggleKey(before.filter((x) => byKey.has(x)), k);
    if (keys.includes(k)) recent = [k, ...recent.filter((x) => x !== k)].slice(0, 8);
  }
  const drop = (k) => (keys = shownKeys.filter((x) => x !== k));
  const move = (from, to) => (keys = moveKey(shownKeys, from, to));
</script>

<section class="card dg" aria-labelledby="dg-h" data-diagram data-mode={mode}>
  <div class="dh">
    <div>
      <h2 id="dg-h">{t('Own diagram|diagram')}</h2>
      <p class="sub">{t('Pick values from every area. They share one time axis.|diagram')}</p>
    </div>
  </div>

  <div class="ctl">
    <div class="pr">
      <span class="pl" id="dg-p">{t('Period|tk')}</span>
      <Seg options={periodOpts} value={period} onchange={(p) => ((period = p), (back = 0), (picked = null))} labelledby="dg-p" full={false} />
      {#if period === 'own'}
        <div class="own">
          <label>{t('From|diagram')} <input class="inp" type="date" max={today} bind:value={own.from} data-own-from /></label>
          <label>{t('To|diagram')} <input class="inp" type="date" max={today} bind:value={own.to} data-own-to /></label>
        </div>
      {:else}
        <div class="row">
          <button type="button" class="nav" aria-label={t('Earlier|analyse')} data-dg-back onclick={() => ((back += 1), (picked = null))}><ChevronLeft size={18} aria-hidden="true" /></button>
          <b class="rt" data-dg-range>{rangeText}</b>
          <button type="button" class="nav" aria-label={t('Later|analyse')} data-dg-fwd disabled={back === 0} onclick={() => ((back = Math.max(0, back - 1)), (picked = null))}><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      {/if}
    </div>
    <div class="pr">
      <span class="pl" id="dg-s">{t('One point per|diagram')}</span>
      <Seg options={stepOpts} value={step} onchange={(s) => ((step = s), (picked = null))} labelledby="dg-s" full={false} />
    </div>
    <div class="pr">
      <span class="pl" id="dg-m">{t('Show|analyse')}</span>
      <Seg options={modeOpts} value={mode} onchange={(m) => (mode = m)} labelledby="dg-m" full={false} />
    </div>
  </div>

  <div class="chips" role="group" aria-label={t('Filter|filter')}>
    <button type="button" class="chip fbtn" class:set={filterCount(filter)} data-dg-filter onclick={() => (filtering = 'all')}><Filter size={14} aria-hidden="true" />{t('Filter|filter')}{#if filterCount(filter)}&nbsp;· {filterCount(filter)}{/if}</button>
    {#each partsOf(filter) as part (part.key)}
      <span class="chip on" data-dg-part={part.key}>{part.text}<button type="button" class="x" aria-label={t('Remove {name}|analyse', { name: part.text })} onclick={() => (filter = { ...filter, ...part.off })}><X size={14} aria-hidden="true" /></button></span>
    {/each}
    {#if trips.length}<button type="button" class="chip" class:on={band} aria-pressed={band} data-dg-band onclick={() => (band = !band)}>{t('Trips as a band|filter')}{#if band}<Check size={14} aria-hidden="true" />{/if}</button>{/if}
    {#if mark}<span class="chip on" data-dg-mark>{t('{name} days marked|filter', { name: actList.find((a) => a.id === mark)?.name ?? '' })}<button type="button" class="x" aria-label={t('Remove {name}|analyse', { name: t('Mark days|filter') })} onclick={() => (mark = null)}><X size={14} aria-hidden="true" /></button></span>{/if}
  </div>
  {#if filterCount(filter)}<p class="hint" data-dg-kept>{t('{n} of {all} days fit the filter. Days left out stay a gap, so the time stays true.|filter', { n: keptDays, all: win.days.length })}</p>{/if}

  <div class="chips" role="group" aria-label={t('Values in the diagram|diagram')}>
    {#each rows as r (r.it.key)}
      <span class="chip on" data-dg-value={r.it.key}><i class="dot" style="background:{r.color}"></i>{r.it.name}<small>{t(SRC[r.it.src] ?? SRC.body)}</small><button type="button" class="x" aria-label={t('Remove {name}|analyse', { name: r.it.name })} onclick={() => drop(r.it.key)}><X size={14} aria-hidden="true" /></button></span>
    {/each}
    {#if shownKeys.length < MAX_VALUES}<button type="button" class="chip add" data-dg-add onclick={() => (picking = true)}><Plus size={14} aria-hidden="true" />{t('Value|analyse')}</button>{/if}
    {#if shownKeys.length > 1}<button type="button" class="chip" class:on={sorting} aria-pressed={sorting} data-dg-sort onclick={() => (sorting = !sorting)}><ArrowUpDown size={14} aria-hidden="true" />{t('Order|diagram')}</button>{/if}
  </div>

  {#if sorting && shownKeys.length > 1}
    <ul class="sortlist" use:sortable={{ onmove: move }} data-dg-order>
      {#each rows as r, i (r.it.key)}
        <li data-sort-id={r.it.key}>
          <SortGrip name={r.it.name} onstep={(d) => move(i, i + d)} />
          <i class="dot" style="background:{r.color}"></i><span class="nm">{r.it.name}</span>
          <SortArrows name={r.it.name} {i} n={rows.length} onstep={(d) => move(i, i + d)} />
        </li>
      {/each}
    </ul>
  {/if}

  {#if !rows.length}
    <p class="hint" role="status">{t('No value in the diagram yet. Add one with «+ Value».|diagram')}</p>
  {:else}
    <div class="plotwrap">
      {#if mode === 'rows'}
        {#each rows as r (r.it.key)}
          <div class="rowp" data-dg-row={r.it.key}>
            <div class="rlw"><p class="rl"><b>{r.it.name}</b>{#if unitText(r.it)}&nbsp;{unitText(r.it)}{/if} · {t(SRC[r.it.src] ?? SRC.body)}{#if r.smooth}&nbsp;· {t('7-day mean|diagram')}{/if}{#if r.own}&nbsp;· <span class="ownf">{partsOf(r.own).map((p) => p.text).join(', ')}</span>{/if}</p><button type="button" class="rf" class:set={r.own} aria-label={t('Filter for {name}|filter', { name: r.it.name })} data-dg-row-filter={r.it.key} onclick={() => (filtering = r.it.key)}><Filter size={13} aria-hidden="true" /></button></div>
            <div class="pl2">
              <div class="ax" aria-hidden="true"><span>{v(r.it, r.sc.hi)}</span><span>{v(r.it, r.sc.lo)}</span></div>
              <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
              <svg viewBox="0 0 {W} {RH}" preserveAspectRatio="none" role="img" aria-label={t('Course of {name}|analyse', { name: r.it.name })} onclick={tap}>
                {#each bands as b (b.from)}<rect class="band" x={(b.a / n) * W} width={((b.b - b.a + 1) / n) * W} y="0" height={RH} />{/each}
                <line class="base" x1="0" x2={W} y1={RH - 4} y2={RH - 4} vector-effect="non-scaling-stroke" />
                {#each [...markIdx] as mi (mi)}<circle class="mk" cx={xOf(mi)} cy={RH - 2} r="2.4" />{/each}
                {#if r.bars}
                  {#each r.vals as val, i (i)}{#if val != null}<rect x={xOf(i) - barW / 2} width={barW} y={yOf(val, r.sc, RH)} height={Math.max(0.5, RH - 4 - yOf(val, r.sc, RH))} style="fill:{r.color}" class="bar" />{/if}{/each}
                {:else}
                  <path class="raw" d={pathOf(r.vals, r.sc, RH)} style="stroke:{r.color}" vector-effect="non-scaling-stroke" />
                  {#if r.smooth}<path class="smooth" d={pathOf(r.smooth, r.sc, RH)} style="stroke:{r.color}" vector-effect="non-scaling-stroke" />{/if}
                {/if}
                {#if pickIdx >= 0}<line class="pick" x1={xOf(pickIdx)} x2={xOf(pickIdx)} y1="0" y2={RH} vector-effect="non-scaling-stroke" />{/if}
              </svg>
              {#if pickIdx >= 0}<span class="pv" class:end={pickIdx / n > 0.75} style="left:calc(56px + (100% - 56px) * {xOf(pickIdx) / W})" data-dg-pv>{v(r.it, r.vals[pickIdx])}{#if unitText(r.it) && r.vals[pickIdx] != null}&nbsp;{unitText(r.it)}{/if}</span>{/if}
            </div>
          </div>
        {/each}
      {:else}
        <div class="pl2 over">
          <div class="ax" aria-hidden="true"><span>+{Math.round(overSc.hi)} %</span><span>{t('mean|diagram')}</span><span>−{Math.round(overSc.hi)} %</span></div>
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
          <svg viewBox="0 0 {W} {OH}" preserveAspectRatio="none" role="img" aria-label={t('All values, measured from their own mean|diagram')} onclick={tap}>
            {#each bands as b (b.from)}<rect class="band" x={(b.a / n) * W} width={((b.b - b.a + 1) / n) * W} y="0" height={OH} />{/each}
            <line class="base" x1="0" x2={W} y1={yOf(0, overSc, OH)} y2={yOf(0, overSc, OH)} vector-effect="non-scaling-stroke" />
            {#each rows as r (r.it.key)}
              <path class="smooth" d={pathOf(step === 'day' ? rolling7(r.over) : r.over, overSc, OH)} style="stroke:{r.color}" vector-effect="non-scaling-stroke" />
            {/each}
            {#if pickIdx >= 0}<line class="pick" x1={xOf(pickIdx)} x2={xOf(pickIdx)} y1="0" y2={OH} vector-effect="non-scaling-stroke" />{/if}
          </svg>
        </div>
      {/if}
      <div class="xl" aria-hidden="true">
        {#each xticks as tk (tk.i)}<span style="left:calc(56px + (100% - 56px) * {xOf(tk.i) / W})">{tk.text}</span>{/each}
      </div>
    </div>
    {#if mode === 'over'}<p class="hint">{t('Each line shows how far a value is above or below its own mean in this period; the numbers are in the rows view.|diagram')}</p>{/if}
    <ul class="legend">
      {#if bands.length}<li><i class="lsw band"></i>{bands.map((b) => b.name).join(', ')}</li>{/if}
      {#if picked}<li><i class="lsw pk"></i>{dfmt(picked, { weekday: 'short', day: 'numeric', month: 'short' })} ({t('tapped|diagram')})</li>{/if}
    </ul>
    <p class="hint">{t('Tap a day: a line through every row and the day with all its values.|diagram')}</p>
    {#if notice.length}<p class="notice" data-dg-notice><b>{t('What stands out|link')}</b> ({t('only an observation|link')}): {notice.join(' ')}</p>{/if}
    <div class="sr">
      {#each buckets as b, i (b.key)}{#if rows.some((r) => r.vals[i] != null)}<button type="button" onclick={() => open(b.days.at(-1))}>{short(b.days.at(-1))}</button>{/if}{/each}
    </div>
  {/if}
</section>

<Zusammenhang {groups} {byKey} days={win.days} keep={keepAll} {ticks} acts={actList} onday={open} />

{#if picking}
  <ValuePicker {groups} keys={shownKeys} {recent} ontoggle={toggle} onclose={() => (picking = false)} />
{/if}
{#if filtering}
  {@const one = filtering !== 'all' ? byKey.get(filtering) : null}
  <FilterSheet
    filter={one ? (rowFilters[filtering] ?? cleanFilter(null)) : filter}
    acts={actList}
    name={one?.name ?? ''}
    extra={one ? null : { mark, band }}
    count={(f) => win.days.filter(one ? bothKeep(keepAll, keepOf(f, fctx)) : keepOf(f, fctx)).length}
    onapply={(f, x) => {
      if (one) rowFilters = { ...rowFilters, [filtering]: cleanFilter(f) };
      else {
        filter = cleanFilter(f);
        mark = x?.mark || null;
        band = x?.band !== false;
      }
    }}
    onclose={() => (filtering = null)}
  />
{/if}
{#if showDay && picked}
  <DaySheet day={picked} {groups} {today} tripName={tripOn(picked)?.name ?? ''} onday={(d) => (picked = d)} onclose={() => (showDay = false)} />
{/if}

<style>
  .dg {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .dh h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sub {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ctl {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
    align-items: flex-start;
  }
  .pr {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .pl {
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .rt {
    color: var(--ink);
    font-size: var(--fs-small);
  }
  .own {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .own label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .nav {
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .nav:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
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
  .chip small {
    color: var(--ink-3);
    font-weight: 400;
    font-size: var(--fs-label);
  }
  .fbtn.set {
    border-color: var(--hi);
    background: var(--hi);
    color: var(--hi-ink);
    font-weight: 600;
  }
  .rf {
    flex: none;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .rf.set {
    border-color: var(--hi);
    color: var(--hi);
  }
  @media (pointer: coarse) {
    .rf {
      width: 40px;
      height: 40px;
    }
  }
  .ownf {
    color: var(--hi);
  }
  .mk {
    fill: var(--pz5);
  }
  .chip.add {
    border-style: dashed;
  }
  .x {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-right: -6px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  @media (pointer: coarse) {
    .chip {
      min-height: 44px;
    }
    .x {
      width: 36px;
      height: 36px;
    }
  }
  .dot {
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .sortlist {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sortlist li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
  }
  .sortlist .nm {
    flex: 1;
    min-width: 0;
  }
  .plotwrap {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .rowp {
    display: flex;
    flex-direction: column;
  }
  .rlw {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 4px 0 0 56px;
  }
  .rl {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .rl b {
    color: var(--ink);
    font-weight: 600;
  }
  .pl2 {
    position: relative;
    display: flex;
    align-items: stretch;
  }
  .ax {
    flex: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 52px;
    padding-right: 4px;
    white-space: nowrap;
    color: var(--ink-3);
    font-size: var(--fs-label);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  svg {
    flex: 1;
    min-width: 0;
    height: 80px;
    cursor: pointer;
  }
  .over svg {
    height: 240px;
  }
  .band {
    fill: var(--pz4);
    fill-opacity: 0.16;
  }
  .base {
    stroke: var(--line);
    stroke-width: 1;
  }
  .raw {
    fill: none;
    stroke-width: 1;
    stroke-opacity: 0.45;
  }
  .smooth {
    fill: none;
    stroke-width: 2.2;
    stroke-linejoin: round;
  }
  [data-mode='rows'] .bar {
    fill-opacity: 0.7;
  }
  .pick {
    stroke: var(--ink);
    stroke-width: 1.2;
    stroke-dasharray: 3 3;
  }
  .pv {
    position: absolute;
    top: 2px;
    padding: 0 4px;
    border-radius: 4px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-label);
    font-weight: 600;
    white-space: nowrap;
    transform: translateX(6px);
    pointer-events: none;
  }
  .pv.end {
    transform: translateX(calc(-100% - 6px));
  }
  .xl {
    position: relative;
    height: 18px;
    color: var(--ink-3);
    font-size: var(--fs-label);
  }
  .xl span {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .xl span:first-child {
    transform: none;
  }
  .xl span:last-child {
    transform: translateX(-100%);
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
    width: 14px;
    height: 10px;
    border-radius: 2px;
  }
  .lsw.band {
    background: var(--pz4);
    opacity: 0.35;
  }
  .lsw.pk {
    width: 0;
    height: 12px;
    border-left: 1.5px dashed var(--ink);
  }
  .notice {
    margin: 0;
    padding: 10px 12px;
    border: 1px dashed var(--line);
    border-radius: 10px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .notice b {
    color: var(--ink);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
