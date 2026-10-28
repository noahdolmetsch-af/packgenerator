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
   * SN4+ «SN4 plus» (mockups SN4e and SN4f-a approved 13.10.2026: 1a, 2 «Wetter und Temperatur immer an, plus
   * Max. Puls», 3b, 4a, 5a): the table gets Hm, Fahrzeit, Verstrichen, Ø km/h, Ø Puls, Max. Puls, the bike's
   * type, Wetter, Temp. and the Strava comment (one line; a tap shows it whole, «weniger» folds it). It scrolls
   * sideways, Tour and Zustand stay on the left. «Spalten» chooses the columns (all on at first, remembered in
   * settings 'pastView'). On a phone each trip is a card with these values. Under the table «In Zahlen»: 10
   * blocks in 4 groups that follow the period and filters (review/InZahlen.svelte).
   */
  import MemoryTripSheet from '../lib/tourenc/MemoryTripSheet.svelte'; // Touren c 67
  import NeulandLine from '../lib/wohl/NeulandLine.svelte'; // Paket P #253 «Neuland im Jahresheft»
  import HintCard from '../lib/pageinfo/HintCard.svelte';
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
  import { n0, n1, hours, temps, dates, monthLong, rainText, DASH } from '../lib/review/fmt.js';
  import { openTrip } from '../lib/nav.js';
  import { localDay } from '../lib/localday.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import Seg from '../lib/ui/Seg.svelte';
  import Profile from '../lib/ui/Profile.svelte';
  import '../lib/review/review.css';
  import { ChevronLeft, ChevronRight, Upload, Search, ListFilter, Lightbulb, Sun, CloudRain, Cloud, Check, Info, CalendarHeart } from '@lucide/svelte';
  import Empty from '../lib/ui/Empty.svelte';
  // SN4+ «SN4 plus»: the columns from Strava, «Spalten» and «In Zahlen»
  import { loadPastActs, loadComments, zonesOf, zoneValues } from '../lib/review/actdata.js';
  import { rowValues, viewOf, shownCols, VIEW_KEY } from '../lib/review/inzahlen.js';
  import { bikeTypeName } from '../lib/bikes.js';
  import PastColumns from '../lib/review/PastColumns.svelte';
  import InZahlen from '../lib/review/InZahlen.svelte';
  import { Columns3, Bike, MessageSquareText, Download, ChevronUp, History } from '@lucide/svelte';
  import PageTiles from '../lib/sk/PageTiles.svelte'; // SK: the tile row at the page end
  import EarthEverest from '../lib/pageinfo/EarthEverest.svelte';

  const today = localDay();
  const dataQ = liveQuery(() => loadReview(db));
  // the same trips as the Rückblick and Today: no archived and no test trips (home/heute.js)
  const facts = $derived($dataQ ? tripFacts({ ...$dataQ, trips: homeTrips($dataQ.trips), today }) : []);

  let mode = $state('12m');
  let memOpen = $state(false); // Touren c 67
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
  /* ---- SN4+ «SN4 plus» ---- */
  // the activities (Training PR; [] until then), the ride ledger (heart rate) and the zones
  const moreQ = liveQuery(async () => {
    const [acts, entries, zones] = await Promise.all([loadPastActs(db), db.kmBook.toArray(), zoneValues(db)]);
    return { acts, entries, zones: zonesOf(zones, entries, acts) };
  });
  const viewQ = liveQuery(() => db.settings.get(VIEW_KEY));
  let viewNow = $state(null);
  const view = $derived(viewOf(viewNow ?? $viewQ?.value ?? null));
  // a plain copy (IndexedDB cannot store the $state proxy)
  function saveView(next) {
    const plain = viewOf($state.snapshot(next));
    db.settings.put({ key: VIEW_KEY, value: { ...plain, at: new Date().toISOString() } });
    viewNow = plain;
  }
  const cols = $derived(shownCols(view));
  const on = (k) => !view.hide.includes(k);
  const vals = $derived($dataQ && $moreQ ? Object.fromEntries(facts.map((r) => [r.id, rowValues(r, { acts: $moreQ.acts, entries: $moreQ.entries, bikes: $dataQ.bikes, bounds: $moreQ.zones?.bounds ?? null })])) : {});
  let colsOpen = $state(false);
  let openC = $state(null);
  const typeOf = (v) => (v?.type ? t(bikeTypeName(v.type)) : DASH);
  const secs = (s) => hours(s ? s / 3600 : null);
  // SN4+: «Kommentar laden» fetches the activity from Strava (Training's loadDetail); a no shows one line
  let loading = $state(null);
  let failed = $state(null);
  async function loadC(r) {
    loading = r.id;
    failed = null;
    try {
      if (!(await loadComments(db, vals[r.id]?.comment.ids ?? []))) failed = r.id;
    } finally {
      loading = null;
    }
  }
  const scope = $derived([PERIODS.find((p) => p.key === mode)?.name, art === 'all' && st === 'all' && !q.trim() ? t('all trips') : t('filtered')].filter(Boolean).join(', '));
  const nCols = $derived(cols.length + 3);
  let c1 = $state(200);

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

<!-- SN4+ the Strava comment: one line, a tap shows it whole («weniger» folds it); «Kommentar laden» when it
     is not loaded yet; «–» when it is empty or the row has no Strava data. card: the phone card's line. -->
{#snippet comment(r, v, card)}
  {@const c = v?.comment}
  {#if c?.state === 'text'}
    {#if openC === r.id}<button type="button" class="ctog open" aria-expanded="true" onclick={() => (openC = null)}><ChevronUp size={14} aria-hidden="true" />{t('less|comment')}</button>{#if card}<span class="cwhole">{c.text}</span>{/if}
    {:else}<button type="button" class="ctog" aria-expanded="false" aria-label={t('Show the whole comment of {trip}', { trip: r.title })} onclick={() => (openC = r.id)}><span class="c1">{c.text}</span></button>{/if}
  {:else if c?.state === 'load'}
    <button type="button" class="cload" disabled={loading === r.id} onclick={() => loadC(r)}><Download size={14} aria-hidden="true" />{t('Load comment')}</button>
    {#if failed === r.id}<small class="cfail" role="status" data-comment-failed>{t('Strava is not reachable right now. Try again later.')}</small>{/if}
  {:else}
    <span class="cnone">{#if card}<MessageSquareText size={16} aria-hidden="true" />{/if}{DASH}</span>
  {/if}
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
    <span class="hbtns">
      <Btn icon={Upload} label={t('Upload ride')} href="#/debrief/ride" />
      <!-- Touren c 67: a trip from long ago, from memory, without numbers -->
      <Btn icon={History} label={t('Add an old trip')} onclick={() => (memOpen = true)} data-memory-open />
    </span>
  </header>
  {#if memOpen}<MemoryTripSheet onclose={() => (memOpen = false)} />{/if}
  <!-- Hinweistexte HT 3a (Noah 14.10.2026): the card «Was hier steht» -->
  <!-- Noah 19.10 «2a»: one card per page; the Einstieg lives in the card «Was hier steht» (its own card only while the page is empty) -->
  <HintCard page="past" intro="past" />

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
          <NeulandLine {year} />
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
    {#if colsOpen}<PastColumns hide={view.hide} onchange={(hide) => saveView({ ...view, hide })} onclose={() => (colsOpen = false)} />{/if}

    <section class="sums" aria-labelledby="sum-h">
      <h2 id="sum-h" class="sr">{t('In this period')}</h2>
      <ul class="rv-box rv-tiles tiles" aria-label={t('Sum of the rows shown')}>
        <li class="rv-tile"><b class="num">{num(rows.length)}</b><small>{tn(rows.length, 'trip|unit', 'trips|unit')}</small></li>
        <li class="rv-tile"><b class="num">{n0(sums.km)}</b><small>km</small></li>
        <li class="rv-tile"><b class="num">{n0(sums.gainM)}</b><small>{t('Climbing|hm')}</small></li>
        <li class="rv-tile"><b class="num">{num(sums.wet)}</b><small>{t('with rain')}</small></li>
      </ul>
    </section>
    <!-- «Wusstest du» WD2 (approved 18:34, «2a»): around the Earth and up the Everest, for the period chosen -->
    <EarthEverest km={sums.km} gainM={sums.gainM} />

    {#if !rows.length}
      <div class="nopast"><Empty icon={Search} title={t('No trip matches.')} text={filtered ? t('Try another word or kind.') : t('No trip in this period.')} action={filtered ? { label: t('Show all|filter'), onclick: reset, explain: t('Show all kinds') } : mode !== 'all' ? { label: t('Show all|filter'), onclick: () => (mode = 'all'), explain: t('Show all years') } : null} /></div>
    {:else}
      <!-- SN4+ SN4e: the columns from Strava, «Spalten», sideways with Tour and Zustand fixed -->
      <div class="ttop">
        <p class="tsub">{t('{trips} · {cols} columns · scrolls sideways, trip and state stay', { trips: tn(rows.length, '{n} trip', '{n} trips'), cols: num(cols.length + 2) })}</p>
        <Btn icon={Columns3} label={t('Columns')} onclick={() => (colsOpen = true)} aria-haspopup="dialog" data-columns />
      </div>
      <div class="tbox" role="region" aria-label={t('Past trips')}>
        <table class="tt" style:--c1="{c1}px">
          <thead>
            <tr>
              <th scope="col" class="first" bind:offsetWidth={c1}>{t('Trip')}</th>
              <th scope="col" class="stc">{t('State|trip')}</th>
              {#each cols as c (c.key)}<th scope="col" class:n={c.n} data-col={c.key}>{t(c.head)}</th>{/each}
              <th scope="col" class="go"><span class="sr">{t('Open')}</span></th>
            </tr>
          </thead>
          {#each groups as g (g.month)}
            <tbody>
              <tr class="mrow"><th scope="rowgroup" colspan={nCols}><span class="ms">{monthLong(g.month)}</span></th></tr>
              {#each g.rows as r (r.id)}
                {@const s = states[r.id]}
                {@const v = vals[r.id]}
                <tr data-state={s?.state}>
                  <th scope="row" class="first">
                    <a href={r.href} onclick={() => go(r)}><span class="tn">{r.title}</span>{#if r.rideProfile}<span class="mprof"><Profile points={r.rideProfile} small label="Elevation of the ride" /></span>{/if}<small>{dates(r.start, r.end)} · {what(r)}{#if on('wx') && r.rain.wet != null}<span class="ph">{` · ${rainText(r.rain, r.days)}`}</span>{/if}{#if on('temp') && (r.tmin != null || r.tmax != null)}<span class="ph">{` · ${temps(r.tmin, r.tmax)}`}</span>{/if}</small></a>
                    {#if r.learning}<span class="l1"><Lightbulb size={14} aria-hidden="true" />{r.learning}</span>{/if}
                  </th>
                  <td class="stc"><TripState state={s?.state} extra={stateExtraText(s?.extra)} /></td>
                  {#each cols as c (c.key)}
                    {#if c.key === 'km'}<td class="col n num km">{n0(r.km)}</td>
                    {:else if c.key === 'gainM'}<td class="col n num">{n0(v?.gainM)}</td>
                    {:else if c.key === 'moving'}<td class="col n num">{secs(v?.movingS)}</td>
                    {:else if c.key === 'elapsed'}<td class="col n num">{secs(v?.elapsedS)}</td>
                    {:else if c.key === 'kmh'}<td class="col n num">{n1(v?.kmh)}</td>
                    {:else if c.key === 'hrAvg'}<td class="col n num">{n0(v?.hrAvg)}</td>
                    {:else if c.key === 'hrMax'}<td class="col n num">{n0(v?.hrMax)}</td>
                    {:else if c.key === 'type'}<td class="col bk">{typeOf(v)}</td>
                    {:else if c.key === 'wx'}<td class="col wxc">{@render rainCell(r)}</td>
                    {:else if c.key === 'temp'}<td class="col n num tc">{temps(r.tmin, r.tmax)}</td>
                    {:else if c.key === 'comment'}<td class="col cm">{@render comment(r, v, false)}</td>{/if}
                  {/each}
                  <td class="pc">
                    {#if [on('km'), on('gainM'), on('moving'), on('hrAvg'), on('hrMax')].some(Boolean)}
                      <span class="pl num">
                        {#if on('km')}<span><b>{n0(r.km)}</b> km</span>{/if}
                        {#if on('gainM')}<span><b>{n0(v?.gainM)}</b> {t('Hm|col')}</span>{/if}
                        {#if on('moving')}<span><b>{secs(v?.movingS)}</b> h</span>{/if}
                        {#if on('hrAvg')}<span><b>{n0(v?.hrAvg)}</b> {t('Ø heart rate')}</span>{/if}
                        {#if on('hrMax')}<span><b>{n0(v?.hrMax)}</b> {t('max ♥')}</span>{/if}
                      </span>
                    {/if}
                    {#if on('type')}<span class="pt"><Bike size={16} aria-hidden="true" />{typeOf(v)}</span>{/if}
                    {#if on('comment')}<span class="pt pcm">{@render comment(r, v, true)}</span>{/if}
                  </td>
                  <td class="go">
                    {#if s?.open}
                      <Btn label={t('Rate|debrief')} href={r.href} onclick={() => go(r)} aria="{t('Rate|debrief')}: {r.title}" />
                    {:else}
                      <a class="chev" href={r.href} onclick={() => go(r)} tabindex="-1" aria-label={t('Open {trip}', { trip: r.title })}><ChevronRight size={18} aria-hidden="true" /></a>
                    {/if}
                  </td>
                </tr>
                {#if openC === r.id && on('comment') && v?.comment.state === 'text'}
                  <tr class="cmt" data-comment-for={r.id}>
                    <td colspan={nCols}>
                      <div class="cfull"><MessageSquareText size={18} aria-hidden="true" /><div><p>{v.comment.text}</p><small>{t('from Strava · {date}', { date: dates(r.start, r.end) })}</small></div></div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          {/each}
        </table>
      </div>
      <p class="rv-note hint"><Info size={16} aria-hidden="true" /><span>{t('Heart rate, max. heart rate, moving time, elapsed time, Ø km/h and the comment come from Strava; times without Strava from the uploaded ride. Weather and temp. from the forecast saved with the trip. Ø km/h = km over moving time. Without a value it says «–». Tap a comment to see it whole.')}</span></p>
      <p class="rv-note hint"><Info size={16} aria-hidden="true" /><span>{t('Planned trips are not here but under Trips › Overview. «Not ridden» and archived trips count nowhere.')}</span></p>
    {/if}
    <InZahlen {rows} {facts} {vals} {mode} {today} {scope} bikes={$dataQ.bikes} items={$dataQ.items} containers={$dataQ.containers} entries={$moreQ?.entries ?? []} {view} onview={saveView} hrefOf={(id) => facts.find((x) => x.id === id)?.href ?? null} go={(id) => go(facts.find((x) => x.id === id) ?? {})} />
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
  .hbtns {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
  /* position: the screen-reader text inside stays clipped by the box (it would widen the page).
     SN4+ SN4e: the table scrolls sideways inside the card; Tour and Zustand stay on the left. */
  .tbox {
    position: relative;
    padding: 4px 16px 8px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    overflow-x: auto;
  }
  .ttop {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 0 0 10px;
  }
  .tsub {
    flex: 1 1 240px;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
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
  .tt thead th.n {
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
  .tt td.pc {
    display: none;
  }
  .ph {
    display: none;
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
  .ms {
    position: sticky;
    left: 0;
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
  /* SN4+ the Strava comment: one line in the table, the whole text in the row under it */
  .cfail {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tt td.cm {
    max-width: 240px;
    min-width: 140px;
  }
  .ctog,
  .cload {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .c1 {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .ctog.open {
    color: var(--ink);
    font-weight: 500;
  }
  .cload {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .cload:disabled {
    color: var(--ink-3);
    cursor: progress;
  }
  .cnone {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-3);
  }
  .tt tr.cmt td {
    padding: 0 0 12px;
    border-top: 0;
  }
  .cfull {
    position: sticky;
    left: 0;
    display: flex;
    gap: 10px;
    max-width: min(900px, 80vw);
    padding: 12px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
  }
  .cfull :global(svg) {
    flex: none;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .cfull p {
    margin: 0;
    font-size: var(--fs-body);
    white-space: pre-line;
    overflow-wrap: break-word;
  }
  .cfull small {
    color: var(--ink-3);
    font-size: var(--fs-small);
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
  /* computer: Tour and Zustand stay on the left while the other columns scroll */
  @media (min-width: 720px) {
    .tt {
      min-width: max-content;
    }
    .tt .first,
    .tt .stc {
      position: sticky;
      z-index: 1;
      background: var(--paper);
    }
    .tt .first {
      left: 0;
      width: 200px;
      max-width: 220px;
    }
    .tt .stc {
      left: var(--c1);
      box-shadow: 6px 0 6px -6px var(--shadow);
    }
    .tt td.stc {
      white-space: nowrap;
    }
  }
  /* phone: each trip a card (name, date · weather · temp., the pill, the values, the type, the comment, «Bewerten») */
  @media (max-width: 719px) {
    .tbox {
      overflow-x: visible;
    }
    .tt thead {
      display: none;
    }
    .tt tbody tr:not(.mrow):not(.cmt) {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
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
    .tt tr.cmt {
      display: none;
    }
    .ph {
      display: inline;
    }
    .tt .first {
      min-width: 0;
    }
    .tt td.stc {
      margin-top: 4px;
    }
    .tt td.col {
      display: none;
    }
    .tt td.pc {
      display: grid;
      gap: 2px;
      margin-top: 6px;
      min-width: 0;
    }
    .pl {
      display: flex;
      flex-wrap: wrap;
      gap: 2px 10px;
      color: var(--ink-3);
    }
    .pl b {
      color: var(--ink);
      font-weight: 600;
    }
    .pt {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      color: var(--ink-2);
    }
    .pt > :global(svg) {
      flex: none;
      color: var(--ink-3);
    }
    .pcm {
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .pcm .ctog {
      width: 100%;
    }
    .cwhole {
      display: block;
      color: var(--ink);
      white-space: pre-line;
      overflow-wrap: break-word;
    }
    .tt td.go {
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
