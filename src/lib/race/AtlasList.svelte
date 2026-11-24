<script>
  /**
   * «Rennatlas» view Liste (Noah 24.11.2026, Mockup 1): search, filters (a column on a wide screen, the
   * window «Filter» on a phone), the filters that are on as small pills, the count with your saved
   * filters, and one card per race: date tile, place, ground, km, climb, a bar for the distance, the
   * state of the registration and the star. A tap opens the race.
   */
  import { Star, SlidersHorizontal, X, Pencil, Trash2, Plus, Search } from '@lucide/svelte';
  import AtlasFilters from './AtlasFilters.svelte';
  import RaceSheet from './RaceSheet.svelte';
  import { keyOf } from './atlas.js';
  import { matches, facets, switchCounts, sorted, statusOf, activeCount, newFilter, MAX_DAYS, SORTS } from './atlas-view.js';
  import { savedIdOf, saveFilter, renameFilter, deleteFilter, putAtlas } from './atlas-store.js';
  import { statusText, tileOf, placeLine, kmText, hmText } from './atlas-text.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { t, tn } from '../i18n.svelte.js';

  let { atlas, filter, ctx, known = () => false, onfilter, onmark, onopen } = $props();
  const rows = $derived(atlas.rows);
  let how = $state('date');
  let sheet = $state(false);
  let manage = $state(false);
  let naming = $state(false);
  let draftName = $state('');
  let wide = $state(true);
  $effect(() => {
    if (typeof matchMedia !== 'function') return;
    const m = matchMedia('(min-width: 761px)');
    const on = () => (wide = m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  });

  const facet = $derived(facets(rows));
  const shown = $derived(sorted(rows.filter((r) => matches(r, filter, ctx)), how));
  const counts = $derived(switchCounts(rows, filter, ctx));
  const n = $derived(activeCount({ ...filter, show: 'all' }));
  const maxKm = $derived(Math.max(1, ...rows.map((r) => r.km ?? 0)));
  const savedId = $derived(savedIdOf(atlas.saved, filter));
  const setF = (patch) => onfilter({ ...filter, ...patch });
  const reset = () => onfilter({ ...newFilter(), show: filter.show });
  const dayText = $derived(filter.dmin <= 1 && filter.dmax >= MAX_DAYS ? '' : filter.dmax >= MAX_DAYS ? t('{n} days or more', { n: filter.dmin }) : filter.dmin <= 1 ? t('Up to {n} days', { n: filter.dmax }) : t('{a} to {b} days', { a: filter.dmin, b: filter.dmax }));
  const pills = $derived([
    ...(filter.show !== 'all' ? [{ k: 'show', label: filter.show === 'fav' ? t('Favourites|race') : t('Registered|race'), off: () => setF({ show: 'all' }) }] : []),
    ...(filter.q.trim() ? [{ k: 'q', label: `«${filter.q.trim()}»`, off: () => setF({ q: '' }) }] : []),
    ...filter.surface.map((s) => ({ k: `s${s}`, label: s, off: () => setF({ surface: filter.surface.filter((x) => x !== s) }) })),
    ...filter.land.map((l) => ({ k: `l${l}`, label: l, off: () => setF({ land: filter.land.filter((x) => x !== l) }) })),
    ...(dayText ? [{ k: 'd', label: dayText, off: () => setF({ dmin: 1, dmax: MAX_DAYS }) }] : []),
    ...(filter.opens30 ? [{ k: 'o30', label: t('Opens in the next 30 days'), off: () => setF({ opens30: false }) }] : []),
    ...(filter.open ? [{ k: 'op', label: t('Open now'), off: () => setF({ open: false }) }] : []),
    ...(filter.fits ? [{ k: 'ft', label: t('Fits my gaps'), off: () => setF({ fits: false }) }] : []),
  ]);
  const SORT_NAMES = { date: 'By day', name: 'By name', km: 'By distance', opens: 'By registration' };

  async function saveNow() {
    const name = draftName.trim();
    if (!name) return;
    const before = await saveFilter(name, filter);
    naming = false;
    draftName = '';
    offerDone(t('Filter «{name}» saved.', { name }), () => putAtlas(before));
  }
  async function drop(s) {
    const before = await deleteFilter(s.id);
    offerDone(t('Filter «{name}» deleted.', { name: s.name }), () => putAtlas(before));
  }
</script>

<div class="al" data-atlas-list>
  <label class="al-search"><Search size={18} aria-hidden="true" /><input type="search" class="al-q" value={filter.q} placeholder={t('Search: name, place, country …')} aria-label={t('Search races')} oninput={(e) => setF({ q: e.currentTarget.value })} data-atlas-search /></label>
  <div class="al-lay">
    {#if wide}<aside class="al-side" aria-label={t('Filters|race')}><AtlasFilters {filter} {facet} {counts} onchange={setF} /></aside>{/if}
    <div class="al-main">
      {#if !wide}
        <div class="al-bar">
          <button type="button" class="btn" class:hi={n > 0} onclick={() => (sheet = true)} data-atlas-open-filter><SlidersHorizontal size={16} aria-hidden="true" />{n ? tn(n, 'Filter ({n} on)', 'Filter ({n} on)') : t('Filter|race')}</button>
          <label class="al-sort"><span class="sr">{t('Order|race')}</span><select class="inp" bind:value={how} data-atlas-sort>{#each SORTS as s (s)}<option value={s}>{t(SORT_NAMES[s])}</option>{/each}</select></label>
        </div>
      {/if}
      {#if pills.length}
        <div class="al-pills" data-atlas-pills>
          {#each pills as p (p.k)}<button type="button" class="al-pill" onclick={p.off} aria-label={t('Remove «{name}»', { name: p.label })}>{p.label}<X size={13} aria-hidden="true" /></button>{/each}
        </div>
      {/if}
      <div class="al-sum">
        <b data-atlas-count>{t('{a} of {b} races', { a: shown.length, b: rows.length })}</b>
        {#if wide}<label class="al-sort"><span class="sr">{t('Order|race')}</span><select class="inp" bind:value={how} data-atlas-sort>{#each SORTS as s (s)}<option value={s}>{t(SORT_NAMES[s])}</option>{/each}</select></label>{/if}
      </div>
      {#if atlas.saved.length || (n && !savedId)}
      <div class="al-saved" data-atlas-saved>
        {#if atlas.saved.length}<Star size={14} aria-hidden="true" /><span>{t('Saved filters|race')}</span>{/if}
        {#each atlas.saved as s (s.id)}
          <button type="button" class="al-chip" aria-pressed={savedId === s.id} onclick={() => onfilter({ ...newFilter(), ...s.filter, show: filter.show })} data-atlas-saved-pick={s.id}>{s.name}</button>
        {/each}
        {#if n && !savedId && !naming}<button type="button" class="al-chip add" onclick={() => (naming = true)} data-atlas-save><Plus size={13} aria-hidden="true" />{t('Save this filter')}</button>{/if}
        {#if atlas.saved.length}<button type="button" class="al-chip add" onclick={() => (manage = true)} data-atlas-saved-manage><Pencil size={13} aria-hidden="true" />{t('Edit|race')}</button>{/if}
      </div>
      {/if}
      {#if naming}
        <form class="al-naming" onsubmit={(e) => (e.preventDefault(), saveNow())}>
          <input class="inp" bind:value={draftName} maxlength="40" placeholder={t('e.g. Alpine gravel')} aria-label={t('Name of the filter')} data-atlas-save-name />
          <button type="submit" class="btn hi" disabled={!draftName.trim()}>{t('Save')}</button>
          <button type="button" class="btn" onclick={() => (naming = false)}>{t('Cancel')}</button>
        </form>
      {/if}

      {#if shown.length}
        <ul class="al-rows">
          {#each shown as r (keyOf(r))}
            {@const tl = tileOf(r.date)}
            {@const st = statusText(statusOf(r, ctx.today))}
            <li class="al-row" data-atlas-row={keyOf(r)}>
              <button type="button" class="al-hit" onclick={() => onopen(r)} aria-label={r.name}>
                <span class="al-tile"><b>{tl.d}</b><i>{tl.m}</i></span>
                <span class="al-body">
                  <span class="al-name">{r.name}{#if known(r)}<small class="al-here">{t('in the app|race')}</small>{/if}</span>
                  <span class="al-place">{placeLine(r)}</span>
                  <span class="al-facts">{#if r.surface}<span class="al-f">{r.surface}</span>{/if}{#if r.km}<span class="al-f">{kmText(r)}</span>{/if}<span class="al-f" class:q={!r.hm}>{hmText(r)}</span></span>
                  {#if r.km}<span class="al-bar-d" aria-hidden="true"><i style:width={`${Math.max(4, Math.round((r.km / maxKm) * 100))}%`}></i></span>{/if}
                  <span class="al-state"><span class="al-st {st.tone}">{st.text}</span></span>
                </span>
              </button>
              <button type="button" class="al-star" class:on={r.fav} aria-pressed={r.fav} aria-label={t('Favourite: {name}', { name: r.name })} onclick={() => onmark(r, { fav: !r.fav })} data-atlas-fav={keyOf(r)}><Star size={20} aria-hidden="true" fill={r.fav ? 'currentColor' : 'none'} /></button>
            </li>
          {/each}
        </ul>
      {:else}
        <div class="al-none" data-atlas-none>
          <p>{t('No race fits these filters.')}</p>
          <button type="button" class="btn" onclick={reset} data-atlas-reset>{t('Clear filters')}</button>
        </div>
      {/if}
    </div>
  </div>
</div>

{#if sheet}
  <RaceSheet title={t('Filter|race')} saveLabel={tn(shown.length, 'Show {n} race', 'Show {n} races')} cancel={false} onsave={() => {}} onclose={() => (sheet = false)}>
    <AtlasFilters {filter} {facet} {counts} onchange={setF} />
    <button type="button" class="btn" onclick={reset} data-atlas-reset-sheet>{t('Clear filters')}</button>
  </RaceSheet>
{/if}

{#if manage}
  <RaceSheet title={t('Saved filters|race')} saveLabel={t('Done')} cancel={false} onsave={() => {}} onclose={() => (manage = false)}>
    {#each atlas.saved as s (s.id)}
      <div class="al-mng">
        <input class="inp" value={s.name} maxlength="40" aria-label={t('Name of the filter')} onchange={(e) => renameFilter(s.id, e.currentTarget.value)} data-atlas-saved-name={s.id} />
        <button type="button" class="btn del" onclick={() => drop(s)} aria-label={t('Delete «{name}»', { name: s.name })}><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    {:else}
      <p class="al-note">{t('No saved filter yet.')}</p>
    {/each}
  </RaceSheet>
{/if}

<style>
  .al {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .al-search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink-3);
  }
  .al-q {
    all: unset;
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    min-height: 44px;
    color: var(--ink);
  }
  .al-q:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 4px;
  }
  .al-lay {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }
  @media (min-width: 761px) {
    .al-lay {
      grid-template-columns: 300px minmax(0, 1fr);
      align-items: start;
    }
    .al-side {
      position: sticky;
      top: 12px;
    }
  }
  .al-main {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .al-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .al-sort select {
    min-height: 40px;
  }
  .al-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .al-pill {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: var(--fs-small);
    font-weight: 600;
    cursor: pointer;
  }
  .al-pill:focus-visible,
  .al-chip:focus-visible,
  .al-hit:focus-visible,
  .al-star:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .al-sum {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .al-sum b {
    font-size: var(--fs-sub);
  }
  .al-saved {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .al-chip {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .al-chip[aria-pressed='true'] {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--paper);
  }
  .al-chip.add {
    border-style: dashed;
    color: var(--ink-2);
  }
  .al-name {
    display: flex;
    font-weight: 700;
    align-items: baseline;
    gap: 8px;
  }
  .al-naming {
    gap: 8px;
    flex-wrap: wrap;
  }
  .al-naming .inp {
    flex: 1;
    min-width: 160px;
  }
  .al-rows {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .al-row {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    border-top: 1px solid var(--line);
  }
  .al-hit {
    all: unset;
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 12px;
    padding: 12px 0;
    cursor: pointer;
  }
  .al-tile {
    display: grid;
    align-content: center;
    justify-items: center;
    height: 54px;
    border-radius: 10px;
    background: var(--paper-2);
    line-height: 1.05;
  }
  .al-tile b {
    font-size: var(--fs-sub);
  }
  .al-tile i {
    font-style: normal;
    font-size: var(--fs-tiny);
    color: var(--ink-3);
    min-height: 1em;
  }
  .al-body {
    display: grid;
    gap: 5px;
    min-width: 0;
    justify-items: start;
  }
  .al-name {
    font-size: var(--fs-body);
    font-weight: 700;
    line-height: 1.25;
  }
  .al-here {
    font-weight: 600;
    font-size: var(--fs-tiny);
    color: var(--accent);
  }
  .al-place {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .al-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .al-f {
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--paper-2);
    font-size: var(--fs-small);
  }
  .al-f.q {
    color: var(--ink-3);
  }
  .al-bar-d {
    display: block;
    width: 100%;
    max-width: 260px;
    height: 5px;
    border-radius: 3px;
    background: var(--paper-2);
  }
  .al-bar-d i {
    display: block;
    height: 5px;
    border-radius: 3px;
    background: var(--accent);
  }
  .al-st {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: var(--fs-tiny);
    font-weight: 600;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .al-st.ok {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .al-st.soon {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .al-st.shut {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .al-star {
    all: unset;
    box-sizing: border-box;
    display: grid;
    place-items: center;
    flex: none;
    width: 44px;
    height: 44px;
    margin-top: 8px;
    color: var(--ink-3);
    cursor: pointer;
  }
  .al-star.on {
    color: var(--accent);
  }
  .al-none {
    display: grid;
    gap: 10px;
    justify-items: start;
    padding: 18px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-card);
  }
  .al-none p,
  .al-note {
    margin: 0;
    color: var(--ink-2);
  }
  .al-mng {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
  .al-mng .inp {
    flex: 1;
    min-width: 0;
  }
</style>
