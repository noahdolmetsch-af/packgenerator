<script>
  /**
   * v0.61.0 R2 «Logbuch» (Noah ★a): a diary of ALL trips, newest first, in one flat list: date, trip,
   * km, Hm, time, weather (rain, temperatures), the sentence for next time and the notes on the way,
   * and the logbook's own entries (the old trips of the Excel, read only). Filter by year and area,
   * and a search. A tap on a trip opens it. Entries: review/logbook.js.
   * SN2 «Seiten neu» (mockup approved 13.10.2026): every trip row carries its state pill (Abgeschlossen,
   * Bewertet) with a quiet icon in front, filter chips per state, the year as a toggle instead of a
   * drop-down, and one line under the title: how many entries, how many debriefs are missing.
   * SN2+ SN2g (mockup approved 13.10.2026, answer 2b): two more chip rows, Velo and Reiseart, each with
   * its count, combinable with the state chips, and «Filter löschen». Every row names its bike and kind.
   * The chips are not remembered: the next visit shows «Alle» again.
   */
  import { liveQuery } from 'dexie';
  import Empty from '../ui/Empty.svelte';
  import Skeleton from '../ui/Skeleton.svelte';
  import { db } from '../db.js';
  import { loadReview } from './load.js';
  import { tripFacts } from './rueckblick.js';
  import { logEntries, logYears, logAreas, logFilter } from './logbook.js';
  import { homeTrips } from '../home/heute.js';
  import { n0, hours, temps, dates, rainText, DASH } from './fmt.js';
  import { domainName } from '../domains.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { bestValues, hmm } from '../tripsboard.js';
  import { ChevronRight, CloudRain, Sun, Search, Trophy, Lightbulb, Gauge, Archive, Flag, Star, BookOpen } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import TripState from '../ui/TripState.svelte';
  import StateChips from '../ui/StateChips.svelte';
  import { factStates, factCounts, matchesState } from './state.js';
  import { stateExtraText } from '../tripstatetext.js';
  import { paceOf } from '../pace.js';
  import { chipCounts, logBikeOf } from './werte.js';
  import { Bike, Tag, X } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import MoreActions from '../ui/MoreActions.svelte';
  import { offerRename } from '../ui/rename.svelte.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { Pencil, Trash2 } from '@lucide/svelte';
  import './review.css';

  const today = localDay();
  const dataQ = liveQuery(async () => ({ ...(await loadReview(db)), events: await db.events.toArray(), notes: await db.notes.toArray() }));
  const data = $derived($dataQ ?? null);
  const facts = $derived(data ? tripFacts({ ...data, trips: homeTrips(data.trips), today }) : []);
  const entries = $derived(data ? logEntries({ facts, events: data.events, debriefs: data.debriefs, notes: data.notes }) : []);
  // SN2: the state of every trip row, the chips per state and the missing debriefs
  const states = $derived(data ? factStates(facts, { debriefs: data.debriefs, rides: data.rides, today }) : {});
  const missing = $derived(Object.values(states).filter((s) => s.open).length);
  let st = $state('all');
  const pace = $derived(paceOf(data?.pace ?? null));
  const years = $derived(logYears(entries));
  const areas = $derived(logAreas(entries));

  let year = $state('all');
  let area = $state('all');
  let q = $state('');
  // SN2+ SN2g: the bike filter; every chip row counts with the other filters on (not remembered)
  let bike = $state('all');
  const base = $derived(logFilter(entries, { year, area, bike, q }));
  const inState = (list) => list.filter((e) => matchesState(states, e.id, st));
  const bikeChips = $derived(chipCounts(inState(logFilter(entries, { year, area, q })), logBikeOf));
  const areaChips = $derived(chipCounts(inState(logFilter(entries, { year, bike, q })), (e) => e.domain));
  const allBikes = $derived(chipCounts(entries, logBikeOf));
  const filtered = $derived(st !== 'all' || bike !== 'all' || area !== 'all');
  const clearFilters = () => ((st = 'all'), (bike = 'all'), (area = 'all'));
  const counts = $derived(factCounts(base, states));
  const shown = $derived(base.filter((e) => matchesState(states, e.id, st)));
  const YEARS = $derived([...years.map((y) => ({ key: y, name: y })), { key: 'all', name: t('All|period') }]);
  // v0.109.0 Design-Refresh P6 (T20): the best values of all trips, the same as on Touren
  const best = $derived(data ? bestValues({ trips: data.trips, rides: data.rides, today, period: 'all' }) : null);
  const AREAS = $derived([{ key: 'all', name: t('All|period'), n: null }, ...areas.map((a) => ({ key: a, name: t(domainName(a)), n: areaChips.find((x) => x.key === a)?.n ?? 0 }))]);

  /** A year shows as it is ("2025"), a full date as month and year; no date: –. */
  const evDate = (ev) => (!ev.date ? (ev.dateText ?? DASH) : /^\d{4}$/.test(ev.date) ? ev.date : /^\d{4}-\d{2}-\d{2}/.test(ev.date) ? new Date(`${ev.date.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { month: 'short', year: 'numeric' }) : ev.date);
  const factsOf = (e) =>
    [
      e.km != null ? `${n0(e.km)} km` : '',
      e.gainM != null ? `${n0(e.gainM)} Hm` : '',
      e.movingH ? `${hours(e.movingH)} h` : '',
      e.tmin != null || e.tmax != null ? temps(e.tmin, e.tmax) : '',
    ].filter(Boolean);

  // «Alles selbst bearbeiten» (Noah 19.10.2026): an old logbook entry (from the import) can be renamed and deleted
  let renamingEv = $state(null); // the db.events record
  async function renameEv(ev, name) {
    const was = ev.name ?? '';
    if (!name || name === was) return;
    await db.events.update(ev.id, { name });
    offerRename(name, () => db.events.update(ev.id, { name: was }));
  }
  async function removeEv(ev) {
    const name = ev.name || t('Entry');
    if ((await askDelete({ title: t('Delete the entry "{name}"?', { name }), text: t('It is gone from the logbook. You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    await deleteWithUndo({
      run: async () => {
        const rec = await db.events.get(ev.id);
        await db.events.delete(ev.id);
        return rec;
      },
      undo: (rec) => rec && db.events.put(rec),
      text: t('"{name}" deleted.', { name }),
      name,
    });
  }
  const evActions = (ev) => [
    { name: t('Rename'), icon: Pencil, run: () => (renamingEv = ev) },
    { name: t('Delete'), icon: Trash2, run: () => removeEv(ev) },
  ];
</script>

<!-- v0.109.0 Design-Refresh P6 (T20 «Logbuch», approved 12.10.2026): two columns on a computer. Left the search,
     Jahr and Reiseart as chips, the count and the list in one card; right the best values from all trips
     (the same as on Touren) and «Mehr».
     SN2: the line under the title, the year as a toggle beside the search, the state chips, a pill per row. -->
{#if data}<p class="page-sub lbsub num">{[tn(entries.length, '{n} entry', '{n} entries'), missing ? tn(missing, '{n} debrief missing', '{n} debriefs missing') : ''].filter(Boolean).join(' · ')}</p>{/if}
<div class="rv-lay lb">
  <section id="logbook" class="logbook rv-col" aria-labelledby="log-h">
    <h2 id="log-h" class="sr">{t('Logbook')}</h2>
    <div class="tools">
      {#if entries.length > 5}<label class="rv-search"><Search size={18} aria-hidden="true" /><input type="search" placeholder={t('Search the logbook')} bind:value={q} aria-label={t('Search the logbook')} /></label>{/if}
      {#if years.length}<Seg full={false} label={t('Year')} value={year} options={YEARS} onchange={(v) => (year = v)} />{/if}
    </div>
    <div class="filters">
      {#if counts.done || counts.rated}<StateChips value={st} {counts} onchange={(v) => (st = v)} />{/if}
    </div>
    <!-- SN2+ SN2g: Velo and Reiseart, each with its count -->
    {#if allBikes.length > 1 || areas.length > 1}
      <div class="lbf">
        {#if allBikes.length > 1}
          <div class="rv-chips" role="group" aria-label={t('Bike')}>
            <span class="rv-lbl lbl-i" aria-hidden="true"><Bike size={14} />{t('Bike')}</span>
            <button type="button" class="rv-chip" aria-pressed={bike === 'all'} onclick={() => (bike = 'all')}>{t('All|period')}</button>
            {#each allBikes as b (b.key)}<button type="button" class="rv-chip" aria-pressed={bike === b.key} onclick={() => (bike = bike === b.key ? 'all' : b.key)}>{b.key}<span class="cn num">{bikeChips.find((x) => x.key === b.key)?.n ?? 0}</span></button>{/each}
          </div>
        {/if}
        {#if areas.length > 1}
          <div class="rv-chips" role="group" aria-label={t('Area')}>
            <span class="rv-lbl lbl-i" aria-hidden="true"><Tag size={14} />{t('Area')}</span>
            {#each AREAS as a (a.key)}<button type="button" class="rv-chip" aria-pressed={area === a.key} onclick={() => (area = a.key !== 'all' && area === a.key ? 'all' : a.key)}>{a.name}{#if a.n != null}<span class="cn num">{a.n}</span>{/if}</button>{/each}
          </div>
        {/if}
      </div>
    {/if}
    <div>
      {#if year !== 'all' || filtered || q.trim()}<div class="cline"><p class="count num" role="status">{tn(shown.length, '{n} entry', '{n} entries')} · {t('of {n}', { n: entries.length })}</p>{#if filtered}<button type="button" class="clr" onclick={clearFilters}><X size={14} aria-hidden="true" />{t('Clear filters')}</button>{/if}</div>{/if}

      {#if !data}
        <Skeleton rows={4} />
      {:else}
        <ul class="log rv-box">
          {#each shown as e (e.id)}
            {@const fs = factsOf(e)}
            {@const wx = rainText(e.rain, e.days)}
            {@const s = states[e.id]}
            <li class="e {e.kind}">
              {#if e.fact}
                <a class="row" href={e.fact.href} onclick={() => e.fact.trip && openTrip(e.fact.trip.id)} data-state={s?.state}>
                  <span class="lic {s?.state}" aria-hidden="true">{#if s?.state === 'rated'}<Star size={18} />{:else}<Flag size={18} />{/if}</span>
                  <span class="body">
                    <span class="tt"><b>{e.title || DASH}</b>{#if e.kind === 'ride'}<span class="rv-tag">{t('Uploaded ride')}</span>{/if}</span>
                    <span class="facts num"><span class="when">{dates(e.date, e.end)}</span>{#if e.fact.bike}<span class="bk">{e.fact.bike}</span>{/if}<span class="kd">{t(domainName(e.domain))}</span>{#if wx !== DASH}<span class="wx">{#if e.rain?.wet}<CloudRain size={14} aria-hidden="true" />{:else}<Sun size={14} aria-hidden="true" />{/if}{wx}</span>{/if}{#if fs.length}<span>{fs.join(' · ')}</span>{/if}</span>
                    {#each e.notes as n (n)}<span class="note">{n}</span>{/each}
                  </span>
                  <span class="lpill"><TripState state={s?.state} extra={stateExtraText(s?.extra)} /></span>
                  <ChevronRight class="chev" size={18} aria-hidden="true" />
                </a>
              {:else if e.ev.source === 'excel'}
                <div class="row ro">
                  <span class="lic" aria-hidden="true"><BookOpen size={18} /></span>
                  <span class="body">
                    <span class="tt lt"><b>{e.title}</b><span class="lsrc">{t('from Excel')}</span></span>
                    <span class="facts num"><span class="when ld">{evDate(e.ev)}</span></span>
                    {#each e.notes as n (n)}<span class="note ln">{n}</span>{/each}
                  </span>
                  <span class="evmore"><MoreActions title={e.title} label={t('More for {name}', { name: e.title || t('Entry') })} actions={evActions(e.ev)} small /></span>
                </div>
              {:else}
                <details class="row ev">
                  <summary><span class="lic" aria-hidden="true"><BookOpen size={18} /></span><span class="body"><span class="tt"><b>{e.title}</b></span><span class="facts num"><span class="when">{e.ev.dateText ?? evDate(e.ev)}</span>{#if e.ev.type}<span>{e.ev.type}</span>{/if}</span></span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
                  <dl>
                    {#if e.ev.bike && e.ev.bike !== '–'}<dt>{t('Bike')}</dt><dd>{e.ev.bike}</dd>{/if}
                    {#if e.ev.bags && e.ev.bags !== '–'}<dt>{t('Bags')}</dt><dd>{e.ev.bags}</dd>{/if}
                    {#if e.ev.result}<dt>{t('What worked')}</dt><dd>{e.ev.result}</dd>{/if}
                    {#if e.ev.learnings}<dt>{t('Learnings')}</dt><dd>{e.ev.learnings}</dd>{/if}
                    {#if e.ev.note}<dt>{t('Note')}</dt><dd>{e.ev.note}</dd>{/if}
                  </dl>
                  <p class="evacts"><button type="button" class="btn sm" onclick={() => (renamingEv = e.ev)}><Pencil size={14} aria-hidden="true" />{t('Rename')}</button><button type="button" class="btn sm del" onclick={() => removeEv(e.ev)}><Trash2 size={14} aria-hidden="true" />{t('Delete')}</button></p>
                </details>
              {/if}
            </li>
          {:else}
            <li class="none"><Empty text={entries.length ? t('Nothing matches.') : t('No entries yet.')} /></li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>

  <div class="rv-col">
    <section class="rv-sec" aria-labelledby="lbmore-h">
      <div class="rv-h"><div><h2 id="lbmore-h">{t('More')}</h2></div></div>
      <ul class="rv-box">
        <li><a class="rv-row" href="#/debrief/learnings"><span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span><span class="rv-m"><span class="rv-t">{t('Learned|review')}</span>{#if data}<span class="rv-s num">{tn(data.learnings.length, '{n} learning', '{n} learnings')}</span>{/if}</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
        <li><a class="rv-row" href="#/debrief/pace"><span class="rv-ic" aria-hidden="true"><Gauge size={18} /></span><span class="rv-m"><span class="rv-t">{t('Your pace')}</span>{#if data}<span class="rv-s num">{pace.mine ? t('{kmh} km/h · your rule', { kmh: num(pace.kmh) }) : t('{kmh} km/h · standard rule', { kmh: num(pace.kmh) })}</span>{/if}</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
        <li><a class="rv-row" href="#/pack/past"><span class="rv-ic" aria-hidden="true"><Archive size={18} /></span><span class="rv-m"><span class="rv-t">{t('Past trips')}</span><span class="rv-s">{t('as a table')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
      </ul>
    </section>
    {#if best?.any}
      <section class="rv-sec best" aria-labelledby="best-h">
        <div class="rv-h"><div><h2 id="best-h">{t('Best values')}</h2><p class="rv-sub">{t('from all trips')}</p></div></div>
        <ul class="rv-box">
          {#if best.longest}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Trophy size={16} /></span><span class="rv-m"><span class="rv-t">{t('Longest trip')}</span><span class="rv-s">{best.longest.title}{best.longest.days > 1 ? ` · ${tn(best.longest.days, '{n} day', '{n} days')}` : ''}</span></span><b class="rv-v num">{num(best.longest.km)} km</b></li>{/if}
          {#if best.climb}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Trophy size={16} /></span><span class="rv-m"><span class="rv-t">{t('Most climbing')}</span><span class="rv-s">{best.climb.title}</span></span><b class="rv-v num">{num(best.climb.m)} Hm</b></li>{/if}
          {#if best.time}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Trophy size={16} /></span><span class="rv-m"><span class="rv-t">{t('Longest riding time')}</span><span class="rv-s">{best.time.title}</span></span><b class="rv-v num">{hmm(best.time.h)} h</b></li>{/if}
          {#if best.furthest}<li class="rv-row"><span class="rv-ic" aria-hidden="true"><Trophy size={16} /></span><span class="rv-m"><span class="rv-t">{t('Furthest day')}</span><span class="rv-s">{best.furthest.title}</span></span><b class="rv-v num">{num(best.furthest.km)} km</b></li>{/if}
        </ul>
      </section>
    {/if}
  </div>
</div>

{#if renamingEv}<RenameSheet kicker={t('Logbook')} title={t('Rename entry')} value={renamingEv.name ?? ''} onsave={(v) => renameEv(renamingEv, v)} onclose={() => (renamingEv = null)} />{/if}

<style>
  /* SN2: the search and the year toggle in one line, then the state chips and the area */
  .lbsub {
    margin: -10px 0 16px;
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .tools .rv-search {
    flex: 1 1 260px;
  }
  .tools :global(.seg) {
    flex: none;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin: 12px 0 14px;
  }
  /* SN2+ SN2g: the two chip rows Velo and Reiseart, the count with «Filter löschen» */
  .lbf {
    display: grid;
    gap: 8px;
    margin: 0 0 14px;
  }
  .lbl-i {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 5.5em;
  }
  .cn {
    color: inherit;
    opacity: 0.7;
    font-weight: 400;
  }
  .cline {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 4px 12px;
  }
  .cline .count {
    margin-bottom: 0;
  }
  .clr {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .clr:hover {
    text-decoration: underline;
  }
  .count {
    margin: 0 2px 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .log {
    padding: 0;
    overflow: hidden;
  }
  .e + .e {
    border-top: 1px solid var(--line);
  }
  .row {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto auto;
    gap: 2px 12px;
    align-items: center;
    min-height: 44px;
    padding: 12px 16px;
    box-sizing: border-box;
    color: var(--ink);
    text-decoration: none;
  }
  a.row:hover {
    background: var(--paper-2);
  }
  a.row:hover .tt b {
    text-decoration: underline;
  }
  .row.ro {
    grid-template-columns: 34px minmax(0, 1fr);
  }
  details.row {
    display: block;
  }
  details.row summary {
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: center;
    min-height: 44px;
    list-style: none;
    cursor: pointer;
  }
  details.row summary::-webkit-details-marker {
    display: none;
  }
  details[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .lic {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-3);
    align-self: start;
  }
  .lic.done {
    background: var(--st-done-soft);
    color: var(--st-done);
  }
  .lic.rated {
    background: var(--st-rated-soft);
    color: var(--st-rated);
  }
  .lpill {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
  }
  /* phone: the pill under the trip's name */
  @media (max-width: 559px) {
    .row {
      grid-template-columns: 34px minmax(0, 1fr) auto;
    }
    .row .lpill {
      grid-column: 2;
      grid-row: 2;
      justify-content: flex-start;
    }
    .row :global(.chev) {
      grid-column: 3;
      grid-row: 1 / span 2;
    }
  }
  .when {
    color: var(--ink-2);
  }
  .body {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .tt {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    overflow-wrap: break-word;
    min-width: 0;
  }
  .tt b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .wx {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .wx :global(svg) {
    color: var(--ink-3);
  }
  .note {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-style: italic;
    white-space: pre-line;
    overflow-wrap: break-word;
  }
  .lsrc {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .row :global(.chev) {
    color: var(--ink-3);
    align-self: center;
    transition: transform 0.15s;
  }
  dl {
    display: grid;
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 6px 12px;
    margin: 8px 0 4px;
  }
  dt {
    font-size: var(--fs-small);
    font-weight: 700;
    color: var(--ink-3);
  }
  dd {
    margin: 0;
    overflow-wrap: break-word;
  }
  .none {
    padding: 12px 16px;
  }
  .muted {
    color: var(--ink-3);
  }
  .best .rv-v {
    color: var(--ink);
    font-size: var(--fs-body);
    font-weight: 600;
  }
  .evmore {
    flex: none;
    margin-left: auto;
  }
  .evacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 0;
  }
  .evacts .del {
    color: var(--bad);
  }
</style>
