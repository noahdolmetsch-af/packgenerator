<script>
  /**
   * Durchklick Etappe 2, Frage 4a und Design b (Noah 05.11.2026): a long choice list gets a search field. A native select
   * with hundreds of lines is hard to scroll on a phone; with more than `min` options a search field sits above it and the
   * list shows only what fits the words (umlauts and accents do not matter). The chosen option always stays in the list.
   * options: [{ value, label }], value (bindable): the chosen value or '' for «nothing», empty: the text of «nothing»,
   * label: the name for the screen reader, searchLabel: the text of the search field.
   */
  import { Search } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { fold } from '../gearimport.js';

  let { options = [], value = $bindable(''), empty = '', label = '', searchLabel = '', min = 12, onchange = undefined } = $props();
  let q = $state('');
  const withSearch = $derived(options.length > min);
  const shown = $derived.by(() => {
    const words = fold(q).trim().split(/\s+/).filter(Boolean);
    if (!withSearch || !words.length) return options;
    return options.filter((o) => o.value === value || words.every((w) => fold(o.label).includes(w)));
  });
  const nothing = $derived(withSearch && q.trim() !== '' && shown.every((o) => o.value === value));
</script>

<div class="ss">
  {#if withSearch}
    <label class="find">
      <Search size={16} aria-hidden="true" />
      <input class="inp" type="search" bind:value={q} placeholder={searchLabel} aria-label={searchLabel} data-ss-search />
    </label>
  {/if}
  <select class="sel" bind:value aria-label={label || undefined} {onchange} data-ss-select>
    <option value="">{empty}</option>
    {#each shown as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
  </select>
  {#if nothing}<p class="none" data-ss-none>{t('No item found.')}</p>{/if}
</div>

<style>
  .ss {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    min-width: 0;
  }
  .find {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink-2);
  }
  .find .inp {
    flex: 1;
    min-width: 0;
    min-height: 40px;
    border: 0;
    background: none;
    padding: 0;
  }
  /* the frame shows the focus, not the field inside it (no frame in a frame) */
  .find:focus-within {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .find .inp:focus,
  .find .inp:focus-visible {
    outline: none;
    box-shadow: none;
    border: 0;
  }
  .none {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
