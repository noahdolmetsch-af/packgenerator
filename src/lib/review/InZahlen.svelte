<script>
  /**
   * SN4+ SN4f-a «In Zahlen» (mockup approved 13.10.2026, answers 1a, 4a, 5a): under the table of «Vergangene
   * Touren», 10 blocks in 4 groups. Only the first group is open at first; a closed group shows one line with
   * its main numbers. The app remembers which groups are open and which blocks are off (settings
   * 'pastView'); «Blöcke» switches single blocks off and on. Every block reads the rows of the table
   * (period and filters, 5a), except V6 «Zum Vorjahr» (1 January up to today against last year, 4a). A block
   * without data shows a quiet line, never an empty chart. Heart rate only to look at: no colour for good
   * or bad, no judging words.
   *
   * rows: the facts of the table; facts: all facts (for V6); vals: { [id]: inzahlen.js rowValues() };
   * mode: '12m' | 'year' | 'all'; scope: the words of the period and filters; view: inzahlen.js viewOf();
   * onview(view) saves; hrefOf(id) / go(id) open a trip.
   * SN4h (Touren › Übersicht, Noah 13.10.2026 «SN4g–SN4i freigegeben», answer 2): with tours the five groups of
   * pastcols.js TOUR_GROUPS / TOUR_BLOCKS (the SN2 plus and Rückblick blocks added, the map V7 is the tile
   * DG-O5 below): every group open at first, its numbers in its head, a jump bar that stays on top while
   * scrolling, «Alle zuklappen» and «Blöcke». states: review/state.js factStates (for C1).
   */
  import { t, tn, num, nameOf, locale } from '../i18n.svelte.js';
  import { n0, n1, hours, kg, monthLong, dayLong, signedNum, signedHours, DASH } from './fmt.js';
  import { hm } from '../gpx.js';
  import { BLOCKS as PAST_BLOCKS, GROUPS as PAST_GROUPS, toggled, monthsOf, monthSums, bestValues, lastYear, whenBuckets, PARTS, routeMap, perBike, packStats, zoneMonths, weatherSum, footprint, heartAll } from './inzahlen.js';
  import { bikeTypeName } from '../bikes.js';
  import RouteMap from './RouteMap.svelte';
  import { backClose } from '../ui/backclose.js';
  import './zones.css';
  import { LayoutGrid, Route, Bike, HeartPulse, Trophy, ChevronDown, ChevronUp, ChartColumn, Map as MapIcon, Clock, Backpack, Medal, CalendarRange, CloudRain, Leaf, X, Undo2 } from '@lucide/svelte';
  // SN4h: the blocks of Touren › Übersicht
  import { TOUR_BLOCKS, TOUR_GROUPS } from './pastcols.js';
  import { valueMonths, newestOf, rowsGrid, wearPerBike, compareGroups } from './tourzahlen.js';
  import { plannedRidden, SURFACES } from './werte.js';
  import { Gauge, Wrench, GitCompareArrows, ChevronsUp, ChevronsDown } from '@lucide/svelte';

  let { rows = [], facts = [], vals = {}, mode = '12m', today, scope = '', bikes = [], items = [], containers = [], entries = [], view, onview, hrefOf = () => null, go = () => {}, tours = false, states = {} } = $props();

  // SN4h: the lists of the page (Vergangene Touren: 10 blocks in 4 groups; Touren: 15 blocks in 5 groups)
  const BLOCKS = $derived(tours ? TOUR_BLOCKS : PAST_BLOCKS);
  const GROUPS = $derived(tours ? TOUR_GROUPS : PAST_GROUPS);
  const BLOCK_KEYS = $derived(BLOCKS.map((b) => b.key));
  const WIDE = $derived(tours ? ['T3', 'U2'] : ['V10']);
  const GICON = { dist: Route, tempo: Gauge, bikes: Bike, body: HeartPulse, records: Trophy };
  const BICON = { V1: ChartColumn, V7: MapIcon, V10: Clock, V3: Bike, V12: Backpack, V8: HeartPulse, V2: Medal, V6: CalendarRange, V9: CloudRain, V11: Leaf, T1: Gauge, T2: Bike, T3: Clock, U2: Wrench, P1: HeartPulse, C1: GitCompareArrows };
  const on = (k) => !view.off.includes(k);
  const blocksOf = (g) => BLOCKS.filter((b) => b.group === g && on(b.key));

  /* ---- the numbers (pure, inzahlen.js) ---- */
  const months = $derived(monthsOf(mode, today, rows));
  const sums = $derived(monthSums(rows, months));
  const kmTop = $derived(Math.max(0, ...sums.map((m) => m.km)) || 1);
  const gainTop = $derived(Math.max(0, ...sums.map((m) => m.gainM)) || 1);
  const newest = $derived(sums.findLast((m) => m.n)?.ym ?? null);
  const best = $derived(bestValues(rows));
  const ly = $derived(lastYear(facts, today));
  const starts = $derived(Object.fromEntries(rows.map((r) => [r.id, vals[r.id]?.startAt ?? null])));
  const when = $derived(whenBuckets(rows, starts));
  const dayTop = $derived(Math.max(0, ...when.days) || 1);
  const partTop = $derived(Math.max(0, ...PARTS.map((p) => when.parts[p])) || 1);
  const map = $derived(routeMap(rows));
  const bikesRows = $derived(perBike(rows, bikes));
  const pack = $derived(packStats(rows, items, containers, bikes));
  const zoneOf = $derived(Object.fromEntries(rows.map((r) => [r.id, vals[r.id]?.zones ? vals[r.id].zones.map((z) => z.s) : null])));
  const zm = $derived(zoneMonths(rows, months, zoneOf));
  const zoneAll = $derived(zm.reduce((s, m) => s + m.zoneS, 0));
  const zTop = $derived(Math.max(0, ...zm.map((m) => m.zoneS)) || 1);
  const heart = $derived(heartAll(rows, entries));
  const wx = $derived(weatherSum(rows));
  const foot = $derived(footprint(rows));
  const kmAll = $derived(sums.reduce((s, m) => s + m.km, 0));
  // SN4h: the SN2 plus and Rückblick blocks over the rows (tourzahlen.js); only computed on Touren
  const vm = $derived(tours ? valueMonths(rows, months, vals) : []);
  const vmTop = (key) => Math.max(0, ...vm.map((m) => m[key] ?? 0)) || 1;
  const vmAny = (key) => vm.some((m) => m[key] != null);
  const grid = $derived(tours ? rowsGrid(rows, vals, bikes) : []);
  const pr = $derived(tours ? plannedRidden(rows) : { rows: [], avgMin: null });
  const wear = $derived(tours ? wearPerBike(rows, bikes, vals) : []);
  const cmp = $derived(tours ? compareGroups(rows, bikes, states) : []);
  const wattRows = $derived(rows.filter((r) => vals[r.id]?.watts).length);
  const PART_NAME = { chain: 'Chain', tyres: 'Tyres', pads: 'Brake pads' };
  const P1_ROWS = [
    { key: 'hrAvg', name: 'Ø heart rate', unit: 'bpm' },
    { key: 'hrMax', name: 'Highest heart rate', unit: 'bpm' },
    { key: 'wAvg', name: 'Ø power', unit: 'W' },
    { key: 'wMax', name: 'Max. power', unit: 'W' },
  ];
  const gainAll = $derived(sums.reduce((s, m) => s + m.gainM, 0));

  // with many months only the newest and the highest month carry their number (the others in the title)
  const label = (m, key) => (sums.length <= 6 || m.ym === newest || m[key] === Math.max(...sums.map((x) => x[key])) ? n0(m[key]) : '');
  const letter = (ym) => new Date(`${ym}-15T12:00:00`).toLocaleDateString(locale(), { month: 'narrow' });
  const wday = (i) => new Date(Date.UTC(2026, 0, 5 + i, 12)).toLocaleDateString(locale(), { weekday: 'short', timeZone: 'UTC' }).replace(/\.$/, '');
  const PART = { morning: ['Morning', 'before 12'], afternoon: ['Afternoon', '12–17'], evening: ['Evening', 'from 17'] };
  const typeName = (type) => (type ? t(bikeTypeName(type)) : '');
  const LYNAME = { trips: 'Trips|place', km: 'km', gainM: 'Climbing|hm', movingH: 'Hours in motion' };
  const lyVal = (key, v) => (v == null ? DASH : key === 'movingH' ? hours(v) : n0(v));

  /** The line of a closed group: its main numbers and how many blocks. */
  const summary = (g) => {
    const n = blocksOf(g).length;
    const nb = tn(n, '{n} block', '{n} blocks');
    if (g === 'dist') return [rows.length ? `${n0(kmAll)} km · ${n0(gainAll)} ${t('Hm|col')}` : '', nb];
    if (g === 'bikes') return [bikesRows[0] ? `${bikesRows[0].name} ${tn(bikesRows[0].n, '{n} trip', '{n} trips')}` : '', pack.avgG ? t('Ø {kg} luggage', { kg: kg(pack.avgG) }) : '', nb];
    if (g === 'body') return [zoneAll ? t('{h} h with heart rate', { h: hm(zoneAll / 3600) }) : heart ? `${t('Ø heart rate')} ${num(heart.avg)}` : '', tours ? tn(wattRows, '{n} trip with power values', '{n} trips with power values') : '', nb];
    if (g === 'tempo') {
      const k = vm.filter((m) => m.kmh != null);
      const avg = k.length ? Math.round((k.reduce((s, m) => s + m.kmh, 0) / k.length) * 10) / 10 : null;
      return [avg != null ? t('Ø {kmh} km/h in motion', { kmh: n1(avg) }) : '', pr.avgMin != null ? t('on average {n} min beside the plan', { n: num(pr.avgMin) }) : '', nb];
    }
    return [blocksOf(g).map((b) => t(b.name)).join(' · '), nb];
  };
  const isOpen = (g) => view.open.includes(g);
  const setView = (patch) => onview?.({ ...view, ...patch });
  // SN4h: the jump bar opens a group and scrolls to it; «Alle zuklappen» / «Alle aufklappen»
  const shownGroups = $derived(GROUPS.filter((g) => blocksOf(g.key).length));
  const anyOpen = $derived(shownGroups.some((g) => isOpen(g.key)));
  function jumpTo(g) {
    if (!isOpen(g)) setView({ open: [...view.open, g] });
    requestAnimationFrame(() => document.getElementById(`izg-${g}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  /* ---- «Blöcke»: switch single blocks off and on ---- */
  let pick = $state(false);
  let dlg = $state();
  $effect(() => {
    if (pick && dlg && !dlg.open) dlg.showModal();
  });
</script>

{#snippet head(b, sub)}
  {@const Icon = BICON[b.key]}
  {@const shut = view.shut.includes(b.key)}
  <div class="bh">
    <span class="bic" aria-hidden="true"><Icon size={18} /></span>
    <div class="bm">
      <h4 id="bk-{b.key}">{t(b.name)}</h4>
      {#if sub}<p>{sub}</p>{/if}
    </div>
    <span class="code" aria-hidden="true">{b.key}</span>
    <button type="button" class="fold" aria-expanded={!shut} aria-label={shut ? t('Open {name}', { name: t(b.name) }) : t('Close {name}', { name: t(b.name) })} onclick={() => setView({ shut: toggled(view.shut, b.key) })}>{#if shut}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronUp size={18} aria-hidden="true" />{/if}</button>
  </div>
{/snippet}

{#snippet quiet(text)}<p class="quiet">{text}</p>{/snippet}

{#snippet trip(x, text)}
  {#if x && hrefOf(x.id)}<a class="tl" href={hrefOf(x.id)} onclick={() => go(x.id)}><span>{text}</span></a>{:else}<span>{text}</span>{/if}
{/snippet}

{#snippet block(b)}
  <article class="blk" class:wide={WIDE.includes(b.key)} data-block={b.key} aria-labelledby="bk-{b.key}">
    {#if b.key === 'V1'}
      {@render head(b, newest ? t('km and climbing · {month} last', { month: monthLong(newest) }) : t('km and climbing'))}
      {#if !view.shut.includes(b.key)}
        {#if !kmAll && !gainAll}{@render quiet(t('No rides in this period.'))}{:else}
          <div class="mscroll">
            <div class="mc" style:--n={sums.length}>
              <span class="ax">km</span>
              <ol class="bars">{#each sums as m (m.ym)}<li data-month={m.ym} data-km={m.km} title="{monthLong(m.ym)}: {n0(m.km)} km">{#if m.km}<span class="bv num">{label(m, 'km')}</span><i class="bar" class:last={m.ym === newest} style:height="{(m.km / kmTop) * 100}%"></i>{/if}</li>{/each}</ol>
              <span class="ax">{t('Climbing|hm')}</span>
              <ol class="bars">{#each sums as m (m.ym)}<li title="{monthLong(m.ym)}: {n0(m.gainM)} {t('Hm|col')}">{#if m.gainM}<span class="bv num">{label(m, 'gainM')}</span><i class="bar" class:last={m.ym === newest} style:height="{(m.gainM / gainTop) * 100}%"></i>{/if}</li>{/each}</ol>
              <ol class="ml" aria-hidden="true">{#each sums as m (m.ym)}<li>{letter(m.ym)}</li>{/each}</ol>
            </div>
          </div>
        {/if}
      {/if}
    {:else if b.key === 'V7'}
      {@render head(b, map.routes.length ? t('{trips} · stretches ridden often are stronger', { trips: tn(map.routes.length, '{n} trip', '{n} trips') }) : '')}
      {#if !view.shut.includes(b.key)}
        {#if map.routes.length}<RouteMap {map} />{:else}{@render quiet(t('No route saved yet. A GPX route or an uploaded ride draws it here.'))}{/if}
      {/if}
    {:else if b.key === 'V10'}
      {@render head(b, t('Weekday and start time'))}
      {#if !view.shut.includes(b.key)}
        {#if !rows.length}{@render quiet(t('No rides in this period.'))}{:else}
          <div class="when">
            <ol class="wd" aria-label={t('Trips per weekday')}>
              {#each when.days as n, i (i)}<li data-day={i}><span class="bv num">{n || ''}</span><i class="bar" class:none={!n} style:height="{n ? Math.max(6, (n / dayTop) * 100) : 0}%"></i><small>{wday(i)}</small></li>{/each}
            </ol>
            <ul class="parts">
              {#each PARTS as p (p)}
                <li data-part={p}><span class="pn">{t(PART[p][0])}<small>{t(PART[p][1])}</small></span><span class="track"><i style:width="{(when.parts[p] / partTop) * 100}%"></i></span><b class="num">{num(when.parts[p])}</b></li>
              {/each}
            </ul>
          </div>
          <p class="foot">{t('Start time from Strava or GPX.')}{when.without.length ? ` ${t('Without a start time: {names}.', { names: when.without.join(', ') })}` : ''}</p>
        {/if}
      {/if}
    {:else if b.key === 'V3'}
      {@render head(b, t('Trips, km and hours in motion'))}
      {#if !view.shut.includes(b.key)}
        {#if !bikesRows.length}{@render quiet(t('No trip with a bike in this period.'))}{:else}
          <ul class="list">
            {#each bikesRows as x (x.id)}
              <li data-bike={x.id}>
                <span class="ln"><b>{x.name}</b>{#if x.type}<small>{typeName(x.type)}</small>{/if}</span>
                <span class="lv num">{tn(x.n, '{n} trip', '{n} trips')} · {n0(x.km)} km · {hours(x.h)} h</span>
                <span class="share" aria-hidden="true"><i style:width="{Math.round(x.share * 100)}%"></i></span>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    {:else if b.key === 'V12'}
      {@render head(b, t('Ø per trip and what you pack most'))}
      {#if !view.shut.includes(b.key)}
        {#if !pack.n}{@render quiet(t('No packing list in this period.'))}{:else}
          <ul class="kv">
            <li><span>{t('Ø base weight per trip')}</span><b class="num">{kg(pack.avgG)}</b></li>
            <li><span>{t('Day ride|art')}</span><b class="num">{kg(pack.dayG)}</b></li>
            <li><span>{t('Multi-day|art')}</span><b class="num">{kg(pack.multiG)}</b></li>
          </ul>
          {#if pack.top.length}
            <p class="sh">{t('Packed most often')}</p>
            <ol class="top">{#each pack.top as x (x.id)}<li><span>{nameOf(x.item)}</span><b class="num">{tn(x.n, '{n} trip', '{n} trips')}</b></li>{/each}</ol>
          {/if}
          <p class="foot">{t('Base weight: the gear in the bags and on the bike, without food, water and what you wear.')}</p>
        {/if}
      {/if}
    {:else if b.key === 'V8'}
      {@render head(b, zoneAll ? t('{h} h with heart rate · only to look at', { h: hm(zoneAll / 3600) }) : t('only to look at'))}
      {#if !view.shut.includes(b.key)}
        {#if !zoneAll}
          {@render quiet(t('No time in zones yet. It comes with the heart rate details from Strava.'))}
          {#if heart}<p class="foot">{t('Ø heart rate {avg} bpm · max. {max} bpm, from {n} rides.', { avg: num(heart.avg), max: heart.max ? num(heart.max) : DASH, n: num(heart.n) })}</p>{/if}
        {:else}
          <div class="mscroll">
            <div class="mc" style:--n={zm.length}>
              <span class="zs">{#each zm as m (m.ym)}<span class="zcol" title={monthLong(m.ym)} style:height="{m.zoneS ? Math.max(4, (m.zoneS / zTop) * 100) : 4}%">{#if m.zones}{#each [4, 3, 2, 1, 0] as i (i)}{#if m.zones[i]}<i class="zc-{i + 1}" style:flex-grow={m.zones[i]}></i>{/if}{/each}{/if}</span>{/each}</span>
              <ol class="ml" aria-hidden="true">{#each zm as m (m.ym)}<li>{letter(m.ym)}</li>{/each}</ol>
            </div>
          </div>
          <p class="foot">{t('Hours per month, Z1 below up to Z5 on top')}</p>
        {/if}
      {/if}
    {:else if b.key === 'V2'}
      {@render head(b, t('Tap one to open the trip'))}
      {#if !view.shut.includes(b.key)}
        {#if !rows.length}{@render quiet(t('No rides in this period.'))}{:else}
          <ul class="kv best">
            <li data-best="ride"><span>{t('Longest ride')}</span>{@render trip(best.ride, best.ride ? `${Number.isInteger(best.ride.value) ? n0(best.ride.value) : n1(best.ride.value)} km · ${best.ride.title}` : DASH)}</li>
            <li data-best="gain"><span>{t('Most climbing')}</span>{@render trip(best.gain, best.gain ? `${n0(best.gain.value)} ${t('Hm|col')} · ${best.gain.title}` : DASH)}</li>
            <li data-best="speed"><span>{t('Fastest average')}</span>{@render trip(best.speed, best.speed ? `${n1(best.speed.value)} km/h · ${best.speed.title}` : DASH)}</li>
            <li data-best="trip"><span>{t('Longest trip')}</span>{@render trip(best.trip, best.trip ? `${tn(best.trip.value, '{n} day', '{n} days')} · ${best.trip.title}` : DASH)}</li>
          </ul>
        {/if}
      {/if}
    {:else if b.key === 'V6'}
      {@render head(b, t('1 January to {date}, both years · always all trips', { date: dayLong(ly.to).replace(/\s\d{4}$/, '') }))}
      {#if !view.shut.includes(b.key)}
        <table class="ly">
          <thead><tr><th scope="col"><span class="sr">{t('Value')}</span></th><th scope="col" class="n">{ly.year}</th><th scope="col" class="n">{ly.prevYear}</th><th scope="col" class="n">{t('Difference')}</th></tr></thead>
          <tbody>
            {#each ly.rows as x (x.key)}
              <tr data-ly={x.key}><th scope="row">{t(LYNAME[x.key])}</th><td class="n num">{lyVal(x.key, x.cur)}</td><td class="n num">{lyVal(x.key, x.prev)}</td><td class="n num diff">{x.key === 'movingH' ? signedHours(x.diff) : signedNum(x.diff)}</td></tr>
            {/each}
          </tbody>
        </table>
      {/if}
    {:else if b.key === 'V9'}
      {@render head(b, t('Rain, the coldest and the warmest day'))}
      {#if !view.shut.includes(b.key)}
        {#if !wx.known}{@render quiet(t('No weather saved in this period.'))}{:else}
          <ul class="kv">
            <li data-wx="wet"><span>{t('Trips with rain')}</span><b class="num">{num(wx.wet)} / {num(wx.known)}</b></li>
            <li data-wx="cold"><span>{t('Coldest day')}</span>{@render trip(wx.cold, wx.cold ? `${wx.cold.value}° · ${wx.cold.title}` : DASH)}</li>
            <li data-wx="hot"><span>{t('Warmest day')}</span>{@render trip(wx.hot, wx.hot ? `${wx.hot.value}° · ${wx.hot.title}` : DASH)}</li>
          </ul>
        {/if}
      {/if}
    {:else if b.key === 'T1'}
      <!-- SN4h: «Tempo über die Monate» (SN2 plus SN2i) over the rows -->
      {@const l = newestOf(vm, 'kmh')}
      {@render head(b, t('Ø km/h in motion per month, with Ø heart rate · only to look at'))}
      {#if !view.shut.includes(b.key)}
        {#if !vmAny('kmh')}{@render quiet(t('No moving time in this period.'))}{:else}
          <div class="mscroll">
            <div class="mc" style:--n={vm.length}>
              <span class="ax">km/h</span>
              <ol class="bars">{#each vm as m (m.ym)}<li data-month={m.ym} title="{monthLong(m.ym)}: {n1(m.kmh)} km/h">{#if m.kmh != null}<span class="bv num">{n1(m.kmh)}</span><i class="bar" class:last={m.ym === l?.ym} style:height="{(m.kmh / vmTop('kmh')) * 100}%"></i>{/if}</li>{/each}</ol>
              {#if vmAny('hrAvg')}
                <span class="ax">{t('Ø heart rate, bpm')}</span>
                <ol class="ml hrl">{#each vm as m (m.ym)}<li>{m.hrAvg != null ? num(m.hrAvg) : ''}</li>{/each}</ol>
              {/if}
              <ol class="ml" aria-hidden="true">{#each vm as m (m.ym)}<li>{letter(m.ym)}</li>{/each}</ol>
            </div>
          </div>
          <p class="foot">{t('Months without a trip stay empty.')}</p>
        {/if}
      {/if}
    {:else if b.key === 'T2'}
      <!-- SN4h: «Pro Velo und Untergrund» (SN2 plus SN2h) over the rows -->
      {@render head(b, t('Ø km/h in motion · these trips'))}
      {#if !view.shut.includes(b.key)}
        {#if !grid.length}{@render quiet(t('From 20 km and half an hour in motion a trip counts here.'))}{:else}
          <div class="tsc"><table class="ly pg">
            <thead><tr><th scope="col"><span class="sr">{t('Bike')}</span></th>{#each SURFACES as sf (sf.key)}<th scope="col" class="n">{t(sf.name)}</th>{/each}</tr></thead>
            <tbody>
              {#each grid as g (g.bike.id)}
                <tr data-grid-bike={g.bike.id}><th scope="row">{g.bike.name}</th>{#each SURFACES as sf (sf.key)}{@const c = g.cells[sf.key]}<td class="n num">{#if c.n}<b>{n1(c.kmh)}</b> <small>km/h · {tn(c.n, '{n} trip', '{n} trips')}</small>{:else}<small>{t('no trip')}</small>{/if}</td>{/each}</tr>
              {/each}
            </tbody>
          </table></div>
        {/if}
      {/if}
    {:else if b.key === 'T3'}
      <!-- SN4h: «Geplant und gefahren» (SN2 plus SN2h) over the rows, the difference in grey -->
      {@render head(b, pr.avgMin != null ? t('Moving time per trip · on average {n} min beside the plan', { n: num(pr.avgMin) }) : t('Moving time per trip'))}
      {#if !view.shut.includes(b.key)}
        {#if !pr.rows.length}{@render quiet(t('No trip with a planned and a ridden time in this period.'))}{:else}
          <div class="tsc"><table class="ly">
            <thead><tr><th scope="col">{t('Trip')}</th><th scope="col" class="n">{t('Planned|time')}</th><th scope="col" class="n">{t('Ridden|time')}</th><th scope="col" class="n">{t('Difference')}</th></tr></thead>
            <tbody>
              {#each pr.rows as x (x.id)}
                <tr data-pr={x.id}><th scope="row">{@render trip(x, x.title)}</th><td class="n num">{hours(x.planH)}</td><td class="n num">{hours(x.realH)}</td><td class="n num diff">{signedHours(x.diffMin / 60)}</td></tr>
              {/each}
            </tbody>
          </table></div>
        {/if}
      {/if}
    {:else if b.key === 'U2'}
      <!-- SN4h: «Abnutzung» (Rückblick extras DG-U2): what these trips added to the parts of each bike -->
      {@render head(b, t('What these trips add to the parts'))}
      {#if !view.shut.includes(b.key)}
        {#if !wear.length}{@render quiet(t('No trip with a bike and km in this period.'))}{:else}
          {#each wear as w (w.bike.id)}
            <p class="sh" data-wear={w.bike.id}>{w.bike.name} <small class="wn">{tn(w.n, '{n} trip', '{n} trips')}</small></p>
            <ul class="wear">
              {#each w.parts as x (x.key)}
                <li><span>{t(PART_NAME[x.key])}</span><b class="num">{x.addKm != null ? `+${n0(x.addKm)} km` : `+${n0(x.addHm)} ${t('Hm|col')}`}</b>{#if x.nowKm != null}<small>{t('now {km} km', { km: n0(x.nowKm) })}</small>{/if}</li>
              {/each}
            </ul>
          {/each}
          <p class="foot">{t('Changes to the parts are entered in bike care.')} <a href="#/bikes?tab=care">{t('Bike care')}</a></p>
        {/if}
      {/if}
    {:else if b.key === 'P1'}
      <!-- SN4h: «Puls und Leistung pro Monat» (SN2 plus SN2i) over the rows, without «best 20 min» -->
      {@render head(b, t('the newest month on the right · only to look at'))}
      {#if !view.shut.includes(b.key)}
        {#if !P1_ROWS.some((r) => vmAny(r.key))}{@render quiet(t('No heart rate or power in this period.'))}{:else}
          <ul class="pm">
            {#each P1_ROWS.filter((r) => vmAny(r.key)) as r (r.key)}
              {@const l = newestOf(vm, r.key)}
              <li data-p1={r.key}><span>{t(r.name)}</span><span class="pmb" style:--n={vm.length}>{#each vm as m (m.ym)}<i class:last={m.ym === l?.ym} class:none={m[r.key] == null} style:height="{m[r.key] ? Math.max(8, (m[r.key] / vmTop(r.key)) * 100) : 8}%"></i>{/each}</span><b class="num">{l ? num(l.v) : DASH} <small>{t(r.unit)}</small></b></li>
            {/each}
          </ul>
          <p class="foot">{t('Power only from trips with a power meter. Zones, power curve and FTP are in the trip’s Rückblick.')}</p>
        {/if}
      {/if}
    {:else if b.key === 'C1'}
      <!-- SN4h: «Vergleichsgruppen» (Rückblick extras SN2j): within a group the Rückblick compares -->
      {@render head(b, t('within a group the Rückblick compares'))}
      {#if !view.shut.includes(b.key)}
        {#if !cmp.length}{@render quiet(t('No bike yet.'))}{:else}
          <ul class="kv">
            {#each cmp as g (g.key)}
              <li data-cmp={g.key}><span class="ln"><b>{g.key === 'bikepacking' ? t('Bikepacking') : g.name}</b>{#if g.last}<small>{t('last: {trip}', { trip: g.last })}</small>{/if}</span><b class="num">{g.rated ? tn(g.rated, '{n} trip with a Rückblick', '{n} trips with a Rückblick') : t('no trip with a Rückblick yet')}</b></li>
            {/each}
          </ul>
          <p class="foot">{t('Similar means: km and Hm each at most 20 % apart.')}</p>
        {/if}
      {/if}
    {:else if b.key === 'V11'}
      {@render head(b, t('Bike instead of car'))}
      {#if !view.shut.includes(b.key)}
        {#if !foot.km}{@render quiet(t('No km in this period.'))}{:else}
          <div class="fp"><span class="fic" aria-hidden="true"><Leaf size={24} /></span><div><b class="big num" data-co2>≈ {n0(foot.kg)} <small>{t('kg CO₂ saved')}</small></b><small>{t('{km} km by bike instead of by car', { km: n0(foot.km) })}</small></div></div>
          <p class="foot">{t('Estimated with 0.15 kg CO₂ per car km.')}</p>
        {/if}
      {/if}
    {/if}
  </article>
{/snippet}

<section class="iz" class:tours aria-labelledby="iz-h" data-in-numbers data-tours={tours || null}>
  <div class="izh">
    <div>
      <h2 id="iz-h">{t('In numbers')}</h2>
      <p class="rv-sub">{tours ? t('follows the period, chips and filters above · now: {scope}', { scope }) : t('{n} blocks · follow the period and filters above · now: {scope}', { n: BLOCK_KEYS.filter(on).length, scope })}</p>
    </div>
    <div class="izt">
      {#if tours && shownGroups.length}<button type="button" class="btn btn-link fall" data-fold-all onclick={() => setView({ open: anyOpen ? [] : shownGroups.map((g) => g.key) })}>{#if anyOpen}<ChevronsUp size={17} aria-hidden="true" />{t('Close all')}{:else}<ChevronsDown size={17} aria-hidden="true" />{t('Open all')}{/if}</button>{/if}
      <button type="button" class="btn k" onclick={() => (pick = true)} aria-haspopup="dialog"><LayoutGrid size={17} aria-hidden="true" /><span class="kl">{t('Blocks')}</span></button>
    </div>
  </div>
  {#if tours && shownGroups.length}
    <!-- SN4h: the jump bar, it stays on top while the long page scrolls -->
    <nav class="jump" aria-label={t('Jump to a group')} data-jump>
      {#each shownGroups as g (g.key)}
        {@const Icon = GICON[g.key]}
        <button type="button" data-jump-to={g.key} onclick={() => jumpTo(g.key)}><Icon size={15} aria-hidden="true" />{t(g.name)}</button>
      {/each}
    </nav>
  {/if}
  {#each shownGroups as g (g.key)}
    {@const Icon = GICON[g.key]}
    {@const open = isOpen(g.key)}
    <div class="grp" class:open data-group={g.key} id="izg-{g.key}">
      <h3 class="gh">
        <button type="button" aria-expanded={open} onclick={() => setView({ open: toggled(view.open, g.key) })}>
          <span class="gic" aria-hidden="true"><Icon size={20} /></span>
          <span class="gm"><b>{t(g.name)}</b><small data-summary>{open && !tours ? tn(blocksOf(g.key).length, '{n} block', '{n} blocks') : summary(g.key).filter(Boolean).join(' · ')}</small></span>
          {#if open}<ChevronUp size={20} aria-hidden="true" />{:else}<ChevronDown size={20} aria-hidden="true" />{/if}
        </button>
      </h3>
      {#if open}
        <div class="blocks">{#each blocksOf(g.key) as b (b.key)}{@render block(b)}{/each}</div>
      {/if}
    </div>
  {/each}
  {#if !BLOCK_KEYS.some(on)}<p class="quiet">{t('All blocks are off. «Blocks» switches them on again.')}</p>{/if}
</section>

{#if pick}
  <dialog class="sheet from-below bsheet" bind:this={dlg} use:backClose onclose={() => (pick = false)} onclick={(e) => e.target === dlg && dlg.close()} aria-labelledby="bs-h" data-blocks-sheet>
    <div class="sh-h">
      <div><h2 id="bs-h">{t('Blocks')}</h2><p>{t('Which blocks «In numbers» shows. At first all are on.')}</p></div>
      <button type="button" class="x" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button>
    </div>
    {#each GROUPS as g (g.key)}
      <fieldset class="bg">
        <legend>{t(g.name)}</legend>
        {#each BLOCKS.filter((b) => b.group === g.key) as b (b.key)}
          <label class="opt"><input type="checkbox" checked={on(b.key)} onchange={() => setView({ off: toggled(view.off, b.key) })} data-block-opt={b.key} /><span>{t(b.name)}</span></label>
        {/each}
      </fieldset>
    {/each}
    <div class="sh-f">
      <button type="button" class="reset" disabled={!view.off.length} onclick={() => setView({ off: [] })}><Undo2 size={16} aria-hidden="true" />{t('As at first (all on)')}</button>
      <button type="button" class="btn hi" onclick={() => dlg.close()}>{t('Done')}</button>
    </div>
  </dialog>
{/if}

<style>
  .iz {
    margin: 28px 0 0;
    padding: 0;
  }
  .izh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 0 2px 12px;
  }
  .izh > div {
    flex: 1 1 260px;
    min-width: 0;
  }
  .izh h2 {
    margin: 0;
    font: 600 var(--fs-section) / 1.25 var(--font-body);
  }
  .izh .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .grp {
    margin: 0 0 12px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .grp.open {
    background: var(--paper-2);
  }
  .gh {
    margin: 0;
    font: inherit;
  }
  .gh button {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 64px;
    padding: 10px 16px;
    border: 0;
    border-radius: var(--radius-card);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .gh button > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .gic {
    display: grid;
    flex: none;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink-2);
  }
  .grp:not(.open) .gic {
    background: var(--paper-2);
  }
  .gm {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .gm b {
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .gm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .blocks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: 14px;
    padding: 0 14px 14px;
  }
  .blk {
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .blk.wide {
    grid-column: 1 / -1;
  }
  .bh {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .bic {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .bm {
    flex: 1;
    min-width: 0;
  }
  .bm h4 {
    margin: 0;
    font: 600 var(--fs-body) / 1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  .bm p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .code {
    flex: none;
    margin-top: 12px;
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--paper-2);
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .fold {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -4px -10px 0 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .quiet {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .foot {
    margin: 10px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  /* V1, V8: the months, the newest on the right (many months scroll inside the block) */
  .mscroll {
    overflow-x: auto;
  }
  .mc {
    min-width: calc(var(--n) * 22px);
  }
  .ax {
    display: block;
    margin-top: 10px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .bars,
  .ml {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .bars {
    height: 96px;
    align-items: end;
    margin: 16px 0 4px;
    border-bottom: 1px solid var(--line-strong);
  }
  .bars li {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
  }
  .bar {
    display: block;
    width: 100%;
    max-width: 28px;
    min-height: 2px;
    border-radius: 3px 3px 0 0;
    background: var(--line-strong);
  }
  .bar.last {
    background: var(--hi);
  }
  .bv {
    margin-bottom: 2px;
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    white-space: nowrap;
  }
  .ml li {
    text-align: center;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .zs {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    align-items: end;
    gap: 6px;
    height: 96px;
    margin: 14px 0 6px;
  }
  .zcol {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 2px;
    border-radius: 2px;
    overflow: hidden;
    background: var(--line);
  }
  .zcol i {
    display: block;
    flex: 1 1 0;
    min-height: 1px;
  }
  /* V10 */
  .when {
    display: grid;
    gap: 14px 32px;
    margin-top: 12px;
  }
  @media (min-width: 900px) {
    .when {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: end;
    }
  }
  .wd {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
    height: 120px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .wd li {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    min-width: 0;
  }
  .wd .bar {
    max-width: 48px;
    border-radius: 3px;
    background: var(--bar);
  }
  .wd .bar.none {
    min-height: 2px;
    background: var(--line);
  }
  .wd small {
    margin-top: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .parts {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .parts li {
    display: grid;
    grid-template-columns: minmax(0, 8em) minmax(0, 1fr) 2em;
    align-items: center;
    gap: 12px;
    min-height: 44px;
  }
  .parts li + li {
    border-top: 1px solid var(--line);
  }
  .pn {
    display: grid;
    overflow-wrap: break-word;
  }
  .pn small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .track {
    height: 8px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .track i {
    display: block;
    height: 100%;
    background: var(--bar);
  }
  .parts b {
    text-align: right;
  }
  /* V3, V12, V2, V9 */
  .list,
  .kv,
  .top {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .list li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 12px;
    padding: 8px 0;
  }
  .list li + li,
  .kv li + li,
  .top li + li {
    border-top: 1px solid var(--line);
  }
  .ln {
    display: grid;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .ln b {
    font-weight: 500;
  }
  .ln small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .lv {
    align-self: center;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .share {
    grid-column: 1 / -1;
    height: 4px;
    border-radius: 99px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .share i {
    display: block;
    height: 100%;
    background: var(--bar);
  }
  .kv li,
  .top li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 2px 12px;
    min-height: 44px;
    padding: 4px 0;
  }
  .kv li > span:first-child,
  .top li > span {
    /* Durchklick DK7a: a long trip name without spaces wraps */
    min-width: 0;
    color: var(--ink-2);
    overflow-wrap: break-word;
  }
  .kv b,
  .top b {
    font-weight: 600;
  }
  .best li > :last-child {
    text-align: right;
  }
  .tl {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    min-width: 0;
    max-width: 100%;
    font-weight: 500;
  }
  /* the name is its own flex item, so it can shrink and break a long word (overflow-wrap: break-word, style lint) */
  .tl > span {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .sh {
    margin: 12px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  /* V6 */
  .ly {
    width: 100%;
    margin-top: 10px;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .ly th,
  .ly td {
    padding: 8px 8px 8px 0;
    border-top: 1px solid var(--line);
    font-weight: 400;
    text-align: left;
  }
  .ly thead th {
    border-top: 0;
    color: var(--ink-3);
    font-weight: 500;
  }
  .ly .n {
    text-align: right;
    white-space: nowrap;
  }
  .ly .diff {
    color: var(--ink-3);
  }
  /* V11 */
  .fp {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-top: 12px;
  }
  .fic {
    display: grid;
    flex: none;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .fp > div {
    display: grid;
    min-width: 0;
  }
  .big {
    font: 600 var(--fs-section) / 1.2 var(--font-body);
  }
  .big small,
  .fp > div > small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  /* SN4h: Touren › Übersicht: the tools, the jump bar on top, two blocks side by side */
  .izt {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
  }
  .fall {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
  .jump {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    gap: 6px;
    margin: 0 0 12px;
    padding: 6px;
    overflow-x: auto;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  @media (max-width: 899px), (max-height: 500px) {
    .jump {
      top: calc(56px + env(safe-area-inset-top));
    }
  }
  .jump button {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .jump button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .tours .grp {
    scroll-margin-top: 72px;
  }
  @media (max-width: 899px), (max-height: 500px) {
    .tours .grp {
      scroll-margin-top: 128px;
    }
  }
  @media (min-width: 900px) {
    .tours .blocks {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .hrl li {
    color: var(--ink-2);
  }
  .pg small,
  .wn {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 400;
  }
  .pg td,
  .pg th {
    vertical-align: top;
  }
  /* SN4h: on a phone the count goes under the pace, and a narrow table scrolls on its own, never the page */
  .tsc {
    max-width: 100%;
    overflow-x: auto;
  }
  .pg .n {
    white-space: normal;
  }
  .pg small {
    display: block;
  }
  @media (max-width: 380px) {
    .tours .code {
      display: none;
    }
  }
  .wear {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }
  .wear li {
    display: grid;
    gap: 2px;
    padding: 8px 10px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .wear small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .pm {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }
  .pm li {
    display: grid;
    grid-template-columns: minmax(0, 7em) minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    min-height: 44px;
  }
  .pm li + li {
    border-top: 1px solid var(--line);
  }
  .pm li > span:first-child {
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pmb {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    align-items: end;
    gap: 2px;
    height: 28px;
  }
  .pmb i {
    display: block;
    border-radius: 2px 2px 0 0;
    background: var(--line-strong);
  }
  .pmb i.none {
    background: var(--line);
  }
  .pmb i.last {
    background: var(--hi);
  }
  .pm b small {
    color: var(--ink-3);
    font-weight: 400;
  }
  /* «Blöcke» */
  .bsheet {
    width: min(520px, calc(100vw - 24px));
  }
  .sh-h {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .sh-h h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .sh-h p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .bg {
    margin: 10px 0 0;
    padding: 0;
    border: 0;
  }
  .bg legend {
    padding: 0;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 46px;
    border-bottom: 1px solid var(--line);
    cursor: pointer;
  }
  .opt input {
    flex: none;
    width: 22px;
    height: 22px;
    margin: 0;
    accent-color: var(--accent);
  }
  .sh-f {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px 16px;
    margin-top: 14px;
  }
  .reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body) var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .reset:disabled {
    color: var(--ink-3);
    text-decoration: none;
    cursor: default;
  }
  .sh-f .btn {
    min-height: 44px;
    min-width: 120px;
  }
</style>
