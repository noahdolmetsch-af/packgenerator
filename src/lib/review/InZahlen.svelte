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
   */
  import { t, tn, num, nameOf, locale } from '../i18n.svelte.js';
  import { n0, n1, hours, kg, monthLong, dayLong, signedNum, signedHours, DASH } from './fmt.js';
  import { hm } from '../gpx.js';
  import { BLOCKS, GROUPS, BLOCK_KEYS, toggled, monthsOf, monthSums, bestValues, lastYear, whenBuckets, PARTS, routeMap, perBike, packStats, zoneMonths, weatherSum, footprint, heartAll } from './inzahlen.js';
  import { bikeTypeName } from '../bikes.js';
  import RouteMap from './RouteMap.svelte';
  import { backClose } from '../ui/backclose.js';
  import './zones.css';
  import { LayoutGrid, Route, Bike, HeartPulse, Trophy, ChevronDown, ChevronUp, ChartColumn, Map as MapIcon, Clock, Backpack, Medal, CalendarRange, CloudRain, Leaf, X, Undo2 } from '@lucide/svelte';

  let { rows = [], facts = [], vals = {}, mode = '12m', today, scope = '', bikes = [], items = [], containers = [], entries = [], view, onview, hrefOf = () => null, go = () => {} } = $props();

  const GICON = { dist: Route, bikes: Bike, body: HeartPulse, records: Trophy };
  const BICON = { V1: ChartColumn, V7: MapIcon, V10: Clock, V3: Bike, V12: Backpack, V8: HeartPulse, V2: Medal, V6: CalendarRange, V9: CloudRain, V11: Leaf };
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
    if (g === 'body') return [zoneAll ? t('{h} h with heart rate', { h: hm(zoneAll / 3600) }) : heart ? `${t('Ø heart rate')} ${num(heart.avg)}` : '', nb];
    return [blocksOf(g).map((b) => t(b.name)).join(' · '), nb];
  };
  const isOpen = (g) => view.open.includes(g);
  const setView = (patch) => onview?.({ ...view, ...patch });

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
  {#if x && hrefOf(x.id)}<a class="tl" href={hrefOf(x.id)} onclick={() => go(x.id)}>{text}</a>{:else}<span>{text}</span>{/if}
{/snippet}

{#snippet block(b)}
  <article class="blk" class:wide={b.key === 'V10'} data-block={b.key} aria-labelledby="bk-{b.key}">
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

<section class="iz" aria-labelledby="iz-h" data-in-numbers>
  <div class="izh">
    <div>
      <h2 id="iz-h">{t('In numbers')}</h2>
      <p class="rv-sub">{t('{n} blocks · follow the period and filters above · now: {scope}', { n: BLOCK_KEYS.filter(on).length, scope })}</p>
    </div>
    <button type="button" class="btn k" onclick={() => (pick = true)} aria-haspopup="dialog"><LayoutGrid size={17} aria-hidden="true" /><span class="kl">{t('Blocks')}</span></button>
  </div>
  {#each GROUPS.filter((g) => blocksOf(g.key).length) as g (g.key)}
    {@const Icon = GICON[g.key]}
    {@const open = isOpen(g.key)}
    <div class="grp" class:open data-group={g.key}>
      <h3 class="gh">
        <button type="button" aria-expanded={open} onclick={() => setView({ open: toggled(view.open, g.key) })}>
          <span class="gic" aria-hidden="true"><Icon size={20} /></span>
          <span class="gm"><b>{t(g.name)}</b><small data-summary>{open ? tn(blocksOf(g.key).length, '{n} block', '{n} blocks') : summary(g.key).filter(Boolean).join(' · ')}</small></span>
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
    font-weight: 500;
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
