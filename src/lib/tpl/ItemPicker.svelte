<script>
  /**
   * v0.39.0 (AP28): add single items to a template (step 2 of a new template, "+ Item" in a template):
   * a search and the categories folded away, + adds. Items of the template's building blocks are
   * already in it and are not offered (one quiet line says so).
   */
  import { Plus, ChevronRight } from '@lucide/svelte';
  import { formatWeight, itemWeight } from '../gear.js';
  import { addable } from './view.js';
  import { t, nameOf } from '../i18n.svelte.js';

  let { tpl, items, setsValue = [], onadd, autofocus = false } = $props();
  let q = $state('');
  let input = $state();
  $effect(() => {
    if (autofocus) input?.focus();
  });
  const groups = $derived(addable(tpl, items, setsValue, q));
  let open = $state({});
  const isOpen = (key) => !!q.trim() || !!open[key];
</script>

<div class="picker">
  <label class="lbl" for="tpl-search-{tpl.id}">{t('Search an item')}</label>
  <input id="tpl-search-{tpl.id}" class="inp" type="search" bind:this={input} bind:value={q} placeholder={t('Search your gear')} autocomplete="off" />
  <p class="hint">{t('Items of your building blocks are already in it and are not listed here.')}</p>
  {#if !groups.length}<p class="hint">{q.trim() ? t('Nothing found.') : t('Everything is in it already.')}</p>{/if}
  <ul class="cats">
    {#each groups as g (g.key)}
      <li>
        <button type="button" class="cat" aria-expanded={isOpen(g.key)} onclick={() => (open = { ...open, [g.key]: !open[g.key] })}>
          <ChevronRight class="chev" size={18} aria-hidden="true" /><span>{g.name}</span><span class="n num">{g.items.length}</span>
        </button>
        {#if isOpen(g.key)}
          <ul class="adds">
            {#each g.items as i (i.id)}
              <li class="addrow">
                <span class="t">{nameOf(i)}</span>
                <span class="w num">{itemWeight(i) == null ? '–' : formatWeight(itemWeight(i))}</span>
                <button type="button" class="plus" aria-label={t('Add {name}', { name: nameOf(i) })} onclick={() => onadd?.(i.id)}><Plus size={20} aria-hidden="true" /></button>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .picker {
    display: grid;
    gap: 4px;
  }
  .hint {
    margin: 2px 0 6px;
    font-size: 14px;
    color: var(--ink-3);
  }
  .cats,
  .adds {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cat {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    font: 600 15px var(--font-body);
    color: var(--ink);
    text-align: left;
    cursor: pointer;
    padding: 0;
  }
  .cat :global(.chev) {
    flex: none;
    transition: transform 0.15s;
  }
  .cat[aria-expanded='true'] :global(.chev) {
    transform: rotate(90deg);
  }
  .cat span:nth-child(2) {
    flex: 1;
    min-width: 0;
  }
  .n {
    color: var(--ink-3);
    font-weight: 500;
  }
  .addrow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto 44px;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
    padding-left: 26px;
  }
  .addrow .t {
    overflow-wrap: anywhere;
  }
  .addrow .w {
    color: var(--ink-2);
    font-size: 15px;
    text-align: right;
  }
  .plus {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink);
    border-radius: 8px;
    cursor: pointer;
  }
  .plus:hover {
    background: var(--paper-2);
  }
</style>
