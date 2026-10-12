<script>
  /**
   * v0.61.0 R2 «Logbuch» (Noah ★a): a diary of ALL trips, newest first, in one flat list: date, trip,
   * km, Hm, time, weather (rain, temperatures), the sentence for next time and the notes on the way,
   * and the logbook's own entries (the old trips of the Excel, read only). Filter by year and area,
   * and a search. A tap on a trip opens it. Entries: review/logbook.js.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { loadReview } from './load.js';
  import { tripFacts } from './rueckblick.js';
  import { logEntries, logYears, logAreas, logFilter } from './logbook.js';
  import { homeTrips } from '../home/heute.js';
  import { n0, hours, temps, dates, rainText, DASH } from './fmt.js';
  import { domainName, BIKEPACKING } from '../domains.js';
  import { openTrip } from '../nav.js';
  import { localDay } from '../localday.js';
  import { t, tn, num, locale } from '../i18n.svelte.js';
  import { bestValues, hmm } from '../tripsboard.js';
  import { ChevronRight, CloudRain, Sun, Search, Trophy, Lightbulb, Gauge, Route } from '@lucide/svelte';
  import './review.css';

  const today = localDay();
  const dataQ = liveQuery(async () => ({ ...(await loadReview(db)), events: await db.events.toArray(), notes: await db.notes.toArray() }));
  const data = $derived($dataQ ?? null);
  const entries = $derived(data ? logEntries({ facts: tripFacts({ ...data, trips: homeTrips(data.trips), today }), events: data.events, debriefs: data.debriefs, notes: data.notes }) : []);
  const years = $derived(logYears(entries));
  const areas = $derived(logAreas(entries));

  let year = $state('all');
  let area = $state('all');
  let q = $state('');
  const shown = $derived(logFilter(entries, { year, area, q }));
  // v0.109.0 Design-Refresh P6 (T20): the best values of all trips, the same as on Touren
  const best = $derived(data ? bestValues({ trips: data.trips, rides: data.rides, today, period: 'all' }) : null);
  const AREAS = $derived([{ key: 'all', name: t('All|period') }, ...areas.map((a) => ({ key: a, name: t(domainName(a)) }))]);

  /** A year shows as it is ("2025"), a full date as month and year; no date: –. */
  const evDate = (ev) => (!ev.date ? (ev.dateText ?? DASH) : /^\d{4}$/.test(ev.date) ? ev.date : /^\d{4}-\d{2}-\d{2}/.test(ev.date) ? new Date(`${ev.date.slice(0, 10)}T12:00:00`).toLocaleDateString(locale(), { month: 'short', year: 'numeric' }) : ev.date);
  const factsOf = (e) =>
    [
      e.km != null ? `${n0(e.km)} km` : '',
      e.gainM != null ? `${n0(e.gainM)} Hm` : '',
      e.movingH ? `${hours(e.movingH)} h` : '',
      e.tmin != null || e.tmax != null ? temps(e.tmin, e.tmax) : '',
    ].filter(Boolean);
</script>

<!-- v0.109.0 Design-Refresh P6 (T20 «Logbuch», approved 12.10.2026): two columns on a computer. Left the search,
     Jahr and Reiseart as chips, the count and the list in one card; right the best values from all trips
     (the same as on Touren) and «Mehr». -->
<div class="rv-lay lb">
  <section id="logbook" class="logbook rv-col" aria-labelledby="log-h">
    <h2 id="log-h" class="sr">{t('Logbook')}</h2>
    {#if entries.length > 5}<label class="rv-search"><Search size={18} aria-hidden="true" /><input type="search" placeholder={t('Search the logbook')} bind:value={q} aria-label={t('Search the logbook')} /></label>{/if}
    <div class="filters">
      <label class="yr"><span class="rv-lbl">{t('Year')}</span>
        <select class="sel" bind:value={year} aria-label={t('Year')}>
          <option value="all">{t('All years')}</option>
          {#each years as y (y)}<option value={y}>{y}</option>{/each}
        </select>
      </label>
      {#if areas.length > 1}
        <div class="rv-chips" role="group" aria-label={t('Area')}>
          <span class="rv-lbl" aria-hidden="true">{t('Area')}</span>
          {#each AREAS as a (a.key)}<button type="button" class="rv-chip" aria-pressed={area === a.key} onclick={() => (area = a.key)}>{a.name}</button>{/each}
        </div>
      {/if}
    </div>
    <div>
      <p class="count num" role="status">{tn(shown.length, '{n} entry', '{n} entries')}{year !== 'all' || area !== 'all' || q.trim() ? ` · ${t('of {n}', { n: entries.length })}` : ''}</p>

      {#if !data}
        <p class="muted">{t('Loading…')}</p>
      {:else}
        <ul class="log rv-box">
          {#each shown as e (e.id)}
            {@const fs = factsOf(e)}
            {@const wx = rainText(e.rain, e.days)}
            <li class="e {e.kind}">
              {#if e.fact}
                <a class="row" href={e.fact.href} onclick={() => e.fact.trip && openTrip(e.fact.trip.id)}>
                  <span class="when num">{dates(e.date, e.end)}</span>
                  <span class="body">
                    <span class="tt"><b>{e.title || DASH}</b>{#if e.domain !== BIKEPACKING}<span class="rv-tag">{t(domainName(e.domain))}</span>{/if}{#if e.kind === 'ride'}<span class="rv-tag">{t('Uploaded ride')}</span>{/if}</span>
                    {#if fs.length || wx !== DASH}<span class="facts num">{#if wx !== DASH}<span class="wx">{#if e.rain?.wet}<CloudRain size={14} aria-hidden="true" />{:else}<Sun size={14} aria-hidden="true" />{/if}{wx}</span>{/if}{fs.join(' · ')}</span>{/if}
                    {#each e.notes as n (n)}<span class="note">{n}</span>{/each}
                  </span>
                  <ChevronRight class="chev" size={18} aria-hidden="true" />
                </a>
              {:else if e.ev.source === 'excel'}
                <div class="row ro">
                  <span class="when ld num">{evDate(e.ev)}</span>
                  <span class="body">
                    <span class="tt lt"><b>{e.title}</b><span class="lsrc">{t('from Excel')}</span></span>
                    {#each e.notes as n (n)}<span class="note ln">{n}</span>{/each}
                  </span>
                </div>
              {:else}
                <details class="row ev">
                  <summary><span class="when num">{e.ev.dateText ?? evDate(e.ev)}</span><span class="body"><span class="tt"><b>{e.title}</b></span>{#if e.ev.type}<span class="facts">{e.ev.type}</span>{/if}</span><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
                  <dl>
                    {#if e.ev.bike && e.ev.bike !== '–'}<dt>{t('Bike')}</dt><dd>{e.ev.bike}</dd>{/if}
                    {#if e.ev.bags && e.ev.bags !== '–'}<dt>{t('Bags')}</dt><dd>{e.ev.bags}</dd>{/if}
                    {#if e.ev.result}<dt>{t('What worked')}</dt><dd>{e.ev.result}</dd>{/if}
                    {#if e.ev.learnings}<dt>{t('Learnings')}</dt><dd>{e.ev.learnings}</dd>{/if}
                    {#if e.ev.note}<dt>{t('Note')}</dt><dd>{e.ev.note}</dd>{/if}
                  </dl>
                </details>
              {/if}
            </li>
          {:else}
            <li class="none"><p class="muted">{entries.length ? t('Nothing matches.') : t('No entries yet.')}</p></li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>

  <div class="rv-col">
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
    <section class="rv-sec" aria-labelledby="lbmore-h">
      <div class="rv-h"><div><h2 id="lbmore-h">{t('More')}</h2></div></div>
      <ul class="rv-box">
        <li><a class="rv-row" href="#/debrief/learnings"><span class="rv-ic" aria-hidden="true"><Lightbulb size={18} /></span><span class="rv-m"><span class="rv-t">{t('Learned|review')}</span>{#if data}<span class="rv-s num">{tn(data.learnings.length, '{n} learning', '{n} learnings')}</span>{/if}</span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
        <li><a class="rv-row" href="#/debrief/pace"><span class="rv-ic" aria-hidden="true"><Gauge size={18} /></span><span class="rv-m"><span class="rv-t">{t('Your pace')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
        <li><a class="rv-row" href="#/pack/past"><span class="rv-ic" aria-hidden="true"><Route size={18} /></span><span class="rv-m"><span class="rv-t">{t('All past trips')}</span></span><ChevronRight class="rv-chev" size={18} aria-hidden="true" /></a></li>
      </ul>
    </section>
  </div>
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
  .yr {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .yr .rv-lbl {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .yr .sel {
    min-height: 44px;
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
    grid-template-columns: 7.5em minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: start;
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
    grid-template-columns: 7.5em minmax(0, 1fr);
  }
  details.row {
    display: block;
  }
  details.row summary {
    display: grid;
    grid-template-columns: 7.5em minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: start;
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
  @media (max-width: 559px) {
    .row,
    details.row summary {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .row.ro {
      grid-template-columns: minmax(0, 1fr);
    }
    .when {
      grid-column: 1;
      grid-row: 1;
    }
    .body {
      grid-column: 1;
      grid-row: 2;
    }
    .row :global(.chev),
    details.row summary :global(.chev) {
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: center;
    }
  }
  .when {
    color: var(--ink-2);
    font-size: var(--fs-small);
    padding-top: 2px;
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
</style>
