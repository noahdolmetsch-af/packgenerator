<script>
  /**
   * Past trips (v0.25.1, Noah 3a), #/pack/past.
   * v0.49.0 R1 «Rückblick ruhig» (Noah 1b, 2a, 3a): ONE table everywhere, the phone included. One row
   * per trip with km, Hm, time in motion, rain or dry, temperature, bike and one learning (or what was
   * special). On a phone the trip name stays fixed on the left and the other columns scroll sideways
   * inside the table; the page itself never scrolls sideways. Above it: the period (12 Monate / this
   * year / Alle), one button «Art» and a search that also finds learnings. A trip whose debrief is
   * still open gets a small marker in its row (the list «Rückblick offen» is gone). Numbers:
   * review/rueckblick.js, unknown is a calm «–».
   * SN4 «Seiten neu» (mockup approved 13.10.2026, ★ 4a): the card «Dein 2026» on top leads to the
   * Rückblick on this year; filter chips Alle / Abgeschlossen / Bewertet beside «Art»; a column Zustand
   * with the pill; a trip whose debrief is missing has «Bewerten» right in its row. On a phone each trip
   * is a card. Planned trips are not here (Touren › Übersicht).
   */
  import { homeTrips } from '../lib/home/heute.js';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { loadReview } from '../lib/review/load.js';
  import { tripFacts, periodOf, periodStats, searchFacts, matchesArt, ARTS } from '../lib/review/rueckblick.js';
  import { factStates, factCounts, matchesState, keepPeriod } from '../lib/review/state.js';
  import { stateExtraText } from '../lib/tripstatetext.js';
  import TripState from '../lib/ui/TripState.svelte';
  import StateChips from '../lib/ui/StateChips.svelte';
  import Btn from '../lib/ui/Btn.svelte';
  import { n0, hours, temps, dates, monthLong, rainText, DASH } from '../lib/review/fmt.js';
  import { openTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import '../lib/review/review.css';
  import { ChevronLeft, ChevronRight, Upload, Search, ListFilter, Lightbulb, Sun, CloudRain, Cloud, Check, Info, CalendarHeart } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte'; // SK: the tile row at the page end

  const today = localDay();
  const dataQ = liveQuery(() => loadReview(db));
  // the same trips as the Rückblick and Today: no archived and no test trips (home/heute.js)
  const facts = $derived($dataQ ? tripFacts({ ...$dataQ, trips: homeTrips($dataQ.trips), today }) : []);

  let mode = $state('12m');
  let art = $state('all');
  let q = $state('');
  let artOpen = $state(false);
  const year = today.slice(0, 4);
  const PERIODS = $derived([
    { key: '12m', name: t('12 months') },
    { key: 'year', name: year },
    { key: 'all', name: t('All|period') },
  ]);
  const period = $derived(periodOf(mode, today));
  const inPeriod = $derived(facts.filter((r) => (!period.from || r.start >= period.from) && r.start <= period.to));
  // SN4: the state of every row, the chips per state, this year's card
  const states = $derived($dataQ ? factStates(facts, { debriefs: $dataQ.debriefs, rides: $dataQ.rides, today }) : {});
  let st = $state('all');
  const found = $derived(searchFacts(inPeriod.filter((r) => matchesArt(r, art)), q));
  const counts = $derived(factCounts(found, states));
  const rows = $derived(found.filter((r) => matchesState(states, r.id, st)));
  const notRated = $derived(inPeriod.filter((r) => states[r.id]?.state === 'done').length);
  const yearStats = $derived($dataQ && facts.length ? periodStats(facts, $dataQ.learnings, 'year', today) : null);
  const yearNum = (key) => yearStats?.stats.find((x) => x.key === key)?.value ?? null;
  const ARTNAME = Object.fromEntries(ARTS.map((a) => [a.key, a.name]));
  const artLabel = $derived(art === 'all' ? t('All|art') : t(ARTNAME[art]));
  const filtered = $derived(art !== 'all' || st !== 'all' || !!q.trim());

  /** Month groups, newest first: [{ month, rows }]. */
  const groups = $derived.by(() => {
    const out = [];
    for (const r of rows) {
      const m = r.start.slice(0, 7);
      if (out.at(-1)?.month !== m) out.push({ month: m, rows: [] });
      out.at(-1).rows.push(r);
    }
    return out;
  });
  const sums = $derived({
    km: rows.some((r) => r.km != null) ? rows.reduce((s, r) => s + (r.km ?? 0), 0) : null,
    gainM: rows.some((r) => r.gainM != null) ? rows.reduce((s, r) => s + (r.gainM ?? 0), 0) : null,
    wet: rows.filter((r) => r.rain.wet === true).length,
  });
  const what = (r) => (r.kind === 'ride' ? t('Uploaded ride') : r.days > 1 ? tn(r.days, '{n} day', '{n} days') : t(ARTNAME[r.art] ?? 'Day ride|art'));
  const go = (r) => r.trip && openTrip(r.trip.id);
  const pickArt = (k) => {
    art = k;
    artOpen = false;
  };
  const reset = () => {
    art = 'all';
    st = 'all';
    q = '';
  };
  // the Art list closes on Escape and on a tap outside
  $effect(() => {
    if (!artOpen) return;
    const key = (e) => e.key === 'Escape' && (artOpen = false);
    const out = (e) => !e.target.closest?.('.artpick') && (artOpen = false);
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', out);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', out);
    };
  });
</script>

{#snippet rainCell(r)}
  {#if r.rain.wet === true}<span class="wx wet"><CloudRain size={16} aria-hidden="true" />{rainText(r.rain, r.days)}</span>{:else if r.rain.wet === false}<span class="wx"><Sun size={16} aria-hidden="true" />{rainText(r.rain, r.days)}</span>{:else}<span class="wx"><Cloud size={16} aria-hidden="true" />{DASH}</span>{/if}
{/snippet}

<!-- v0.109.0 Design-Refresh P6 (T21 «Vergangene Touren», approved 12.10.2026): the quiet path, the search over
     the full width, «Art» and «Zeitraum» in one line, «In diesem Zeitraum» as number tiles in one card, the
     table in a white card and the hint with its icon.
     SN4: the card «Dein 2026» on top (★ 4a), the state chips with «Art» in one row, a column Zustand with the
     pill, «Bewerten» right in the row of a trip whose debrief is missing; on a phone cards instead of a table. -->
<div class="past rv-page">
  <nav class="crumb" aria-label={t('Path')}><a href="#/trips"><ChevronLeft size={14} aria-hidden="true" />{t('Trips|place')}</a><ChevronRight size={12} aria-hidden="true" /><a href="#/debrief">{t('Look back|page')}</a><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{t('Past trips')}</span></nav>
  <header class="head">
    <div>
      <h1 class="title">{t('Past trips')}</h1>
      {#if $dataQ}<p class="page-sub">{[(mode === '12m' ? t('{n} in 12 months', { n: inPeriod.length }) : mode === 'year' ? t('{n} in {year}', { n: inPeriod.length, year }) : tn(inPeriod.length, '{n} trip', '{n} trips')), notRated ? t('{n} without a debrief', { n: notRated }) : ''].filter(Boolean).join(' · ')}</p>{/if}
    </div>
    <Btn icon={Upload} label={t('Upload ride')} href="#/debrief/ride" />
  </header>

  {#if $dataQ && !facts.length}
    <!-- v0.127.0 A-U2: the one empty building block -->
    <div class="nopast"><Empty icon={Check} title={t('No finished trips yet.')} text={t('A trip shows up here the day after it ends, or as soon as you end it on the ride day.')} action={{ label: t('Open Trips'), href: '#/trips' }} /></div>
  {:else if $dataQ}
    {#if yearStats && !yearStats.empty}
      <!-- SN4 (★ 4a): the way into this year's review -->
      <section class="rv-box yearcard" aria-labelledby="yr-h" data-year-card>
        <span class="yic" aria-hidden="true"><CalendarHeart size={24} /></span>
        <span class="ym">
          <small>{t('Year in review')}</small>
          <b id="yr-h">{t('Your {year}: {trips}, {km} km, {rain}', { year, trips: tn(yearNum('trips') ?? 0, '{n} trip', '{n} trips'), km: n0(yearNum('km')), rain: t('{n} with rain', { n: num(yearNum('rain') ?? 0) }) })}</b>
          <small>{t('Best values, the months and what you learned')}</small>
        </span>
        <span class="rowacts"><a class="btn k" href="#/debrief" onclick={() => keepPeriod('year')}><span class="kl">{t('View|review')}</span><ChevronRight size={17} aria-hidden="true" /></a></span>
      </section>
    {/if}
    <div class="tools">
      <label class="rv-search find"><Search size={18} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Trip, place or learning')} aria-label={t('Search trips and learnings')} /></label>
      <Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={(v) => (mode = v)} />
    </div>
    <StateChips value={st} {counts} onchange={(v) => (st = v)}>
      <div class="artpick">
        <button type="button" class="rv-chip" class:on={art !== 'all'} aria-haspopup="true" aria-expanded={artOpen} onclick={() => (artOpen = !artOpen)}><ListFilter size={16} aria-hidden="true" />{t('Kind')}: {artLabel}</button>
        {#if artOpen}
          <ul class="artlist" aria-label={t('Kind')}>
            <li><button type="button" aria-pressed={art === 'all'} onclick={() => pickArt('all')}>{#if art === 'all'}<Check size={16} aria-hidden="true" />{/if}{t('All|art')}</button></li>
            {#each ARTS as a (a.key)}<li><button type="button" aria-pressed={art === a.key} onclick={() => pickArt(a.key)}>{#if art === a.key}<Check size={16} aria-hidden="true" />{/if}{t(a.name)}</button></li>{/each}
          </ul>
        {/if}
      </div>
    </StateChips>

    <section class="sums" aria-labelledby="sum-h">
      <h2 id="sum-h" class="sr">{t('In this period')}</h2>
      <ul class="rv-box rv-tiles tiles" aria-label={t('Sum of the rows shown')}>
        <li class="rv-tile"><b class="num">{num(rows.length)}</b><small>{tn(rows.length, 'trip|unit', 'trips|unit')}</small></li>
        <li class="rv-tile"><b class="num">{n0(sums.km)}</b><small>km</small></li>
        <li class="rv-tile"><b class="num">{n0(sums.gainM)}</b><small>{t('Climbing|hm')}</small></li>
        <li class="rv-tile"><b class="num">{num(sums.wet)}</b><small>{t('with rain')}</small></li>
      </ul>
    </section>

    {#if !rows.length}
      <div class="nopast"><Empty icon={Search} title={t('No trip matches.')} text={filtered ? t('Try another word or kind.') : t('No trip in this period.')} action={filtered ? { label: t('Show all|filter'), onclick: reset, explain: t('Show all kinds') } : mode !== 'all' ? { label: t('Show all|filter'), onclick: () => (mode = 'all'), explain: t('Show all years') } : null} /></div>
    {:else}
      <div class="tbox" role="region" aria-label={t('Past trips')}>
        <table class="tt">
          <thead>
            <tr>
              <th scope="col" class="first">{t('Trip')}</th>
              <th scope="col">{t('State|trip')}</th>
              <th scope="col" class="n">km</th>
              <th scope="col">{t('Weather')}</th>
              <th scope="col" class="n">{t('Temp.')}</th>
              <th scope="col">{t('Bike')}</th>
              <th scope="col" class="go"><span class="sr">{t('Open')}</span></th>
            </tr>
          </thead>
          {#each groups as g (g.month)}
            <tbody>
              <tr class="mrow"><th scope="rowgroup" colspan="7">{monthLong(g.month)}</th></tr>
              {#each g.rows as r (r.id)}
                {@const s = states[r.id]}
                <tr data-state={s?.state}>
                  <th scope="row" class="first">
                    <a href={r.href} onclick={() => go(r)}><span class="tn">{r.title}</span><small>{dates(r.start, r.end)} · {what(r)}</small></a>
                    {#if r.learning}<span class="l1"><Lightbulb size={14} aria-hidden="true" />{r.learning}</span>{/if}
                  </th>
                  <td class="stc"><TripState state={s?.state} extra={stateExtraText(s?.extra)} /></td>
                  <td class="n num km">{n0(r.km)}</td>
                  <td class="wxc">{@render rainCell(r)}</td>
                  <td class="n num tc">{temps(r.tmin, r.tmax)}</td>
                  <td class="bk">{r.bike ?? DASH}</td>
                  <td class="go">
                    {#if s?.open}
                      <Btn label={t('Rate|debrief')} href={r.href} onclick={() => go(r)} aria="{t('Rate|debrief')}: {r.title}" />
                    {:else}
                      <a class="chev" href={r.href} onclick={() => go(r)} tabindex="-1" aria-label={t('Open {trip}', { trip: r.title })}><ChevronRight size={18} aria-hidden="true" /></a>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          {/each}
        </table>
      </div>
      <p class="rv-note hint"><Info size={16} aria-hidden="true" /><span>{t('Planned trips are not here but under Trips › Overview. «Not ridden» and archived trips count nowhere.')}</span></p>
      <p class="rv-note hint"><Sun size={16} aria-hidden="true" /><span>{t('Temperature and rain from the forecast saved with the trip; time in motion from uploaded rides.')}</span></p>
    {/if}
  {/if}
</div>

<PageTiles page="past" />

<style>
  .crumb {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .crumb a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink-3);
    text-decoration: none;
  }
  .crumb a:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  .crumb [aria-current] {
    color: var(--ink);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px 16px;
    margin-bottom: 14px;
  }
  .nopast {
    margin-top: 12px;
  }
  /* SN4: the card «Dein 2026» */
  .yearcard {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    margin: 0 0 20px;
    padding: 18px 20px;
    background: linear-gradient(90deg, var(--st-rated-soft), var(--paper) 70%);
  }
  .yic {
    display: grid;
    flex: none;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: var(--r-ctl);
    background: var(--st-rated-soft);
    color: var(--st-rated);
  }
  .ym {
    display: grid;
    flex: 1 1 260px;
    gap: 2px;
    min-width: 0;
  }
  .ym b {
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .ym small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .yearcard .rowacts .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 12px;
  }
  .tools .find {
    flex: 1 1 280px;
  }
  .tools :global(.seg) {
    flex: none;
  }
  .artpick .rv-chip.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .artpick {
    position: relative;
  }
  .artlist {
    position: absolute;
    z-index: 4;
    top: calc(100% + 4px);
    right: 0;
    min-width: 200px;
    margin: 0;
    padding: 6px;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--paper);
    box-shadow: 0 6px 20px var(--shadow);
  }
  @media (max-width: 719px) {
    .artlist {
      left: 0;
      right: auto;
    }
  }
  .artlist button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 44px;
    padding: 0 10px 0 34px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .artlist button[aria-pressed='true'] {
    padding-left: 10px;
    font-weight: 600;
  }
  .artlist button:hover {
    background: var(--paper-2);
  }
  .sums {
    margin: 16px 0;
  }
  .tiles {
    list-style: none;
    margin: 0;
  }
  .rv-tile b {
    font-size: var(--fs-section);
  }
  /* position: the screen-reader text inside stays clipped by the box (it would widen the page) */
  .tbox {
    position: relative;
    padding: 4px 16px 8px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .rv-note.hint {
    margin-top: 12px;
  }
  .tt {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--fs-small);
  }
  .tt thead th {
    padding: 10px 10px 8px 0;
    color: var(--ink-3);
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--line);
  }
  .tt .n {
    text-align: right;
  }
  .tt tbody th,
  .tt td {
    padding: 10px 10px 10px 0;
    border-top: 1px solid var(--line);
    vertical-align: middle;
    font-weight: 400;
    text-align: left;
  }
  .tt td.n {
    text-align: right;
    white-space: nowrap;
  }
  .tt .first {
    min-width: 180px;
  }
  /* the trip's name and date are one link, at least 44 px high (a touch target) */
  .tt tbody th a {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 44px;
    color: var(--ink);
    text-decoration: none;
  }
  .tt tbody th a .tn {
    font-weight: 500;
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .tt tbody th a:hover .tn {
    text-decoration: underline;
  }
  .tt tbody th small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .mrow th {
    padding-top: 14px;
    padding-bottom: 6px;
    color: var(--ink-3);
    font-size: var(--fs-tiny);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .wx {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    color: var(--ink-2);
  }
  .wx :global(svg) {
    color: var(--ink-3);
  }
  .wx.wet,
  .wx.wet :global(svg) {
    color: var(--l3);
  }
  .bk {
    white-space: nowrap;
    color: var(--ink-2);
  }
  .l1 {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    margin-top: 2px;
    color: var(--ink-2);
    font-weight: 400;
    max-width: 320px;
    overflow-wrap: break-word;
  }
  .l1 :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .tt .go {
    padding-right: 0;
    text-align: right;
    white-space: nowrap;
  }
  .tt td.go a.chev {
    display: inline-grid;
    place-items: center;
    width: 44px;
    min-height: 44px;
    color: var(--ink-3);
  }
  /* phone: each trip a card (name, date, km on the right, the pill, «Bewerten» across) */
  @media (max-width: 719px) {
    .tt thead {
      display: none;
    }
    .tt tbody tr:not(.mrow) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: 12px;
      padding: 10px 0;
      border-top: 1px solid var(--line);
    }
    .tt tbody tr > * {
      padding: 0;
      border: 0;
    }
    .tt .mrow,
    .tt .mrow th {
      display: block;
    }
    .tt .mrow th {
      padding: 14px 0 4px;
    }
    .tt .first {
      grid-column: 1;
      grid-row: 1;
      min-width: 0;
    }
    .tt td.km {
      grid-column: 2;
      grid-row: 1;
      align-self: center;
    }
    .tt td.stc {
      grid-column: 1 / -1;
      grid-row: 2;
      margin-top: 4px;
    }
    .tt td.wxc,
    .tt td.tc,
    .tt td.bk {
      display: none;
    }
    .tt td.go {
      grid-column: 1 / -1;
      grid-row: 3;
      text-align: left;
    }
    .tt td.go:has(a.chev) {
      display: none;
    }
    .tt td.go :global(.btn) {
      display: flex;
      justify-content: center;
      width: 100%;
      margin-top: 8px;
    }
  }
</style>
