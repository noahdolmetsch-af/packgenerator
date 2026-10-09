<script>
  /**
   * v0.58.0 R2 «Logbuch» (Noah ★a): a diary of ALL trips, newest first, in one flat list: date, trip,
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
  import { t, tn, locale } from '../i18n.svelte.js';
  import Seg from '../ui/Seg.svelte';
  import { ChevronRight, CloudRain, Sun } from '@lucide/svelte';

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

<section id="logbook" class="logbook" aria-labelledby="log-h">
  <h2 id="log-h" class="sr">{t('Logbook')}</h2>
  <div class="filters">
    <label class="yr"><span class="lbl">{t('Year')}</span>
      <select class="sel" bind:value={year} aria-label={t('Year')}>
        <option value="all">{t('All years')}</option>
        {#each years as y (y)}<option value={y}>{y}</option>{/each}
      </select>
    </label>
    {#if areas.length > 1}<Seg full={false} label={t('Area')} value={area} options={AREAS} onchange={(v) => (area = v)} />{/if}
    {#if entries.length > 5}<input class="inp q" type="search" placeholder={t('Search the logbook')} bind:value={q} aria-label={t('Search the logbook')} />{/if}
  </div>
  <p class="count num" role="status">{tn(shown.length, '{n} entry', '{n} entries')}{year !== 'all' || area !== 'all' || q.trim() ? ` · ${t('of {n}', { n: entries.length })}` : ''}</p>

  {#if !data}
    <p class="muted">{t('Loading…')}</p>
  {:else}
    <ul class="log">
      {#each shown as e (e.id)}
        {@const fs = factsOf(e)}
        {@const wx = rainText(e.rain, e.days)}
        <li class="e {e.kind}">
          {#if e.fact}
            <a class="row" href={e.fact.href} onclick={() => e.fact.trip && openTrip(e.fact.trip.id)}>
              <span class="when num">{dates(e.date, e.end)}</span>
              <span class="body">
                <span class="tt"><b>{e.title || DASH}</b>{#if e.domain !== BIKEPACKING}<span class="pill">{t(domainName(e.domain))}</span>{/if}{#if e.kind === 'ride'}<span class="pill">{t('Uploaded ride')}</span>{/if}</span>
                {#if fs.length || wx !== DASH}<span class="facts num">{#if wx !== DASH}<span class="wx">{#if e.rain?.wet}<CloudRain size={14} aria-hidden="true" />{:else}<Sun size={14} aria-hidden="true" />{/if}{wx}</span>{/if}{fs.join(' · ')}</span>{/if}
                {#each e.notes as n (n)}<span class="note">{n}</span>{/each}
              </span>
              <ChevronRight class="chev" size={18} aria-hidden="true" />
            </a>
          {:else if e.ev.source === 'excel'}
            <div class="row ro">
              <span class="when ld num">{evDate(e.ev)}</span>
              <span class="body">
                <span class="tt lt"><b>{e.title}</b></span>
                {#each e.notes as n (n)}<span class="note ln">{n}</span>{/each}
                <span class="lsrc">{t('from Excel')}</span>
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
</section>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
  .yr {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .yr .lbl {
    align-self: center;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .yr .sel {
    min-height: 44px;
  }
  .q {
    flex: 1 1 200px;
    min-width: 0;
    min-height: 44px;
    box-sizing: border-box;
  }
  .count {
    margin: 8px 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .log {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
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
    padding: 12px 14px;
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
    color: var(--ink-3);
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
    color: var(--ink-3);
    font-size: var(--fs-small);
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
    padding: 12px 14px;
  }
  .muted {
    color: var(--ink-3);
  }
</style>
