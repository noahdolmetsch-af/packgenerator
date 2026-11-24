<script>
  /**
   * «Rennatlas» (Noah 24.11.2026 «1:1 wie das Mockup», design «C mit A»): the tab «Rennatlas» of Touren › Rennen.
   * You choose the file your own race list made (JSON) once; the races then stay in the app: a list with
   * filters, the year line with overlaps and the map. A tap on a race shows its facts; from there it
   * becomes a race of the app, with its day and days. The file is only read here and never sent anywhere.
   */
  import { Upload, Flag } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import AtlasList from './AtlasList.svelte';
  import AtlasDetail from './AtlasDetail.svelte';
  import { db } from '../db.js';
  import { newTrip } from '../trips.js';
  import { saveRace, putRace } from './store.js';
  import { raceHref } from './parts.js';
  import { parseAtlas, isKnown, atlasOf, keyOf, MAX_FILE } from './atlas.js';
  import { newFilter, mineOf, yearLine } from './atlas-view.js';
  import { atlasQuery, loadAtlas, putAtlas, markRace } from './atlas-store.js';
  import { longDay } from './atlas-text.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn } from '../i18n.svelte.js';

  // the two bigger views load when you open them (the map brings the country outlines)
  const LINE = () => import('./AtlasLine.svelte');
  const MAP = () => import('./AtlasMap.svelte');
  let { trips = [], bikes = [], ondone = null } = $props();
  const atlasQ = atlasQuery();
  const atlas = $derived($atlasQ);
  let view = $state('list');
  let filter = $state(newFilter());
  let error = $state('');
  let open = $state(null);
  let busy = $state(false);
  let wide = $state(true);
  let Line = $state(null);
  let MapView = $state(null);
  $effect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia('(min-width: 761px)');
    const on = () => (wide = m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  });
  $effect(() => {
    if (view === 'line' && !Line) LINE().then((m) => (Line = m.default));
    if (view === 'map' && !MapView) MAP().then((m) => (MapView = m.default));
  });

  const today = localDay();
  const known = (r) => isKnown(r, trips);
  const tripOf = (r) => trips.find((x) => isKnown(r, [x]));
  const rows = $derived(atlas?.rows ?? []);
  const mine = $derived(mineOf(rows, known));
  const ctx = $derived({ today, mine });
  const fresh = $derived(mine.filter((r) => (r.registered || r.fav) && !known(r)));
  const year = $derived.by(() => {
    const count = {};
    for (const r of rows) if (r.date && r.date.slice(0, 4) >= today.slice(0, 4)) count[r.date.slice(0, 4)] = (count[r.date.slice(0, 4)] ?? 0) + 1;
    return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? today.slice(0, 4);
  });
  const clashKeys = $derived(new Set(yearLine(rows, mine, Number(year)).items.filter((x) => x.clash).map((x) => x.key)));
  const ERRORS = {
    unreadable: 'This file could not be read. Is it the JSON file of your race list?',
    format: 'This file has no list of races.',
    empty: 'There is no race in this file.',
    big: 'This file is too big.',
  };

  async function readFile(e) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_FILE) return (error = 'big');
    const got = parseAtlas(await file.text());
    error = got.error;
    if (got.error) return;
    const before = await loadAtlas({ fileName: file.name, asOf: got.asOf || localDay(), rows: got.rows });
    filter = newFilter();
    view = 'list';
    offerDone(tn(got.rows.length, '{n} race loaded.', '{n} races loaded.'), () => putAtlas(before));
  }
  const mark = (r, patch) => markRace(keyOf(r), patch);

  async function make(list) {
    const todo = list.filter((r) => !known(r));
    if (!todo.length || busy) return;
    busy = true;
    try {
      let all = await db.trips.toArray();
      const items = await db.items.toArray();
      const bike = bikes[0] ?? { id: '', name: '', setup: {} };
      const ids = [];
      const base = Date.now();
      for (const r of todo) {
        const trip = newTrip({ title: r.name, startDate: r.date || null, days: r.days, bike }, all, items, base + ids.length);
        await db.trips.add(trip);
        await saveRace(trip.id, { createdAt: new Date().toISOString(), atlas: atlasOf(r) });
        all = [...all, trip];
        ids.push(trip.id);
      }
      open = null;
      offerDone(tn(ids.length, '{n} race created.', '{n} races created.'), async () => {
        await db.trips.bulkDelete(ids);
        for (const id of ids) await putRace(id, null);
      });
      if (ids.length === 1) location.hash = raceHref(ids[0]);
      else ondone?.();
    } finally {
      busy = false;
    }
  }
  const summary = $derived(t('{n} races · as of {day} · {a} registered · {b} favourites', { n: rows.length, day: longDay(atlas?.asOf || today), a: rows.filter((r) => r.registered).length, b: rows.filter((r) => r.fav).length }));
</script>

<div class="at" data-race-atlas>
  {#if atlas === undefined}
    <span class="at-load" aria-hidden="true"></span>
  {:else if !atlas}
    <section class="at-empty" data-race-atlas-empty>
      <span class="at-ic" aria-hidden="true"><Flag size={26} /></span>
      <h2 class="at-h">{t('Your race atlas')}</h2>
      <p class="at-p">{t('Choose the JSON file your own race list saves, once. The races then stay in the app: filter them, see them on a year line and on the map, and make a race of the app from each one. The file stays on this device.')}</p>
      <label class="btn hi" data-race-atlas-file><Upload size={16} aria-hidden="true" />{t('Choose the file')}<input class="at-file" type="file" accept=".json,application/json" onchange={readFile} data-race-atlas-input /></label>
      {#if error}<p class="at-err" role="alert" data-race-atlas-error>{t(ERRORS[error] ?? ERRORS.unreadable)}</p>{/if}
    </section>
  {:else}
    <div class="at-top">
      <div><h2 class="at-h1" data-atlas-title>{t('Race atlas {year}', { year })}</h2><small data-atlas-sum>{summary}</small></div>
      <Seg chips label={t('Views of the race atlas')} value={view} options={[{ key: 'list', name: t('List|race') }, { key: 'line', name: t('Year line') }, { key: 'map', name: t('Map|race') }]} onchange={(k) => (view = k)} />
    </div>
    {#if error}<p class="at-err" role="alert" data-race-atlas-error>{t(ERRORS[error] ?? ERRORS.unreadable)}</p>{/if}

    {#if view === 'list'}
      <AtlasList {atlas} {filter} {ctx} {known} onfilter={(f) => (filter = f)} onmark={mark} onopen={(r) => (open = r)} />
    {:else if view === 'line'}
      {#if Line}<Line {rows} {mine} {ctx} {wide} fresh={fresh.length} oncreate={() => make(fresh)} />{:else}<span class="at-load" aria-hidden="true"></span>{/if}
    {:else if MapView}
      <MapView {mine} {clashKeys} onopen={(r) => (open = r)} />
    {:else}
      <span class="at-load" aria-hidden="true"></span>
    {/if}

    <p class="at-file-line" data-atlas-fileline>
      <span>{t('File: {name}', { name: atlas.fileName })}</span>
      <label class="at-link" data-race-atlas-file>{t('Load another file')}<input class="at-file" type="file" accept=".json,application/json" onchange={readFile} data-race-atlas-input /></label>
    </p>
  {/if}
</div>

{#if open}
  {@const r = rows.find((x) => keyOf(x) === keyOf(open)) ?? open}
  <AtlasDetail row={r} {today} trip={tripOf(r)} {busy} onmark={(p) => mark(r, p)} oncreate={() => make([r])} onclose={() => (open = null)} />
{/if}

<style>
  .at {
    display: grid;
    gap: 14px;
    min-width: 0;
  }
  .at-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 10px 14px;
    flex-wrap: wrap;
  }
  .at-h1 {
    margin: 0;
    font: 700 var(--fs-title) / 1.15 var(--font-title);
  }
  .at-top small {
    display: block;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .at-load {
    display: block;
    height: 120px;
  }
  .at-file {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
  }
  .at-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 18px;
    text-align: center;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
    background: var(--accent-soft);
  }
  .at-ic {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: var(--paper);
    color: var(--accent);
  }
  .at-h {
    margin: 0;
    font: 700 var(--fs-section) / 1.2 var(--font-body);
  }
  .at-p {
    margin: 0;
    max-width: 52ch;
    color: var(--ink-2);
  }
  .at-err {
    margin: 0;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--bad-soft);
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .at-file-line {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .at-link {
    position: relative;
    color: var(--accent);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
</style>
