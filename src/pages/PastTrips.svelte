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
   */
  import { homeTrips } from '../lib/home/heute.js';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { loadReview } from '../lib/review/load.js';
  import { tripFacts, periodOf, searchFacts, matchesArt, ARTS } from '../lib/review/rueckblick.js';
  import { n0, hours, temps, dates, monthLong, rainText, DASH } from '../lib/review/fmt.js';
  import { openTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import Profile from '../lib/ui/Profile.svelte';
  import '../lib/review/review.css';
  import { ChevronLeft, ChevronRight, Upload, Search, ListFilter, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Check } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';

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
  const rows = $derived(searchFacts(inPeriod.filter((r) => matchesArt(r, art)), q));
  const open = $derived(facts.filter((r) => r.debrief === 'open' || r.debrief === 'draft').length);
  const ARTNAME = Object.fromEntries(ARTS.map((a) => [a.key, a.name]));
  const artLabel = $derived(art === 'all' ? t('All|art') : t(ARTNAME[art]));
  const filtered = $derived(art !== 'all' || !!q.trim());

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
    movingH: rows.some((r) => r.movingH != null) ? rows.reduce((s, r) => s + (r.movingH ?? 0), 0) : null,
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
     table in a white card and the hint with its icon. The table keeps all its columns, so it stays full width. -->
<div class="past rv-page">
  <nav class="crumb" aria-label={t('Path')}><a href="#/trips"><ChevronLeft size={14} aria-hidden="true" />{t('Trips|place')}</a><ChevronRight size={12} aria-hidden="true" /><a href="#/debrief">{t('Look back|page')}</a><ChevronRight size={12} aria-hidden="true" /><span aria-current="page">{t('Past trips')}</span></nav>
  <header class="head">
    <div>
      <h1 class="title">{t('Past trips')}</h1>
      {#if $dataQ}<p class="page-sub">{[tn(inPeriod.length, '{n} trip', '{n} trips') + (mode === '12m' ? ` ${t('in 12 months')}` : mode === 'year' ? ` ${t('in {year}', { year })}` : ''), open ? tn(open, '{n} debrief open', '{n} debriefs open') : ''].filter(Boolean).join(' · ')}</p>{/if}
    </div>
    <a class="quiet" href="#/debrief/ride"><Upload size={18} aria-hidden="true" />{t('Upload ride')}</a>
  </header>

  {#if $dataQ && !facts.length}
    <!-- v0.127.0 A-U2: the one empty building block -->
    <div class="nopast"><Empty icon={Check} title={t('No finished trips yet.')} text={t('A trip shows up here the day after it ends, or as soon as you end it on the ride day.')} action={{ label: t('Open Trips'), href: '#/trips' }} /></div>
  {:else if $dataQ}
    <label class="rv-search find"><Search size={18} aria-hidden="true" /><input type="search" bind:value={q} placeholder={t('Trip, place or learning')} aria-label={t('Search trips and learnings')} /></label>
    <div class="tools">
      <div class="artpick">
        <button type="button" class="rv-chip" class:on={art !== 'all'} aria-haspopup="true" aria-expanded={artOpen} onclick={() => (artOpen = !artOpen)}><ListFilter size={16} aria-hidden="true" />{t('Kind')}: {artLabel}</button>
        {#if artOpen}
          <ul class="artlist" aria-label={t('Kind')}>
            <li><button type="button" aria-pressed={art === 'all'} onclick={() => pickArt('all')}>{#if art === 'all'}<Check size={16} aria-hidden="true" />{/if}{t('All|art')}</button></li>
            {#each ARTS as a (a.key)}<li><button type="button" aria-pressed={art === a.key} onclick={() => pickArt(a.key)}>{#if art === a.key}<Check size={16} aria-hidden="true" />{/if}{t(a.name)}</button></li>{/each}
          </ul>
        {/if}
      </div>
      <div class="per"><span class="rv-lbl" aria-hidden="true">{t('Period')}</span><Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={(v) => (mode = v)} /></div>
    </div>

    <section class="rv-sec sums" aria-labelledby="sum-h">
      <div class="rv-h"><div><h2 id="sum-h">{t('In this period')}</h2></div></div>
      <ul class="rv-box rv-tiles tiles" aria-label={t('Sum of the rows shown')}>
        <li class="rv-tile"><b class="num">{num(rows.length)}</b><small>{tn(rows.length, 'trip|unit', 'trips|unit')}</small></li>
        <li class="rv-tile"><b class="num">{n0(sums.km)}</b><small>km</small></li>
        <li class="rv-tile"><b class="num">{n0(sums.gainM)}</b><small>{t('Climbing|hm')}</small></li>
        <li class="rv-tile"><b class="num">{sums.movingH == null ? DASH : n0(sums.movingH)}</b><small>{t('h moving')}</small></li>
        <li class="rv-tile"><b class="num">{num(sums.wet)}</b><small>{t('with rain')}</small></li>
      </ul>
    </section>

    {#if !rows.length}
      <div class="nopast"><Empty icon={Search} title={t('No trip matches.')} text={filtered ? t('Try another word or kind.') : t('No trip in this period.')} action={filtered ? { label: t('Show all|filter'), onclick: reset, explain: t('Show all kinds') } : mode !== 'all' ? { label: t('Show all|filter'), onclick: () => (mode = 'all'), explain: t('Show all years') } : null} /></div>
    {:else}
      <div class="tbox" role="region" aria-label={t('Past trips')} tabindex="0">
        <table class="tt">
          <thead>
            <tr>
              <th scope="col" class="first">{t('Trip')}</th>
              <th scope="col" class="n">km</th>
              <th scope="col" class="n">Hm</th>
              <th scope="col" class="n">{t('Time')}</th>
              <th scope="col">{t('Weather')}</th>
              <th scope="col" class="n">{t('Temp.')}</th>
              <th scope="col">{t('Bike')}</th>
              <th scope="col">{t('Learning · special')}</th>
              <th scope="col" class="go"><span class="sr">{t('Open')}</span></th>
            </tr>
          </thead>
          {#each groups as g (g.month)}
            <tbody>
              <tr class="mrow"><th scope="rowgroup" class="first">{monthLong(g.month)}</th><td colspan="8"></td></tr>
              {#each g.rows as r (r.id)}
                <tr>
                  <th scope="row" class="first">
                    <a href={r.href} onclick={() => go(r)}><span class="tn">{r.title}</span>{#if r.rideProfile}<span class="mprof"><Profile points={r.rideProfile} small label="Elevation of the ride" /></span>{/if}<small>{dates(r.start, r.end)} · {what(r)}</small></a>
                    {#if r.debrief === 'open' || r.debrief === 'draft'}<span class="nbadge"><span class="udot" aria-hidden="true"></span>{r.debrief === 'draft' ? t('Debrief started') : t('Debrief open')}</span>{/if}
                  </th>
                  <td class="n num">{n0(r.km)}</td>
                  <td class="n num">{n0(r.gainM)}</td>
                  <td class="n num">{hours(r.movingH)}</td>
                  <td>{@render rainCell(r)}</td>
                  <td class="n num">{temps(r.tmin, r.tmax)}</td>
                  <td class="bk">{r.bike ?? DASH}</td>
                  <td class="ln">
                    {#if r.learning}<span class="l1"><Lightbulb size={16} aria-hidden="true" />{r.learning}</span>{/if}
                    {#if r.special}<span class="l2"><Sparkles size={14} aria-hidden="true" />{r.special}</span>{/if}
                    {#if !r.learning && !r.special}<span class="muted">{DASH}</span>{/if}
                  </td>
                  <td class="go"><a href={r.href} onclick={() => go(r)} tabindex="-1" aria-label={t('Open {trip}', { trip: r.title })}><ChevronRight size={18} aria-hidden="true" /></a></td>
                </tr>
              {/each}
            </tbody>
          {/each}
        </table>
      </div>
      <p class="rv-note hint"><Sun size={16} aria-hidden="true" /><span>{t('Temperature and rain from the forecast saved with the trip; time in motion from uploaded rides.')}</span></p>
    {/if}
  {/if}
</div>

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
  }
  .quiet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    color: var(--ink);
    font-weight: 500;
    font-size: var(--fs-small);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .nopast {
    margin-top: 12px;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    margin: 12px 0 22px;
  }
  .artpick,
  .per {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .tools .rv-lbl {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
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
  /* v0.151.0 HP5 (Noah «3a»): a small profile under each trip with a GPX ride */
  .mprof {
    display: block;
    width: 140px;
    max-width: 40vw;
    margin: 4px 0 2px;
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
  /* position: the screen-reader text inside stays clipped by the box (it would widen the page) */
  .tbox {
    position: relative;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .sums {
    margin-bottom: 22px;
  }
  .tiles {
    list-style: none;
    margin: 0;
  }
  .rv-tile b {
    font-size: var(--fs-section);
  }
  @media (min-width: 380px) and (max-width: 719px) {
    .tiles {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      padding: 12px;
    }
    .tiles .rv-tile {
      padding: 10px;
    }
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
    padding: 12px 12px 8px;
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
    padding: 10px 12px;
    border-top: 1px solid var(--line);
    vertical-align: top;
    font-weight: 400;
    text-align: left;
  }
  .tt td.n {
    text-align: right;
    white-space: nowrap;
  }
  .tt .first {
    position: sticky;
    left: 0;
    z-index: 1;
    width: 220px;
    min-width: 150px;
    max-width: 260px;
    background: var(--paper);
  }
  @media (max-width: 719px) {
    .tt .first {
      width: 140px;
      min-width: 140px;
      max-width: 140px;
      box-shadow: 1px 0 0 var(--line);
    }
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
  .tt tbody th .nbadge {
    margin-top: 4px;
  }
  .mrow th,
  .mrow td {
    padding-top: 14px;
    padding-bottom: 4px;
    color: var(--ink-3);
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
  .ln {
    min-width: 220px;
    max-width: 360px;
  }
  .l1,
  .l2 {
    display: flex;
    gap: 6px;
    align-items: flex-start;
  }
  .l1 :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--warn);
  }
  .l2 {
    color: var(--ink-3);
  }
  .l2 :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--l4);
  }
  .muted {
    color: var(--ink-3);
  }
  .tt .go {
    width: 44px;
    padding: 0;
    vertical-align: middle;
  }
  .tt td.go a {
    display: grid;
    place-items: center;
    width: 44px;
    min-height: 44px;
    color: var(--ink-3);
  }

  .head {
    margin-bottom: 14px;
  }
  .tt .mrow th,
  .tt .mrow td {
    font-size: var(--fs-tiny);
  }
</style>
