<script>
  /**
   * Paket M «Aus Touren lernen», #1027 «Chronik-Karte statt Vor einem Jahr» (Noah «1b»): «Früher um diese
   * Zeit»: on this day in earlier years (the exact day first), else in this month, the trips (title, year,
   * km, one line from the debrief) and rides or activities, their routes as small lines on one drawn map
   * (no map tiles, nothing from the internet). «Tag / Monat» switches; a tap opens the trip; «Ganze Chronik»
   * opens #/chronik. A drop-in for YearAgoTile (same props, fits the tile frame, sizes 'w' and 'l');
   * frame="section" shows it as a section of a page (Rückblick). rides / activities: read here when not given.
   */
  import { liveQuery } from 'dexie';
  import { History, ChevronRight } from '@lucide/svelte';
  import TileHead from '../home/TileHead.svelte';
  import Seg from '../ui/Seg.svelte';
  import { db } from '../db.js';
  import { chronik, chronikView, projectLines } from './chronik.js';
  import { dayLong } from '../review/fmt.js';
  import { t, num } from '../i18n.svelte.js';
  import '../review/review.css';

  let { trips = [], debriefs = [], today, isnew = false, rides = null, activities = null, size = 'w', frame = 'tile', max = null, more = true } = $props();
  // the rides and Strava activities, read here when the page does not pass them (Heute passes trips and debriefs only)
  const ridesQ = liveQuery(() => db.rides.toArray());
  const actsQ = liveQuery(() => db.activities.toArray());
  const c = $derived(chronik({ trips, debriefs, rides: rides ?? $ridesQ ?? [], activities: activities ?? $actsQ ?? [], today }));
  let mode = $state(null); // null: the day when it has something, else the month
  const view = $derived(chronikView(c, mode));
  const limit = $derived(max ?? (frame === 'section' ? 6 : size === 'l' ? 4 : 3));
  const shown = $derived(view.list.slice(0, limit));
  const map = $derived(projectLines(shown.map((e) => ({ id: e.id, lines: e.lines })), 300, frame === 'section' || size === 'l' ? 150 : 96, 8));
  const colorOf = $derived(Object.fromEntries((map?.paths ?? []).map((p, i) => [p.id, `c${i % 4}`])));
  const idOf = $derived(`ck-h-${frame}`);
  const ymd = (e) => (view.mode === 'day' ? e.year : dayLong(e.date));
</script>

<section class="ck" class:surf={frame === 'tile'} class:tile={frame === 'tile'} class:sec={frame === 'section'} aria-labelledby={idOf} data-section="chronik">
  {#if frame === 'tile'}
    <TileHead icon={History} id={idOf} title={t('Earlier at this time')} {isnew} />
  {:else}
    <div class="rv-h"><div><h2 id={idOf}>{t('Earlier at this time')}</h2><p class="rv-sub">{t('What you did on this day and in this month in earlier years.')}</p></div></div>
  {/if}
  <div class="seg-wrap">
    <Seg small options={[{ key: 'day', name: t('Day|chronik'), n: c.day.length || null }, { key: 'month', name: t('Month|chronik'), n: c.month.length || null }]} value={view.mode} label={t('Show day or month')} onchange={(k) => (mode = k)} />
  </div>
  {#if shown.length}
    {#if map}
      <svg class="map" viewBox="0 0 {map.w} {map.h}" role="img" aria-label={t('Routes of earlier years')} data-chronik-map>
        {#each map.paths as p (p.id)}
          {@const e = shown.find((x) => x.id === p.id)}
          {#if e?.href}<a href={e.href} aria-label={e.title}><path d={p.d} class="ln {colorOf[p.id]}" /></a>{:else}<path d={p.d} class="ln {colorOf[p.id]}" />{/if}
        {/each}
      </svg>
    {/if}
    <ul class="list">
      {#each shown as e, i (e.kind + e.id)}
        <li>
          <svelte:element this={e.href ? 'a' : 'div'} class="row" href={e.href ?? undefined} data-chronik-entry={e.id}>
            <i class="dot {colorOf[e.id] ?? 'cn'}" aria-hidden="true"></i>
            <span class="m">
              <span class="tt">{e.title || (e.kind === 'ride' ? t('Ride|chronik') : t('Activity|chronik'))}</span>
              <span class="sub num">{ymd(e)}{#if e.km}{' '}· {num(Math.round(e.km))} km{/if}</span>
              {#if e.note && (frame === 'section' || size === 'l' || i === 0)}<span class="nt">«{e.note}»</span>{/if}
            </span>
          </svelte:element>
        </li>
      {/each}
    </ul>
    {#if view.list.length > shown.length}<p class="more num">{t('{n} more', { n: view.list.length - shown.length })}</p>{/if}
  {:else}
    <p class="nt">{view.mode === 'day' ? t('Nothing on this day in earlier years.') : t('Nothing in this month in earlier years yet.')}</p>
  {/if}
  <!-- Gesamttest 20.10.2026 Design 4: on a page (Rückblick) the link is the app's «link ›», not an underlined word (the tile on Heute stays as it is, HN4) -->
  {#if more}<a class="all" class:go={frame === 'section'} href="#/chronik">{t('Whole chronicle')}{#if frame === 'section'}<ChevronRight size={15} aria-hidden="true" />{/if}</a>{/if}
</section>

<style>
  .ck {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    color: var(--ink);
  }
  .ck.tile {
    height: 100%;
    padding: 14px 18px;
    box-sizing: border-box;
    overflow: hidden;
  }
  .ck.sec .list,
  .ck.sec .map {
    background: var(--paper);
  }
  .seg-wrap {
    max-width: 260px;
  }
  .map {
    display: block;
    width: 100%;
    height: auto;
    border-radius: var(--r-ctl, 10px);
    background: var(--paper-2);
  }
  .ln {
    fill: none;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  a .ln:hover {
    stroke-width: 4;
  }
  .c0 { stroke: var(--accent); background: var(--accent); }
  .c1 { stroke: var(--hi); background: var(--hi); }
  .c2 { stroke: var(--ink-2); background: var(--ink-2); }
  .c3 { stroke: var(--ink-3); background: var(--ink-3); }
  .cn { background: var(--card-line); }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-height: 44px;
    padding: 4px 6px;
    margin: 0 -6px;
    border-radius: 8px;
    color: inherit;
    text-decoration: none;
    box-sizing: border-box;
  }
  a.row:hover {
    background: var(--paper-2);
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    margin-top: 6px;
    border-radius: 50%;
  }
  .m {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .tt {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .sub,
  .more {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nt {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .more {
    margin: 0;
  }
  .all {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .all.go {
    gap: 4px;
    text-decoration: none;
  }
  .all.go:hover {
    text-decoration: underline;
  }
  .all.go :global(svg) {
    color: var(--ink-3);
  }
</style>
