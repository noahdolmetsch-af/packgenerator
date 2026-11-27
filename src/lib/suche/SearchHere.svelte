<script>
  /**
   * «Suche am Ort» (Warteliste 1, V2; Noah 22.11.2026 «2a», «3b»): a field of its own behind the title of Ich and Auswerten: the functions
   * of the place, a tap goes there. No sentence is taken apart. (Touren has its own bar since 26.11.2026: `touren/TourBar.svelte`.)
   */
  import { Search } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { FEATURE } from '../features.js';
  import { goFeature, openSearch } from '../know/featureRun.js';
  import { afterTitle } from '../ui/nachtitel.js';
  import { parts, markWords } from './mark.js';
  import { hereKind, featuresOf, placeRows } from './ort.js';

  let { hash = '' } = $props();
  const kind = $derived(hereKind(hash));
  let q = $state('');
  // the field starts again only when another page takes it (Ich, Auswerten), not when the address of the same page changes
  $effect(() => {
    void kind;
    q = '';
  });

  const placeName = $derived(kind === 'me' ? t('Me|place') : t('Analysis|place'));
  const word = $derived(q.trim());
  const marked = $derived(markWords(word));
  const rows = $derived(kind && word.length >= 2 ? placeRows(word, kind, t).slice(0, 8) : []);
  const placeholder = $derived(kind === 'me' ? t('Find a setting') : t('Find a value or question'));
  function openRow(r) {
    const feature = FEATURE[r.featureId];
    if (feature) goFeature(feature, {});
  }
</script>

<div class="sh-host" data-suchehier-host use:afterTitle>
  {#if kind}
    <section class="sh" data-suche-hier={kind} aria-label={placeholder}>
      <label class="sh-field">
        <Search size={20} aria-hidden="true" />
        <input type="search" bind:value={q} {placeholder} aria-label={placeholder} autocomplete="off" enterkeyhint="search" data-suche-hier-input />
      </label>
      {#if word.length >= 2}
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
