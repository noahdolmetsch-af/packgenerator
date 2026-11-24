<script>
  /**
   * «Rennliste» (Noah 24.11.2026 «a», design «C mit A»): the tab «Rennliste» of Touren › Rennen. You choose the
   * file your own race list made (JSON); the races stand by month, the ones you are registered for and your
   * favourites are ticked, a season grid shows the chosen ones and where two fall on the same days. «Create»
   * makes races of them, each with its day, days and the small facts of the list. The file is only read here
   * and never sent anywhere.
   */
  import { Upload, TriangleAlert, Flag } from '@lucide/svelte';
  import Seg from '../ui/Seg.svelte';
  import SeasonGrid from './SeasonGrid.svelte';
  import { db } from '../db.js';
  import { newTrip } from '../trips.js';
  import { saveRace, putRace } from './store.js';
  import { raceHref } from './parts.js';
  import { parseAtlas, isKnown, preselected, atlasOf, keyOf, rangeOf, overlaps, byMonth, yearsOf, MAX_FILE } from './atlas.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { localDay } from '../localday.js';
  import { t, tn, locale, num } from '../i18n.svelte.js';

  let { trips = [], bikes = [], ondone = null } = $props();
  let rows = $state([]);
  let picked = $state({});
  let error = $state('');
  let fileName = $state('');
  let busy = $state(false);
  let show = $state('all');
  let yearPick = $state('');

  const known = (r) => isKnown(r, trips);
  const chosen = $derived(rows.filter((r) => picked[keyOf(r)] && !known(r)));
  const fresh = $derived(rows.filter((r) => !known(r)));
  const FILTERS = {
    all: () => true,
    registered: (r) => r.registered,
    fav: (r) => r.fav,
    fresh: (r) => !known(r),
  };
  const shown = $derived(rows.filter(FILTERS[show]));
  const groups = $derived(byMonth(shown));
  const clash = $derived(overlaps([...chosen, ...rows.filter(known)]));
  const clashing = $derived(chosen.filter((r) => clash[keyOf(r)]?.length));
  const years = $derived(yearsOf([...chosen, ...rows.filter(known)]));
  const year = $derived(years.includes(yearPick) ? yearPick : (years.find((y) => y >= localDay().slice(0, 4)) ?? years[0] ?? localDay().slice(0, 4)));
  const gridItems = $derived(
    [...chosen, ...rows.filter(known)]
      .map((r) => ({ r, g: rangeOf(r) }))
      .filter((x) => x.g && (x.g.from.slice(0, 4) === year || x.g.to.slice(0, 4) === year))
      .map(({ r, g }) => ({ key: keyOf(r), name: r.name, from: g.from, to: g.to, state: known(r) ? 'known' : clash[keyOf(r)]?.length ? 'clash' : 'on' })),
  );
  const options = $derived([
    { key: 'all', name: t('All|race'), n: rows.length },
    { key: 'registered', name: t('Registered|race'), n: rows.filter(FILTERS.registered).length },
    { key: 'fav', name: t('Favourites|race'), n: rows.filter(FILTERS.fav).length },
    { key: 'fresh', name: t('New|race'), n: fresh.length },
  ]);
  const monthName = (key) => (key ? new Date(`${key}-15T12:00:00`).toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) : t('Without a day|race'));
  const tile = (d) => (d ? { m: new Date(`${d}T12:00:00`).toLocaleDateString(locale(), { month: 'short' }).replace('.', ''), d: Number(d.slice(8, 10)) } : { m: '', d: '–' });
  const daysText = (r) => (/^\d+$/.test(r.daysText) ? tn(Number(r.daysText), '{n} day', '{n} days') : /^[\d–-]+$/.test(r.daysText) ? t('{n} days', { n: r.daysText }) : r.daysText);
  const facts = (r) => [r.km ? `${num(r.km)} km` : '', r.hm ? `${num(r.hm)} m` : ''].filter(Boolean).join(' · ');
  const place = (r) => [daysText(r), r.land].filter(Boolean).join(' · ');
  const clashWith = (r) => {
    const o = clash[keyOf(r)] ?? [];
    return o.length > 1 ? `${o[0]} +${o.length - 1}` : o[0];
  };
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
    fileName = file.name;
    show = 'all';
    yearPick = '';
    if (file.size > MAX_FILE) {
      error = 'big';
      rows = [];
      return;
    }
    const got = parseAtlas(await file.text());
    error = got.error;
    rows = got.rows;
    picked = Object.fromEntries(got.rows.filter((r) => !known(r) && preselected(r)).map((r) => [keyOf(r), true]));
  }
  const tickShown = (on) => {
    const next = { ...picked };
    for (const r of shown) if (!known(r)) next[keyOf(r)] = on;
    picked = next;
  };

  async function create() {
    if (!chosen.length || busy) return;
    busy = true;
    try {
      let all = await db.trips.toArray();
      const items = await db.items.toArray();
      const bike = bikes[0] ?? { id: '', name: '', setup: {} };
      const ids = [];
      const base = Date.now();
      for (const r of chosen) {
        const trip = newTrip({ title: r.name, startDate: r.date || null, days: r.days, bike }, all, items, base + ids.length);
        await db.trips.add(trip);
        await saveRace(trip.id, { createdAt: new Date().toISOString(), atlas: atlasOf(r) });
        all = [...all, trip];
        ids.push(trip.id);
      }
      rows = [];
      picked = {};
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
</script>

<div class="atl" data-race-atlas>
  {#if !rows.length}
    <section class="atl-empty" data-race-atlas-empty>
      <span class="atl-ic" aria-hidden="true"><Flag size={26} /></span>
      <h2 class="atl-h">{t('Your race list')}</h2>
      <p class="atl-p">{t('Choose the JSON file your own race list saves. Every race you tick becomes a race of the app, with its day and length. The file stays on this device.')}</p>
      <label class="btn hi" data-race-atlas-file><Upload size={16} aria-hidden="true" />{t('Choose the file')}<input class="atl-file" type="file" accept=".json,application/json" onchange={readFile} data-race-atlas-input /></label>
      {#if error}<p class="atl-err" role="alert" data-race-atlas-error>{t(ERRORS[error] ?? ERRORS.unreadable)}</p>{/if}
    </section>
  {:else}
    <section class="atl-file-card" data-race-atlas-sum>
      <span class="atl-ic sm" aria-hidden="true"><Upload size={20} /></span>
      <div class="atl-fc-t"><b>{fileName}</b><small>{tn(rows.length, '{n} race · {fresh} not yet here', '{n} races · {fresh} not yet here', { fresh: fresh.length })}</small></div>
      <label class="btn sm" data-race-atlas-file>{t('Another file')}<input class="atl-file" type="file" accept=".json,application/json" onchange={readFile} data-race-atlas-input /></label>
    </section>
    {#if error}<p class="atl-err" role="alert" data-race-atlas-error>{t(ERRORS[error] ?? ERRORS.unreadable)}</p>{/if}

    <div class="atl-chips"><Seg chips small label={t('Show|race')} value={show} {options} onchange={(k) => (show = k)} /></div>

    {#if gridItems.length}
      {#if years.length > 1}<Seg small label={t('Year|race')} value={year} options={years.map((y) => ({ key: y, name: y }))} onchange={(k) => (yearPick = k)} />{/if}
      <SeasonGrid items={gridItems} {year} />
    {/if}

    {#if clashing.length}
      <p class="atl-alert" role="status" data-race-atlas-clash><TriangleAlert size={20} aria-hidden="true" /><span>{t('Same days: {names}. You can create both and drop one later.', { names: clashing.map((r) => r.name).join(' · ') })}</span></p>
    {/if}

    <div class="atl-dock" data-race-atlas-dock>
      <div class="atl-dock-t"><b>{tn(chosen.length, '{n} race chosen', '{n} races chosen')}</b><small><button type="button" class="atl-link" onclick={() => tickShown(true)} data-race-atlas-all>{t('Tick all shown')}</button> · <button type="button" class="atl-link" onclick={() => tickShown(false)} data-race-atlas-none>{t('Untick all')}</button></small></div>
      <button type="button" class="btn hi" disabled={!chosen.length || busy} onclick={create} data-race-atlas-make>{tn(chosen.length, 'Create {n} race', 'Create {n} races')}</button>
    </div>

    <div data-race-atlas-list>
      {#each groups as g (g.key)}
        <div class="atl-mh"><span>{monthName(g.key)}</span><small>{tn(g.rows.length, '{n} race', '{n} races')}</small></div>
        {#each g.rows as r (keyOf(r))}
          {@const k = known(r)}
          {@const on = !!picked[keyOf(r)] && !k}
          {@const tl = tile(r.date)}
          <label class="atl-row" class:on class:known={k}>
            <span class="atl-tile" class:on><i>{tl.m}</i><b>{tl.d}</b></span>
            <span class="atl-main">
              <span class="atl-name">{r.name}</span>
              {#if facts(r)}<span class="atl-sub">{facts(r)}</span>{/if}
              {#if place(r)}<span class="atl-sub">{place(r)}</span>{/if}
              {#if on && clash[keyOf(r)]?.length}<span class="atl-warn"><TriangleAlert size={13} aria-hidden="true" />{t('same days as {name}', { name: clashWith(r) })}</span>{/if}
            </span>
            <span class="atl-side">
              {#if k}<span class="atl-pill n">{t('already here|race')}</span>{:else if r.registered}<span class="atl-pill">{t('registered|race')}</span>{:else if r.fav}<span class="atl-pill n">★ {t('favourite|race')}</span>{/if}
              <input class="atl-tick" type="checkbox" checked={on} disabled={k} aria-label={r.name} onchange={(e) => (picked = { ...picked, [keyOf(r)]: e.currentTarget.checked })} data-race-atlas-pick={keyOf(r)} />
            </span>
          </label>
        {/each}
      {/each}
    </div>
    <p class="atl-p small">{t('A race plans for its longest time (for example 10 days for «6–10 days») and gets your first bike. You can change both afterwards.')}</p>
  {/if}
</div>

<style>
  .atl-chips {
    overflow-x: auto;
    scrollbar-width: none;
  }
  .atl-chips :global(.seg) {
    flex-wrap: nowrap;
    width: max-content;
  }
  .atl {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .atl-file {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
  }
  .atl-empty {
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
  .atl-ic {
    display: grid;
    place-items: center;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: var(--paper);
    color: var(--accent);
  }
  .atl-ic.sm {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: var(--accent-soft);
  }
  .atl-h {
    margin: 0;
    font: 700 var(--fs-section)/1.2 var(--font-body);
  }
  .atl-p {
    margin: 0;
    max-width: 52ch;
    color: var(--ink-2);
  }
  .atl-p.small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .atl-err {
    margin: 0;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--bad-soft);
    color: var(--bad);
    font-size: var(--fs-small);
  }
  .atl-file-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .atl-fc-t {
    display: grid;
    flex: 1;
    min-width: 0;
  }
  .atl-fc-t b {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .atl-fc-t small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .atl-alert {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
    padding: 10px 12px;
    border-radius: 14px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-small);
  }
  .atl-dock {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px 10px 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  .atl-dock-t {
    display: grid;
    gap: 2px;
  }
  .atl-dock-t small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .atl-link {
    all: unset;
    cursor: pointer;
    color: var(--accent);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .atl-mh {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin: 14px 2px 6px;
    font-size: var(--fs-small);
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .atl-mh small {
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }
  .atl-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    margin: 0 0 8px;
    padding: 10px 12px;
    border: 1px solid var(--card-line);
    border-radius: 16px;
    background: var(--paper);
    cursor: pointer;
  }
  .atl-row.on {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .atl-row.known {
    opacity: 0.6;
    cursor: default;
  }
  .atl-tile {
    display: grid;
    place-items: center;
    flex: none;
    width: 52px;
    padding: 6px 0 7px;
    border-radius: 14px;
    background: var(--paper-2);
    line-height: 1.05;
  }
  .atl-tile.on {
    background: var(--accent-soft);
  }
  .atl-tile i {
    font-style: normal;
    font-size: var(--fs-tiny);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-3);
    min-height: 1em;
  }
  .atl-tile b {
    font-size: var(--fs-section);
  }
  .atl-main {
    display: grid;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .atl-name {
    font-weight: 650;
    line-height: 1.25;
  }
  .atl-sub {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .atl-warn {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
    font-size: var(--fs-tiny);
    font-weight: 600;
  }
  .atl-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex: none;
  }
  .atl-pill {
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: var(--fs-tiny);
    font-weight: 600;
    white-space: nowrap;
  }
  .atl-pill.n {
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .atl-tick {
    appearance: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    margin: 0;
    border: 2px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    cursor: pointer;
  }
  .atl-tick:checked {
    border-color: var(--accent);
    background: var(--accent);
  }
  .atl-tick:checked::after {
    content: '';
    width: 6px;
    height: 11px;
    margin-top: -2px;
    border: solid var(--paper);
    border-width: 0 2.5px 2.5px 0;
    transform: rotate(45deg);
  }
  .atl-tick:disabled {
    border-color: var(--line);
    cursor: default;
  }
  .atl-tick:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
