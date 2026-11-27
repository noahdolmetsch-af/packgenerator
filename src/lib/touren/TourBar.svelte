<script>
  /**
   * «Ein Filter auf Touren» (Noah 26.11.2026 «Ja», Wahl «a»): behind the title of Touren one field and four buttons (year, bike, kind,
   * distance) that filter the list «Meine Touren» itself; «More filters» opens the window with the rest (weather, power, saved filters).
   * It takes the place of the field of «Suche am Ort» on Touren and of the box «Liste filtern» beside the list.
   * word: the words of the field; year: the chosen calendar year or ''; filter: the list filter (filter.js); counts: choiceCounts of the
   * period; years: the years there are; bikes: the bikes; kinds: the kinds there are (kindCounts); n: the number of active filters;
   * shown / total: the trips of the list now and of the period (the line under the buttons while something filters); onlist(): go to the list
   * (on a phone it opens it); onmore(): open the window.
   */
  import { Search, SlidersHorizontal } from '@lucide/svelte';
  import { t, num } from '../i18n.svelte.js';
  import { toggle, normFilter } from './filter.js';
  import { DISTS, distKeyOf, withDist } from './tourbar.js';
  import { openSearch } from '../know/featureRun.js';

  let { word = $bindable(''), year = $bindable(''), filter = $bindable(), counts = { bikes: {}, kinds: {} }, years = [], bikes = [], kinds = [], n = 0, shown = 0, total = 0, onlist, onmore } = $props();

  let open = $state(null); // the button whose choices show
  const placeholder = $derived(t('Find a trip or ride'));
  const f = $derived(normFilter(filter));
  const q = $derived(word.trim());
  const dist = $derived(distKeyOf(f));
  const active = $derived(q.length > 0 || !!year || n > 0);
  const liveBikes = $derived(bikes.filter((b) => !b.archived || counts.bikes?.[b.id] || f.bikes.includes(b.id)));

  const BUTTONS = $derived([
    { key: 'year', name: year ? year : t('Year'), on: !!year, show: years.length > 0 },
    { key: 'bike', name: f.bikes.length === 1 ? (bikes.find((b) => b.id === f.bikes[0])?.name ?? t('Bike')) : f.bikes.length ? `${t('Bike')} · ${f.bikes.length}` : t('Bike'), on: f.bikes.length > 0, show: liveBikes.length > 0 },
    { key: 'art', name: f.kinds.length === 1 ? t(kinds.find((k) => k.key === f.kinds[0])?.name ?? 'Kind|filter') : f.kinds.length ? `${t('Kind|filter')} · ${f.kinds.length}` : t('Kind|filter'), on: f.kinds.length > 0, show: kinds.length > 0 },
    { key: 'dist', name: dist ? t(DISTS.find((d) => d.key === dist).name) : t('Distance'), on: !!dist, show: true },
  ]);
  const pickYear = (y) => {
    year = year === y ? '' : y;
    open = null;
  };
  const pickBike = (id) => (filter = toggle(filter, 'bikes', id));
  const pickKind = (k) => (filter = toggle(filter, 'kinds', k));
  const pickDist = (k) => {
    filter = withDist(filter, k);
    open = null;
  };
</script>

<section class="tb" data-suche-hier="trips" data-suchehier-host data-placed="title" data-tour-bar aria-label={placeholder}>
  <label class="tb-field">
    <Search size={20} aria-hidden="true" />
    <input type="search" bind:value={word} {placeholder} aria-label={placeholder} autocomplete="off" enterkeyhint="search" data-suche-hier-input />
  </label>
  <div class="tb-chips" role="group" aria-label={t('Filter')}>
    {#each BUTTONS.filter((b) => b.show) as b (b.key)}
      <button type="button" class="chip" class:on={b.on} aria-expanded={open === b.key} onclick={() => (open = open === b.key ? null : b.key)} data-suche-filter={b.key}>{b.name}<span aria-hidden="true"> ▾</span></button>
    {/each}
    <button type="button" class="chip more" aria-haspopup="dialog" onclick={onmore} data-filter-open><SlidersHorizontal size={16} aria-hidden="true" />{t('More filters')}{#if n}<span class="fn num" data-filter-n>{n}</span>{/if}</button>
  </div>
  {#if open}
    <div class="tb-chips" role="group" aria-label={BUTTONS.find((b) => b.key === open)?.name}>
      {#if open === 'year'}
        {#each years as y (y)}<button type="button" class="chip" class:on={year === y} onclick={() => pickYear(y)} data-suche-choice={y}>{y}</button>{/each}
      {:else if open === 'bike'}
        {#each liveBikes as b (b.id)}<button type="button" class="chip" class:on={f.bikes.includes(b.id)} aria-pressed={f.bikes.includes(b.id)} onclick={() => pickBike(b.id)} data-suche-choice={b.id}>{b.name}{#if counts.bikes?.[b.id]}<span class="num"> {counts.bikes[b.id]}</span>{/if}</button>{/each}
      {:else if open === 'art'}
        {#each kinds as k (k.key)}<button type="button" class="chip" class:on={f.kinds.includes(k.key)} aria-pressed={f.kinds.includes(k.key)} onclick={() => pickKind(k.key)} data-suche-choice={k.key}>{t(k.name)}<span class="num"> {k.n}</span></button>{/each}
      {:else if open === 'dist'}
        {#each DISTS as d (d.key)}<button type="button" class="chip" class:on={dist === d.key} onclick={() => pickDist(d.key)} data-suche-choice={d.key}>{t(d.name)}</button>{/each}
      {/if}
    </div>
  {/if}
  {#if active}
    <p class="tb-sum" data-tour-sum><b>{t('{n} of {all} trips', { n: num(shown), all: num(total) })}</b><button type="button" class="tb-go" onclick={onlist} data-tour-sum-go>{t('To the list')} ↓</button></p>
  {/if}
  {#if q.length >= 2}<button type="button" class="tb-all" onclick={() => openSearch(q)} data-suche-ueberall>{t('Search everywhere for «{q}»', { q })} ›</button>{/if}
</section>

<style>
  .tb {
    margin: 8px 0 12px;
    min-width: 0;
  }
  .tb-field {
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
  .tb-field:focus-within {
    border-color: var(--hi);
  }
  .tb-field input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body, 16px) var(--font-body);
  }
  .tb-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 0;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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
  .chip.more {
    margin-left: auto;
  }
  .fn {
    display: inline-grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    font: 600 var(--fs-tiny) / 1 var(--font-body);
  }
  .tb-sum {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 10px 0 0;
    padding: 6px 14px;
    border-radius: var(--radius-card);
    background: var(--card-line);
    color: var(--ink);
    font: 600 var(--fs-small) var(--font-body);
  }
  .tb-go {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .tb-all {
    min-height: 44px;
    margin: 6px 0 0;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--hi);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  @media (max-width: 600px) {
    .chip.more {
      margin-left: 0;
    }
  }
</style>
