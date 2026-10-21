<script>
  /**
   * SL1–SL3: one group of a long list. Closed it is one line: chevron, title (with a quiet peek of what is
   * inside), the count and a sum; open it shows SHOW_ROWS rows and «Show n more» (answer 4a).
   *
   *   <ListGroup id="d-2026-10-13" title="Yesterday, 13 Oct" count="18 updates" sum="266 km" peek="…"
   *     bind:open rows={list} more={(n) => t('Show {n} more', { n })}>{#snippet row(r)}…{/snippet}</ListGroup>
   *
   * `n` (default SHOW_ROWS) is how many rows show before «Show n more».
   * `head` (a snippet) replaces the plain title, e.g. with an icon. Every group carries data-group={id},
   * so the jump bar and the sticky head (ListNav.svelte) can find it.
   */
  import { ChevronRight, ChevronDown } from '@lucide/svelte';
  import { shownRows, SHOW_ROWS } from './listen.js';
  import { t } from '../i18n.svelte.js';

  let { id, title = '', head = null, count = '', sum = '', peek = '', open = $bindable(false), rows = [], row, more = null, children = null, n = SHOW_ROWS } = $props();
  let wide = $state(false);
  const shown = $derived(shownRows(rows, wide, n));
  const hidden = $derived(rows.length - shown.length);
</script>

<section class="ls-g" class:open data-group={id} id="g-{id}" aria-labelledby="gh-{id}">
  <h3 class="ls-gh-w" id="gh-{id}">
    <button type="button" class="ls-gh" aria-expanded={open} onclick={() => (open = !open)}>
      {#if open}<ChevronDown size={18} aria-hidden="true" />{:else}<ChevronRight size={18} aria-hidden="true" />{/if}
      <span class="ls-gt"><b>{#if head}{@render head()}{:else}{title}{/if}</b>{#if peek && !open}<small>{peek}</small>{/if}</span>
      {#if count}<span class="ls-gn num">{count}</span>{/if}
      {#if sum}<span class="ls-gv num">{sum}</span>{/if}
    </button>
  </h3>
  {#if open}
    <div class="ls-gb">
      {#if rows.length}
        <ul class="ls-rows">
          {#each shown as r, i (r.id ?? r.version ?? i)}<li class="ls-r">{@render row(r)}</li>{/each}
        </ul>
        {#if hidden > 0}
          <button type="button" class="ls-more" onclick={() => (wide = true)}><ChevronDown size={16} aria-hidden="true" />{more ? more(hidden) : t('Show {n} more|list', { n: hidden })}</button>
        {/if}
      {/if}
      {@render children?.()}
    </div>
  {/if}
</section>

<style>
  .ls-g {
    scroll-margin-top: var(--ls-top, 132px);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    background: var(--paper);
  }
  .ls-gh-w {
    margin: 0;
    font: inherit;
  }
  .ls-gh {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 56px;
    padding: 10px 16px;
    border: 0;
    border-radius: var(--radius-card);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ls-gh:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  .ls-gh > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .open .ls-gh {
    border-bottom: 1px solid var(--line);
    border-radius: var(--radius-card) var(--radius-card) 0 0;
  }
  .ls-gt {
    flex: 1;
    min-width: 0;
  }
  .ls-gt b {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .ls-gt small {
    display: block;
    margin-top: 1px;
    color: var(--ink-3);
    font-size: var(--fs-small);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ls-gn {
    flex: none;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .ls-gv {
    flex: none;
    min-width: 56px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    text-align: right;
  }
  .ls-gb {
    padding: 2px 0 8px;
  }
  .ls-rows {
    list-style: none;
    margin: 0;
    padding: 0 16px;
  }
  .ls-r {
    border-top: 1px solid var(--line);
  }
  .ls-r:first-child {
    border-top: 0;
  }
  .ls-more {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: calc(100% - 32px);
    min-height: 44px;
    margin: 4px 16px;
    border: 1px dashed var(--line);
    border-radius: var(--r-ctl);
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .ls-more:focus-visible {
    outline: var(--focus-ring);
  }
  @media print {
    .ls-g {
      box-shadow: none;
    }
  }
</style>
