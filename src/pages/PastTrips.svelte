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
  import { ChevronRight, Upload, Search, ListFilter, Lightbulb, Sparkles, Sun, CloudRain, Cloud, Check } from '@lucide/svelte';

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

<div class="past">
  <nav class="crumb" aria-label={t('Path')}><a href="#/trips">{t('Trips|place')}</a><ChevronRight size={14} aria-hidden="true" /><a href="#/debrief">{t('Look back|page')}</a><ChevronRight size={14} aria-hidden="true" /></nav>
  <header class="head">
    <div>
      <h1 class="title">{t('Past trips')}</h1>
      {#if $dataQ}<p class="page-sub">{[tn(inPeriod.length, '{n} trip', '{n} trips') + (mode === '12m' ? ` ${t('in 12 months')}` : mode === 'year' ? ` ${t('in {year}', { year })}` : ''), open ? tn(open, '{n} debrief open', '{n} debriefs open') : ''].filter(Boolean).join(' · ')}</p>{/if}
    </div>
    <a class="quiet" href="#/debrief/ride"><Upload size={18} aria-hidden="true" />{t('Upload ride')}</a>
  </header>

  {#if $dataQ && !facts.length}
    <div class="card empty">
      <b>{t('No finished trips yet.')}</b>
      <p>{t('A trip shows up here the day after it ends, or as soon as you end it on the ride day.')}</p>
      <a class="btn" href="#/trips">{t('Open Trips')}</a>
    </div>
  {:else if $dataQ}
    <ul class="tiles" aria-label={t('Sum of the rows shown')}>
      <li><b class="bignum num">{num(rows.length)}</b><span>{tn(rows.length, 'trip|unit', 'trips|unit')}</span></li>
      <li><b class="bignum num">{n0(sums.km)}</b><span>km</span></li>
      <li><b class="bignum num">{n0(sums.gainM)}</b><span>{t('Climbing|hm')}</span></li>
      <li><b class="bignum num">{sums.movingH == null ? DASH : n0(sums.movingH)}</b><span>{t('h moving')}</span></li>
      <li><b class="bignum num">{num(sums.wet)}</b><span>{t('with rain')}</span></li>
    </ul>

    <div class="tools">
      <label class="find"><Search size={18} aria-hidden="true" /><input class="inp" type="search" bind:value={q} placeholder={t('Trip, place or learning')} aria-label={t('Search trips and learnings')} /></label>
      <Seg full={false} label={t('Period')} value={mode} options={PERIODS} onchange={(v) => (mode = v)} />
      <div class="artpick">
        <button type="button" class="btn" class:on={art !== 'all'} aria-haspopup="true" aria-expanded={artOpen} onclick={() => (artOpen = !artOpen)}><ListFilter size={18} aria-hidden="true" />{t('Kind')}: {artLabel}</button>
        {#if artOpen}
          <ul class="artlist" aria-label={t('Kind')}>
            <li><button type="button" aria-pressed={art === 'all'} onclick={() => pickArt('all')}>{#if art === 'all'}<Check size={16} aria-hidden="true" />{/if}{t('All|art')}</button></li>
            {#each ARTS as a (a.key)}<li><button type="button" aria-pressed={art === a.key} onclick={() => pickArt(a.key)}>{#if art === a.key}<Check size={16} aria-hidden="true" />{/if}{t(a.name)}</button></li>{/each}
          </ul>
        {/if}
      </div>
    </div>

    {#if !rows.length}
      <div class="card empty">
        <b>{t('No trip matches.')}</b>
        <p>{filtered ? t('Try another word or kind.') : t('No trip in this period.')}</p>
        {#if filtered}<button type="button" class="btn" onclick={reset}>{t('Show all kinds')}</button>{:else if mode !== 'all'}<button type="button" class="btn" onclick={() => (mode = 'all')}>{t('Show all years')}</button>{/if}
      </div>
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
                    <a href={r.href} onclick={() => go(r)}><span class="tn">{r.title}</span><small>{dates(r.start, r.end)} · {what(r)}</small></a>
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
      <p class="hint">{t('Temperature and rain from the forecast saved with the trip; time in motion from uploaded rides.')}</p>
    {/if}
  {/if}
</div>

<style>
  .past {
    max-width: 1400px;
    margin: 0 auto;
  }
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
    min-width: 44px;
    color: var(--accent);
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
    color: var(--accent);
    font-weight: 500;
    text-decoration: none;
  }
  .empty {
    display: grid;
    gap: 8px;
    justify-items: start;
    margin-top: 12px;
  }
  .empty p {
    margin: 0;
    color: var(--ink-2);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    margin: 4px 0 14px;
    padding: 0;
    list-style: none;
  }
  @media (max-width: 719px) {
    .tiles {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .tiles li {
    display: grid;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    min-width: 0;
  }
  .tiles span {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-bottom: 12px;
  }
  .find {
    position: relative;
    flex: 1 1 240px;
    max-width: 380px;
    display: flex;
    align-items: center;
  }
  .find :global(svg) {
    position: absolute;
    left: 12px;
    color: var(--ink-3);
    pointer-events: none;
  }
  .find .inp {
    width: 100%;
    min-height: 44px;
    padding-left: 40px;
    box-sizing: border-box;
  }
  .artpick {
    position: relative;
  }
  .artpick > .btn {
    min-height: 44px;
  }
  .artpick > .btn.on {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
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
  .hint {
    margin: 8px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
</style>
