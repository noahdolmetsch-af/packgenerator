<script>
  /**
   * «Analyse» M2 «Überblick» (Noah 27.10.2026 «alle Mockups 1:1»), under the choice of sources and period:
   * the numbers of the period (ticks, bike km, sleep, active zone minutes, resting pulse, longest run of
   * days with a tick), every day as a field (darker = more ticked; a tap opens the day), the ranking of
   * your activities against the period before, and ticks per week with the mean of 4 weeks.
   * Only to look at, nothing is rated. Rules in lib/analyse/overview.js.
   * days: the period (oldest first); byKey; acts; log; on: the sources switched on; onday(day).
   */
  import { valueText, unitText } from '../../lib/analyse/format.js';
  import { ticksPerDay, longestRun, heatWeeks, ranking, rankByRing, perWeek, weekDays, weekCountFor, changeOf, noticed } from '../../lib/analyse/overview.js';
  import { actName } from '../../lib/flow/ui.svelte.js';
  import { RING_WORDS } from '../../lib/flow/auswertung/words.js';
  import { addDays } from '../../lib/analyse.js';
  import Empty from '../../lib/ui/Empty.svelte';
  import BarChart from '../../lib/charts/BarChart.svelte';
  import Readout from '../../lib/charts/Readout.svelte';
  import { ChevronRight } from '@lucide/svelte';
  import { t, num, locale } from '../../lib/i18n.svelte.js';

  let { days = [], byKey = new Map(), acts = [], log = [], on = [], today = days.at(-1), onday } = $props();

  const aktiv = $derived(on.includes('aktiv'));
  const perDay = $derived(ticksPerDay(log));
  const inDays = $derived(days.reduce((s, d) => s + (perDay.get(d) ?? 0), 0));
  const run = $derived(longestRun(days, perDay));
  // the period before, as long as the period: the boxes say how they stand against it
  const prevDays = $derived(Array.from({ length: days.length }, (_, i) => addDays(days[0], i - days.length)));
  // the calendar and the course show whole weeks, at least 12, so a short period does not leave the card empty
  const weekCount = $derived(weekCountFor(days, today));
  const calDays = $derived(weekDays(today, weekCount));
  const heat = $derived(heatWeeks(calDays, perDay));
  const rank = $derived(ranking(acts, log, days, actName));
  const rankTop = $derived(Math.max(1, ...rank.map((r) => r.n)));
  const rankGroups = $derived(rankByRing(rank));
  const quietAll = $derived(rankGroups.flatMap((g) => g.quiet));
  const weeks = $derived(perWeek(calDays, perDay, today));
  const BAR = ['var(--l1)', 'var(--l3)', 'var(--l4)', 'var(--pz5)', 'var(--pz3)', 'var(--pz6)', 'var(--pz4)', 'var(--l2)'];
  const colorOf = (r) => BAR[rank.indexOf(r) % BAR.length];
  let pickedRank = $state(null);
  const pr = $derived(rank.find((r) => r.id === pickedRank) ?? null);

  // the boxes: only from the sources switched on, only with a value
  // perDay: a counted value (minutes, km) as its mean per day with a value, not its total (Noah 07.11.2026 «2a»)
  const mean = (it, over, perDay = false) => {
    const vals = over.map((d) => it.get(d)).filter((v) => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) return null;
    const s = vals.reduce((a, b) => a + b, 0);
    return it.sum && !perDay ? s : s / vals.length;
  };
  // «n % more / less than before» as a quiet line (Noah 23.11.2026), nothing without a real period before
  const vsText = (now, before) => {
    const c = changeOf(now, before);
    if (!c) return '';
    if (c.same) return t('the same as the {n} days before|overview', { n: days.length });
    return t('{pct} against the {n} days before|overview', { pct: `${c.pct > 0 ? '+' : '−'}${num(Math.abs(c.pct))} %`, n: days.length });
  };
  const boxes = $derived.by(() => {
    const out = [];
    if (aktiv) out.push({ key: 'ticks', big: num(inDays), small: t('ticks in {n} days|overview', { n: days.length }), vs: vsText(inDays, prevDays.reduce((s, d) => s + (perDay.get(d) ?? 0), 0)), to: 'an-course' });
    const one = (key, label, perDay = false) => {
      const it = byKey.get(key);
      if (!it?.get || !on.includes(it.src)) return;
      const v = mean(it, days, perDay);
      if (v == null) return;
      out.push({ key, big: `${valueText(it, v, num)}${unitText(it) ? ` ${unitText(it)}` : ''}`, small: label, vs: vsText(v, mean(it, prevDays, perDay)), href: it.href });
    };
    one('km:bike', t('Bike, Strava, in {n} days|overview', { n: days.length }));
    one('sleep', t('sleep on average|overview'));
    one('azm', t('active zone minutes a day, mean of {n} days|overview', { n: days.length }), true);
    one('rhr', t('resting pulse|overview'));
    if (aktiv) out.push({ key: 'run', big: t('{n} days|overview', { n: run }), small: t('longest run|overview'), vs: vsText(run, longestRun(prevDays, perDay)), to: 'an-course' });
    return out;
  });
  // a tick or a run opens the course below (the box has no page of its own)
  function toCourse(id) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    el?.focus({ preventScroll: true });
  }

  // «What stands out»: up to three sentences from the numbers (Noah 23.11.2026), only to look at
  const notes = $derived(
    aktiv
      ? noticed({ rank, perDay, today }).map((x) => {
          if (x.kind === 'up') return t('{name} more often than before: {n}× instead of {p}×|overview', { name: actName(x.row.act), n: x.n, p: x.prev });
          if (x.kind === 'down') return t('{name} less often than before: {n}× instead of {p}×|overview', { name: actName(x.row.act), n: x.n, p: x.prev });
          return x.n === 0 ? t('Nothing ticked yet this week.|overview') : t('This week so far {n} ticks, last week at the same point {m}.|overview', { n: x.n, m: x.last });
        })
      : [],
  );

  // nothing to show in this period: no value of a source that is on, and no tick (the numbers would all be 0)
  const nothing = $derived(!boxes.some((b) => b.key !== 'ticks' && b.key !== 'run') && (!aktiv || inDays === 0));
  const dfmt = (d, o) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', ...o });
  const WD = $derived(Array.from({ length: 7 }, (_, i) => dfmt(`2026-10-${String(5 + i).padStart(2, '0')}`, { weekday: 'short' })));
  // a month name over the first week of each month
  const monthOf = (w, i) => {
    const first = w.cells.find(Boolean)?.day;
    if (!first) return '';
    const prev = heat.weeks[i - 1]?.cells.find(Boolean)?.day;
    return !prev || prev.slice(0, 7) !== first.slice(0, 7) ? dfmt(first, { month: 'short' }) : '';
  };
  // a long period does not fit on a phone: start at the newest weeks, older ones are a swipe away
  let calEl = $state();
  $effect(() => {
    if (heat.weeks.length && calEl) calEl.scrollLeft = calEl.scrollWidth;
  });

  // the course of ticks per week in the shared bar chart (charts/BarChart.svelte): numbers when pointing, the running week dashed
  const step = $derived(weeks.length > 26 ? 8 : weeks.length > 13 ? 4 : weeks.length > 6 ? 3 : 1);
  const wcols = $derived(weeks.map((w, i) => ({ key: w.key, x: i % step === 0 ? dfmt(w.key, { day: 'numeric', month: 'short' }) : '', top: w.n ? num(w.n) : '', dashed: !!w.running, parts: [{ v: w.n, color: 'var(--l1)' }] })));
  const wline = $derived(weeks.map((w) => w.mean4));
  const wread = (i) => {
    const w = weeks[i];
    return {
      title: `${t('Week of {day}|overview', { day: dfmt(w.key, { day: 'numeric', month: 'short' }) })}${w.running ? ` · ${t('running|overview')}` : ''}`,
      items: [{ label: t('ticks|overview'), value: num(w.n) }, ...(w.mean4 != null ? [{ label: t('mean of 4 weeks|overview'), value: num(Math.round(w.mean4 * 10) / 10) }] : [])],
      extra: w.running ? t('The week is not over yet, so it is not in the mean.|overview') : '',
    };
  };
  const wtable = $derived({
    head: [t('Week of {day}|overview', { day: '' }).trim(), t('ticks|overview'), t('mean of 4 weeks|overview')],
    rows: [...weeks].reverse().map((w) => ({ key: w.key, cells: [dfmt(w.key, { day: 'numeric', month: 'short' }) + (w.running ? ` (${t('running|overview')})` : ''), num(w.n), w.mean4 != null ? num(Math.round(w.mean4 * 10) / 10) : '–'] })),
  });
</script>

{#if nothing}
  <Empty
    text={t('Nothing ticked or recorded in these {n} days yet. Tick an activity in Aktiv or connect Fitbit or Strava, then the overview fills.|overview', { n: days.length })}
    action={{ label: t('Open Aktiv'), href: '#/flow' }}
    action2={{ label: t('Connect Fitbit|analyse'), href: '#/me/fitbit' }}
  />
{:else}
{#if notes.length}
  <section class="card nt" aria-labelledby="nt-h" data-noticed>
    <h2 id="nt-h">{t('What stands out|link')}</h2>
    <ul>{#each notes as line, i (i)}<li>{line}</li>{/each}</ul>
    <p class="hint">{t('Only an observation, nothing is rated.|overview')}</p>
  </section>
{/if}

<section class="card ov" aria-labelledby="ov-h" data-overview>
  <h2 id="ov-h" class="sr">{t('Overview|overview')}</h2>
  {#if boxes.length}
    <ul class="boxes">
      {#each boxes as b (b.key)}
        <li class="box" data-ov-box={b.key}>
          {#if b.href}
            <a href={b.href}><b class="num">{b.big}</b><span>{b.small}</span>{#if b.vs}<em data-ov-vs>{b.vs}</em>{/if}<ChevronRight size={14} aria-hidden="true" /></a>
          {:else if b.to}
            <button type="button" onclick={() => toCourse(b.to)}><b class="num">{b.big}</b><span>{b.small}</span>{#if b.vs}<em data-ov-vs>{b.vs}</em>{/if}<ChevronRight size={14} aria-hidden="true" /></button>
          {:else}<b class="num">{b.big}</b><span>{b.small}</span>{#if b.vs}<em data-ov-vs>{b.vs}</em>{/if}{/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>

{#if aktiv}
  <section class="card hm" aria-labelledby="hm-h" data-heat>
    <div class="ch"><h2 id="hm-h">{t('Every day a field|overview')}</h2><small>{t('calendar · {n} weeks · all ticks|overview', { n: heat.weeks.length })}</small></div>
    <div class="cal" style="--weeks: {heat.weeks.length}" bind:this={calEl}>
      <div class="wd" aria-hidden="true">
        <span></span>
        {#each WD as w, i (i)}<span>{i % 2 === 0 ? w : ''}</span>{/each}
      </div>
      <div class="grid">
        <div class="months" aria-hidden="true">{#each heat.weeks as w, i (w.key)}<span>{monthOf(w, i)}</span>{/each}</div>
        <div class="cells">
          {#each heat.weeks as w (w.key)}
            <div class="col">
              {#each w.cells as c, i (i)}
                {#if c}
                  <button type="button" class="cell l{c.level}" data-day={c.day} aria-label={t('{day}: {n} ticked|overview', { day: dfmt(c.day, { weekday: 'long', day: 'numeric', month: 'long' }), n: c.n })} onclick={() => onday?.(c.day)}></button>
                {:else}
                  <span class="cell none"></span>
                {/if}
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
    <p class="hint">{t('Darker = more ticked. Tap a field to see the day.|overview')}</p>
    <p class="hint scale" aria-hidden="true">{t('fewer|overview')} <i class="cell l1"></i><i class="cell l2"></i><i class="cell l3"></i><i class="cell l4"></i> {t('more|overview')}</p>
  </section>

  <div class="two">
    <section class="card rk" aria-labelledby="rk-h" data-ranking>
      <div class="ch"><h2 id="rk-h">{t('Ranking|overview')}</h2><small>{t('how often · {n} days · against before|overview', { n: days.length })}</small></div>
      {#if rank.length}
        {#if pr}<Readout title={actName(pr.act)} items={[{ label: t('now|overview'), value: `${pr.n}×` }, { label: t('before|overview'), value: `${pr.prev}×` }, { label: t('change|overview'), value: `${pr.diff > 0 ? '+' : pr.diff < 0 ? '−' : '±'}${Math.abs(pr.diff)}` }]} />{/if}
        {#each rankGroups.filter((g) => g.rows.length) as g (g.ring)}
          <div class="rg" data-rank-group={g.ring}>
            <h3>{t(RING_WORDS[g.ring])}</h3>
            <ul>
              {#each g.rows as r (r.id)}
                <li data-rank={r.id}>
                  <button type="button" class="rrow" class:on={pickedRank === r.id} aria-pressed={pickedRank === r.id} onclick={() => (pickedRank = pickedRank === r.id ? null : r.id)}>
                    <span class="nm">{actName(r.act)}</span>
                    <span class="bar"><i style="width:{(r.n / rankTop) * 100}%; background:{colorOf(r)}"></i></span>
                    <span class="n num"><b>{r.n}×</b> <small>{r.diff > 0 ? '+' : r.diff < 0 ? '−' : '±'}{Math.abs(r.diff)}</small></span>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/each}
        {#if quietAll.length}
          <details class="quiet" data-rank-quiet>
            <summary>{t('Nothing this time ({n})|overview', { n: quietAll.length })}</summary>
            <ul>
              {#each quietAll as r (r.id)}<li data-rank={r.id}><span class="nm">{actName(r.act)}</span><span class="n num"><small>{t('before {n}×|overview', { n: r.prev })}</small></span></li>{/each}
            </ul>
          </details>
        {/if}
        <p class="hint">{t('Tap a line for the exact numbers.|overview')}</p>
      {:else}
        <p class="hint">{t('Nothing ticked in this period yet.|overview')}</p>
      {/if}
    </section>
    <section class="card wk" id="an-course" tabindex="-1" aria-labelledby="wk-h" data-weekly>
      <div class="ch"><h2 id="wk-h">{t('Course|analyse')}</h2><small>{t('ticks per week · {n} weeks|overview', { n: weeks.length })}</small></div>
      <BarChart id="ovweeks" cols={wcols} line={wline} lineColor="var(--l1)" readout={wread} table={wtable} label={t('Ticks per week|overview')} unit="" steps={[1, 2, 5, 10, 20, 50, 100]} hint={t('Point at a week for its numbers. The dashed week is not over yet.|overview')} />
      <ul class="legend"><li><i class="lsw"></i>{t('ticks per week|overview')}</li><li><i class="lsw ln"></i>{t('mean of 4 weeks|overview')}</li>{#if weeks.at(-1)?.running}<li><i class="lsw dash"></i>{t('running|overview')}</li>{/if}</ul>
    </section>
  </div>
{/if}

{/if}

<style>
  .ov {
    min-width: 0;
  }
  .boxes {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .box,
  .box a,
  .box button {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--ink);
    text-decoration: none;
  }
  .box {
    position: relative;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .box > :global(*) {
    padding: 10px 12px;
  }
  .box a,
  .box button {
    height: 100%;
    box-sizing: border-box;
    border: 0;
    border-radius: 12px;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .box a:hover,
  .box button:hover {
    background: var(--paper-3, var(--line));
  }
  .box a:focus-visible,
  .box button:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 2px;
  }
  .box :global(svg) {
    position: absolute;
    top: 12px;
    right: 8px;
    padding: 0;
    color: var(--ink-3);
  }
  .box em {
    padding-top: 0;
    color: var(--ink-2);
    font-size: var(--fs-label);
    font-style: normal;
  }
  .nt {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .nt h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .nt ul {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding-left: 18px;
    font-size: var(--fs-body);
  }
  .box b {
    font-size: var(--fs-sub);
  }
  .box span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .hm,
  .rk,
  .wk {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .ch {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .ch h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .ch small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
  }
  /* the fields fill the width of the card (12 weeks or more); fields never get smaller than 22 px, a longer period scrolls
     sideways and starts at the newest week; the weekday names and month names sit exactly on their rows and columns */
  .cal {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    --cell-h: clamp(26px, 3.4vw, 40px);
    --cell-w: minmax(22px, 1fr);
  }
  .wd {
    flex: none;
    display: grid;
    grid-template-rows: 18px repeat(7, var(--cell-h));
    gap: 3px;
    position: sticky;
    left: 0;
    background: var(--paper);
    box-shadow: 6px 0 0 var(--paper);
    z-index: 1;
    color: var(--ink-3);
    font-size: var(--fs-label);
    align-items: center;
  }
  .grid {
    flex: 1 0 auto;
    min-width: calc(var(--weeks) * 25px);
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .months {
    display: grid;
    grid-template-columns: repeat(var(--weeks), var(--cell-w));
    column-gap: 3px;
    height: 18px;
    align-items: center;
    color: var(--ink-3);
    font-size: var(--fs-label);
    white-space: nowrap;
  }
  .cells {
    display: grid;
    grid-template-columns: repeat(var(--weeks), var(--cell-w));
    gap: 3px;
  }
  .col {
    display: grid;
    grid-template-rows: repeat(7, var(--cell-h));
    gap: 3px;
  }
  .cell {
    width: 100%;
    height: var(--cell-h);
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: var(--paper-2);
    cursor: pointer;
  }
  .scale {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .scale .cell {
    width: 14px;
    height: 14px;
    display: inline-block;
    cursor: default;
  }
  .cell.none {
    background: none;
    cursor: default;
  }
  .cell.l1 {
    background: color-mix(in srgb, var(--l1) 25%, var(--paper));
  }
  .cell.l2 {
    background: color-mix(in srgb, var(--l1) 45%, var(--paper));
  }
  .cell.l3 {
    background: color-mix(in srgb, var(--l1) 70%, var(--paper));
  }
  .cell.l4 {
    background: var(--l1);
  }
  .cell:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 1px;
  }
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
  .rk ul {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .rg {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rg h3 {
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-label);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rrow,
  .quiet li {
    display: grid;
    grid-template-columns: minmax(80px, 30%) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    width: 100%;
    font-size: var(--fs-small);
  }
  .rrow {
    min-height: 36px;
    padding: 2px 6px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    text-align: left;
    cursor: pointer;
  }
  @media (pointer: coarse) {
    .rrow {
      min-height: 44px;
    }
  }
  .rrow:hover,
  .rrow.on {
    background: var(--paper-2);
  }
  .rrow:focus-visible {
    outline: 2px solid var(--hi);
    outline-offset: 1px;
  }
  .rk .nm {
    overflow-wrap: break-word;
  }
  .rk .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .rk .bar i {
    display: block;
    height: 100%;
    border-radius: 999px;
  }
  .rk .n small {
    color: var(--ink-3);
  }
  .quiet {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .quiet summary {
    min-height: 36px;
    cursor: pointer;
  }
  .quiet li {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 2px 6px;
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
    width: 12px;
    height: 10px;
    border-radius: 2px;
    background: var(--l1);
    opacity: 0.35;
  }
  .lsw.ln {
    height: 2px;
    opacity: 1;
  }
  .lsw.dash {
    background: none;
    border: 1.5px dashed var(--l1);
    opacity: 1;
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
