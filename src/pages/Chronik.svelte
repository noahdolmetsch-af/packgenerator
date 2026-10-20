<script>
  /**
   * Paket M «Aus Touren lernen», #1027 «Chronik» (Noah «1b»: «alles auf einer Zeitachse (Fahrten, Pflege,
   * Meditation, Notizen) und eine Seite pro Monat, Filter Velo»). #/chronik, #/chronik/<YYYY-MM>.
   * On top «Früher um diese Zeit» (the Chronik-Karte), then the filter chips, the month with arrows and a jump
   * bar of every month that has entries, then the days of the month, newest first. Reading only.
   * The chosen filter is remembered on this device (a convenience; without storage it starts at «Alle»).
   */
  import { liveQuery } from 'dexie';
  import { Bike, Route, Activity, Wrench, Flower2, StickyNote, ChevronLeft, ChevronRight, History } from '@lucide/svelte';
  import PathHead from '../lib/ui/PathHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import ChronikKarte from '../lib/lernen/ChronikKarte.svelte';
  import { db } from '../lib/db.js';
  import { homeTrips } from '../lib/home/heute.js';
  import { timeline, monthPage, CHRONIK_FILTERS, FILTER_KEYS } from '../lib/lernen/zeitachse.js';
  import { localDay } from '../lib/localday.js';
  import { dates, monthLong, monthShort } from '../lib/review/fmt.js';
  import { t, tn, num } from '../lib/i18n.svelte.js';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import '../lib/review/review.css';

  let { month: start = null } = $props();
  const today = localDay();
  const dataQ = liveQuery(async () => {
    const [trips, debriefs, rides, activities, visits, maintenance, flowLog, notes, bikes] = await Promise.all([db.trips.toArray(), db.debriefs.toArray(), db.rides.toArray(), db.activities.toArray(), db.visits.toArray(), db.maintenance.toArray(), db.flowLog.toArray(), db.notes.toArray(), db.bikes.toArray()]);
    return { trips: homeTrips(trips), debriefs, rides, activities, visits, maintenance, flowLog, notes, bikes };
  });
  const data = $derived($dataQ);
  const entries = $derived(data ? timeline({ ...data, today }) : []);

  const FKEY = 'chronik.filter';
  const readFilter = () => {
    try {
      const v = localStorage.getItem(FKEY);
      return FILTER_KEYS.includes(v) ? v : 'all';
    } catch {
      return 'all';
    }
  };
  let filter = $state(readFilter());
  function pickFilter(k) {
    filter = k;
    try {
      localStorage.setItem(FKEY, k);
    } catch {
      /* private mode: the filter is not remembered */
    }
  }
  // svelte-ignore state_referenced_locally (the month of the address when the page opens)
  let month = $state(/^\d{4}-\d\d$/.test(start ?? '') ? start : null);
  const page = $derived(monthPage(entries, month, filter));
  const at = $derived(page.months.findIndex((m) => m.month === page.month));
  function go(m) {
    month = m;
    try {
      history.replaceState(history.state, '', `#/chronik/${m}`);
    } catch {
      /* the address stays */
    }
  }
  // the jump bar: the months of the shown year, and one chip per other year (its newest month)
  const yearOf = (m) => m?.slice(0, 4);
  const years = $derived([...new Set(page.months.map((m) => yearOf(m.month)))]);
  const sameYear = $derived(page.months.filter((m) => yearOf(m.month) === yearOf(page.month)));

  const ICON = { trip: Route, ride: Bike, activity: Activity, care: Wrench, meditation: Flower2, note: StickyNote };
  function words(e) {
    if (e.kind === 'trip') return { title: e.title, sub: e.note || (e.days > 1 ? tn(e.days, '{n} day', '{n} days') : t('Trip|chronik')) };
    if (e.kind === 'ride') return { title: e.title || t('Ride|chronik'), sub: t('Ride|chronik') };
    if (e.kind === 'activity') return { title: e.title || t('Activity|chronik'), sub: t('Activity|chronik') };
    if (e.kind === 'care') return { title: e.title || t('Workshop visit'), sub: [e.sub, e.parts ? tn(e.parts, '{n} job', '{n} jobs') : ''].filter(Boolean).join(' · ') || t('Care|chronik') };
    if (e.kind === 'meditation') return { title: t('Meditation|chronik'), sub: '' };
    return { title: e.title, sub: t('Note|chronik') };
  }
  const value = (e) => (e.km ? `${num(Math.round(e.km))} km` : e.min ? t('{n} min', { n: num(e.min) }) : '');
  // Gesamttest 20.10.2026 (C11): a busy month was 10 phone screens: 7 days first, then «n weitere zeigen»
  const PER_MONTH = 7;
  let openMonth = $state(null);
  const daysShown = $derived(openMonth === `${page.month}|${filter}` ? page.days : page.days.slice(0, PER_MONTH));
  const filterName = $derived(t(CHRONIK_FILTERS.find((f) => f.key === filter)?.name ?? 'All|chronik'));
</script>

<div class="rv-page chronik">
  <!-- Impeccable 20.10.2026 P1: a sub-page of Rückblick, so it has the path back -->
  <PathHead crumbs={[{ label: t('Trips|place'), href: '#/trips' }, { label: t('Look back|page'), href: '#/debrief' }]} title={t('Chronicle')} sub={t('Everything on one time line: trips, rides, bike care, meditation and notes, one page per month.')} />
  <AreaIntro place="chronik" />

  {#if data}
    <div class="karte"><ChronikKarte trips={data.trips} debriefs={data.debriefs} rides={data.rides} activities={data.activities} {today} frame="tile" size="l" more={false} /></div>

    <section class="rv-sec" aria-labelledby="chr-h">
      <div class="rv-h"><div><h2 id="chr-h">{t('Month by month')}</h2><p class="rv-sub">{t('Choose what to show, then a month.')}</p></div></div>
      <div class="rv-chips" role="group" aria-label={t('Show')}>
        {#each CHRONIK_FILTERS as f (f.key)}
          <button type="button" class="rv-chip" aria-pressed={filter === f.key} data-filter={f.key} onclick={() => pickFilter(f.key)}>{t(f.name)}</button>
        {/each}
      </div>

      {#if page.month}
        <div class="mbar">
          <button type="button" class="arrow" aria-label={t('Older month')} disabled={at >= page.months.length - 1} onclick={() => go(page.months[at + 1].month)}><ChevronLeft size={20} aria-hidden="true" /></button>
          <h3 class="mname" data-month={page.month}>{monthLong(page.month)}</h3>
          <button type="button" class="arrow" aria-label={t('Newer month')} disabled={at <= 0} onclick={() => go(page.months[at - 1].month)}><ChevronRight size={20} aria-hidden="true" /></button>
        </div>
        <nav class="jump" aria-label={t('Jump to a month')}>
          {#each sameYear as m (m.month)}
            <button type="button" class="jm" aria-current={m.month === page.month ? 'true' : undefined} onclick={() => go(m.month)}>{monthShort(m.month)} <small class="num">{m.n}</small></button>
          {/each}
          {#each years.filter((y) => y !== yearOf(page.month)) as y (y)}
            <button type="button" class="jm yr" onclick={() => go(page.months.find((m) => yearOf(m.month) === y).month)}>{y}</button>
          {/each}
        </nav>
        <p class="rv-sub num">{tn(page.n, '{n} entry', '{n} entries')} · {filterName}</p>
        {#each daysShown as d (d.date)}
          <section class="day" aria-label={dates(d.date)}>
            <h4 class="dh num">{dates(d.date)}</h4>
            <ul class="rv-box">
              {#each d.entries as e (e.kind + e.id)}
                {@const w = words(e)}
                {@const Icon = ICON[e.kind]}
                <li>
                  <svelte:element this={e.href ? 'a' : 'div'} class="rv-row" href={e.href ?? undefined} data-kind={e.kind} data-entry={e.id}>
                    <span class="rv-ic" aria-hidden="true"><Icon size={18} /></span>
                    <span class="rv-m"><span class="rv-t">{w.title}</span>{#if w.sub}<span class="rv-s">{w.sub}</span>{/if}</span>
                    {#if value(e)}<span class="rv-v num">{value(e)}</span>{/if}
                  </svelte:element>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
        {#if daysShown.length < page.days.length}<button type="button" class="dmore" onclick={() => (openMonth = `${page.month}|${filter}`)} data-days-more>{tn(page.days.length - daysShown.length, 'Show {n} more day', 'Show {n} more days')}</button>{/if}
      {:else}
        <Empty icon={History} text={filter === 'all' ? t('Nothing in the chronicle yet. Trips, rides, bike care, meditation and notes show up here by themselves.') : t('Nothing of this kind yet. Choose «All» to see everything.')} />
      {/if}
    </section>
  {/if}
</div>

<style>
  .dmore {
    min-height: 44px;
    margin-top: var(--sp-2);
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
  }
  .chronik {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .karte {
    max-width: 640px;
  }
  .rv-chips {
    margin: 0 0 14px;
  }
  .mbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 4px 0 8px;
  }
  .mname {
    flex: 1 1 auto;
    margin: 0;
    text-align: center;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .arrow {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .arrow:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .jump {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0 0 10px;
  }
  .jm {
    min-height: 44px;
    min-width: 44px;
    padding: 4px 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .jm small {
    color: var(--ink-3);
  }
  .jm[aria-current='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .jm[aria-current='true'] small {
    color: inherit;
  }
  .jm.yr {
    font-weight: 600;
  }
  .day {
    margin: 14px 0 0;
  }
  .dh {
    margin: 0 2px 6px;
    color: var(--ink-2);
    font: 600 var(--fs-small) var(--font-body);
  }
</style>
