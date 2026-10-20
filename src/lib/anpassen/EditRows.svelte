<script>
  /**
   * «Anpassen» (Noah 20.10.2026 «1a 2a 3a»): one list to change: each row can be shown or hidden (the
   * switch), renamed (the pencil; empty goes back to the app's name) and moved (arrows and drag, like
   * every list of the app). Used for the parts of a page, the tabs of a place and the menu.
   *
   * rows: [{ key, label (shown now), orig (the app's name), hidden, locked (cannot be hidden) }]
   * onmove(from, to), onhide(key, hidden), onrename(key, name, orig); sortable: false hides the arrows.
   */
  import { Pencil, Check } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable as sortAction } from '../ui/sortable.js';
  import { NAME_MAX } from '../anpassen.js';

  let { rows = [], onmove, onhide, onrename, sortable = true, label = '' } = $props();

  let editing = $state(null);
  let draft = $state('');

  function edit(r) {
    editing = r.key;
    draft = r.label;
  }
  function done(r) {
    if (editing !== r.key) return;
    editing = null;
    onrename?.(r.key, draft, r.orig);
  }
  function focus(node) {
    node.focus();
    node.select();
  }
</script>

<ul class="anp-rows" aria-label={label} use:sortAction={{ onmove: (from, to) => sortable && onmove?.(from, to) }}>
  {#each rows as r, i (r.key)}
    <li data-sort-id={r.key} class:off={r.hidden} data-anp-row={r.key}>
      {#if sortable}<SortGrip name={r.label} onstep={(dir) => onmove?.(i, i + dir)} />{/if}
      {#if editing === r.key}
        <form class="nm" onsubmit={(e) => (e.preventDefault(), done(r))}>
          <input
            use:focus
            bind:value={draft}
            maxlength={NAME_MAX}
            aria-label={t('New name for {name}', { name: r.orig })}
            placeholder={r.orig}
            onblur={() => done(r)}
            onkeydown={(e) => e.key === 'Escape' && (e.preventDefault(), e.stopPropagation(), (editing = null))}
          />
          <button type="submit" class="ib" aria-label={t('Keep the name')}><Check size={18} aria-hidden="true" /></button>
        </form>
      {:else}
        <span class="nm">
          <span class="lb">{r.label}</span>
          {#if r.label !== r.orig}<small>{t('App name: {name}', { name: r.orig })}</small>{/if}
        </span>
        <button type="button" class="ib" aria-label={t('Rename {name}', { name: r.label })} onclick={() => edit(r)}><Pencil size={16} aria-hidden="true" /></button>
      {/if}
      <label class="anp-sw" title={r.locked ? t('Always shown') : ''}>
        <span class="sr">{t('Show {name}', { name: r.label })}</span>
        <input type="checkbox" role="switch" class="opsw" checked={!r.hidden} disabled={r.locked} onchange={(e) => onhide?.(r.key, !e.currentTarget.checked)} />
      </label>
      {#if sortable}<SortArrows name={r.label} {i} n={rows.length} onstep={(dir) => onmove?.(i, i + dir)} />{/if}
    </li>
  {/each}
</ul>

<style>
  .anp-rows {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 52px;
    padding: 4px var(--sp-2);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  li.off .lb {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  form.nm {
    flex-direction: row;
    align-items: center;
  }
  .lb {
    overflow-wrap: break-word;
    font-weight: 500;
  }
  small {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  input:not([type]) {
    flex: 1;
    min-width: 0;
    min-height: 40px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line-2, var(--line));
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .anp-sw {
    flex: none;
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
  }
  .opsw {
    appearance: none;
    flex: none;
    position: relative;
    width: 44px;
    height: 26px;
    margin: 0;
    border-radius: 999px;
    background: var(--line-strong);
    cursor: pointer;
    transition: background 0.15s;
  }
  .opsw::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
    transition: transform 0.15s;
  }
  .opsw:checked {
    background: var(--hi);
  }
  .opsw:checked::after {
    transform: translateX(18px);
  }
  .opsw:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .opsw:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
