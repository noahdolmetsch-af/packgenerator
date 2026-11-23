<script>
  /**
   * «Suche am Ort» (Warteliste 1, V2; Noah 22.11.2026 «2a», «3b»): a field of its own behind the title of Ich, Touren and Auswerten.
   * Ich and Auswerten: the functions of the place, a tap goes there. Touren: tours and rides by name, with four filter buttons
   * (year, bike, kind, distance) and the sum. No sentence is taken apart. The tables are read only when you use the field.
   */
  import { liveQuery } from 'dexie';
  import { Search } from '@lucide/svelte';
  import { t, tn, num } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { FEATURE } from '../features.js';
  import { goFeature, openSearch } from '../know/featureRun.js';
  import { openTrip } from '../nav.js';
  import { afterTitle } from '../ui/nachtitel.js';
  import { parts, markWords } from './mark.js';
  import { hereKind, featuresOf, placeRows, tripRows, filterRows, sumOf, choicesOf, DIST } from './ort.js';

  let { hash = '' } = $props();
  const kind = $derived(hereKind(hash));
  let q = $state('');
  let f = $state({ year: null, bike: null, art: null, dist: null });
  let openChip = $state(null); // the filter whose choices show
  let data = $state(null);
  let sub = null;
  let loading = false;
  $effect(() => {
    void hash;
    q = '';
    f = { year: null, bike: null, art: null, dist: null };
    openChip = null;
  });
  /** The rides and trips are read once, when the field or a filter is used. */
  function load() {
    if (kind !== 'trips' || sub || loading) return;
    loading = true;
    import('./mehrload.js')
      .then(({ loadMore }) => {
        sub = liveQuery(async () => ({ more: await loadMore(db), trips: await db.trips.toArray() })).subscribe({ next: (v) => (data = v), error: () => {} });
      })
      .catch(() => {});
  }
  $effect(() => () => sub?.unsubscribe());

  const placeName = $derived(kind === 'me' ? t('Me|place') : t('Analysis|place'));
  const word = $derived(q.trim());
  const marked = $derived(markWords(word));
  const rows = $derived(kind && kind !== 'trips' && word.length >= 2 ? placeRows(word, kind, t).slice(0, 8) : []);
  const all = $derived(kind === 'trips' && data ? tripRows({ rides: data.more.rides, trips: data.trips }) : []);
  const choices = $derived(choicesOf(all));
  const on = $derived(!!(f.year || f.bike || f.art || f.dist));
  const tourRows = $derived(kind === 'trips' && data && (word.length >= 2 || on) ? filterRows(all, word, f) : []);
  const sum = $derived(sumOf(tourRows));
  const ART = { strava: 'Strava', file: 'File|source', hand: 'By hand|source', trip: 'Trip|source' };
  const DISTS = { short: 'under 30 km', mid: '30 to 80 km', long: 'over 80 km' };
  const dayOf = (d) => (/^\d{4}-\d{2}-\d{2}/.test(d) ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '');
  const placeholder = $derived(kind === 'me' ? t('Find a setting') : kind === 'trips' ? t('Find a trip or ride') : t('Find a value or question'));
  const label = (c, v) => (c === 'dist' ? t(DISTS[v]) : c === 'art' ? t(ART[v]) : v);
  const FILTERS = [
    ['year', 'Year'],
    ['bike', 'Bike'],
    ['art', 'Kind|filter'],
    ['dist', 'Distance'],
  ];
  function pick(c, v) {
    f = { ...f, [c]: f[c] === v ? null : v };
    openChip = null;
  }
  function openRow(r) {
    const feature = FEATURE[r.featureId];
    if (feature) goFeature(feature, {});
  }
  function openTour(r) {
    if (r.tripId) openTrip(r.tripId);
    location.hash = r.href;
  }
</script>

<div class="sh-host" data-suchehier-host use:afterTitle>
  {#if kind}
    <section class="sh" data-suche-hier={kind} aria-label={placeholder}>
      <label class="sh-field">
        <Search size={18} aria-hidden="true" />
        <input type="search" bind:value={q} {placeholder} onfocus={load} autocomplete="off" enterkeyhint="search" data-suche-hier-input />
      </label>
      {#if kind === 'trips'}
        <div class="sh-chips" role="group" aria-label={t('Filter')}>
          {#each FILTERS as [c, name] (c)}
            <button type="button" class="chip" class:on={!!f[c]} aria-expanded={openChip === c} onclick={() => { load(); openChip = openChip === c ? null : c; }} data-suche-filter={c}>{f[c] ? label(c, f[c]) : t(name)}<span aria-hidden="true"> ▾</span></button>
          {/each}
        </div>
        {#if openChip}
          <div class="sh-chips" role="group" aria-label={t(FILTERS.find((x) => x[0] === openChip)[1])}>
            {#each openChip === 'dist' ? Object.keys(DIST) : (choices[openChip] ?? []) as v (v)}
              <button type="button" class="chip" class:on={f[openChip] === v} onclick={() => pick(openChip, v)} data-suche-choice={v}>{label(openChip, v)}</button>
            {:else}
              <span class="sh-none">{t('Nothing to choose yet')}</span>
            {/each}
          </div>
        {/if}
        {#if word.length >= 2 || on}
          <p class="sh-sum" data-suche-sum><b>{tn(sum.n, '{n} hit', '{n} hits')}</b>{#if sum.km}<span class="num">{num(sum.km)} km</span>{/if}</p>
          {#if tourRows.length}
            <ul class="sh-list">
              {#each tourRows.slice(0, 12) as r (r.id)}
                <li><button type="button" onclick={() => openTour(r)}><span class="m"><b>{#each parts(r.title, marked) as p}{#if p.m}<mark>{p.s}</mark>{:else}{p.s}{/if}{/each}</b><small>{[t(ART[r.art]), dayOf(r.day), r.bike].filter(Boolean).join(' · ')}</small></span>{#if r.km}<span class="num">{num(r.km)} km</span>{/if}</button></li>
              {/each}
            </ul>
            {#if tourRows.length > 12}<p class="sh-none">{t('{n} more', { n: tourRows.length - 12 })}</p>{/if}
          {:else if data}
            <p class="sh-none">{t('Nothing found here.')}</p>
          {/if}
          {#if word.length >= 2}<button type="button" class="sh-all" onclick={() => openSearch(word)} data-suche-ueberall>{t('Search everywhere for «{q}»', { q: word })} ›</button>{/if}
        {/if}
      {:else if word.length >= 2}
        {#if rows.length}
          <ul class="sh-list">
            {#each rows as r (r.id)}
              <li><button type="button" onclick={() => openRow(r)} data-suche-row><span class="m"><b>{#each parts(r.title, marked) as p}{#if p.m}<mark>{p.s}</mark>{:else}{p.s}{/if}{/each}</b><small>{r.sub}</small></span><span class="sh-go">{t('open|hit')} ›</span></button></li>
            {/each}
          </ul>
        {:else}
          <p class="sh-none">{t('Nothing found here.')}</p>
        {/if}
        <button type="button" class="sh-all" onclick={() => openSearch(word)} data-suche-ueberall>{t('Search everywhere for «{q}»', { q: word })} ›</button>
      {:else}
        <p class="sh-hint">{t('Searches {n} functions of {place}', { n: featuresOf(kind).length, place: placeName })}</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  /* the host only carries the place: no box of its own, hidden until nachtitel.js has put it behind the title */
  .sh-host {
    display: contents;
  }
  .sh-host:not([data-placed]) {
    display: none;
  }
  .sh {
    grid-column: 1 / -1;
    margin: 8px 0 12px;
    min-width: 0;
  }
  .sh-field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    color: var(--ink-2);
  }
  .sh-field:focus-within {
    border-color: var(--hi);
  }
  .sh-field input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body, 16px) var(--font-body);
  }
  .sh-hint,
  .sh-none {
    margin: 6px 4px 0;
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
  }
  .sh-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 0;
  }
  .chip {
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip.on {
    background: var(--hi);
    border-color: var(--hi);
    color: var(--paper);
  }
  .sh-sum {
    display: flex;
    justify-content: space-between;
    margin: 10px 0 0;
    padding: 10px 14px;
    border-radius: var(--radius-card);
    background: var(--card-line);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
  }
  .sh-list {
    margin: 10px 0 0;
    padding: 4px 14px;
    list-style: none;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .sh-list li + li {
    border-top: 1px solid var(--card-line);
  }
  .sh-list button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 56px;
    padding: 8px 0;
    border: 0;
    background: none;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .m {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .m small {
    color: var(--ink-2);
    font: 500 var(--fs-small) var(--font-body);
  }
  .sh-go {
    color: var(--hi);
    white-space: nowrap;
    font: 600 var(--fs-small) var(--font-body);
  }
  mark {
    background: var(--warn-soft);
    color: inherit;
    border-radius: 2px;
    padding: 0 1px;
  }
  .sh-all {
    min-height: 44px;
    margin: 6px 0 0;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  @media (orientation: landscape) and (max-height: 500px) {
    .sh-hint {
      display: none;
    }
  }
</style>
