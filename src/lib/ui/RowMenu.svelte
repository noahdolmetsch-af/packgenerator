<script>
  /**
   * «Meine Sportarten» (Noah 02.11.2026 «2a»): the menu «⋯» of a row: rename, pause, move, delete, in the list itself.
   * items: [{ key, label, icon?, onclick, danger?, disabled?, sep? }] (sep: a line above). name: the row's name for the
   * screen reader. Closes on a tap outside, Escape and after a choice; the first item gets the focus.
   */
  import { Ellipsis } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';

  let { items = [], name = '' } = $props();
  let open = $state(false);
  let root = $state();
  let btn = $state();

  function away(e) {
    if (open && root && !root.contains(e.target)) open = false;
  }
  function key(e) {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      open = false;
      btn?.focus();
    }
  }
  async function pick(it) {
    open = false;
    await it.onclick?.();
  }
  $effect(() => {
    if (open) requestAnimationFrame(() => root?.querySelector('[role="menuitem"]:not(:disabled)')?.focus());
  });
</script>

<svelte:window onpointerdown={away} onkeydown={key} />

<span class="rm" bind:this={root}>
  <button type="button" class="rm-btn noswipe" bind:this={btn} aria-haspopup="menu" aria-expanded={open} aria-label={t('More for {name}', { name })} data-row-menu onclick={() => (open = !open)}><Ellipsis size={18} aria-hidden="true" /></button>
  {#if open}
    <div class="rm-pop" role="menu" data-row-menu-open>
      {#each items as it (it.key)}
        {#if it.sep}<hr />{/if}
        <button type="button" role="menuitem" class="rm-it" class:danger={it.danger} disabled={it.disabled} data-menu={it.key} onclick={() => pick(it)}>
          {#if it.icon}<it.icon size={16} aria-hidden="true" />{/if}<span>{it.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</span>

<style>
  .rm {
    position: relative;
    flex: none;
  }
  .rm-btn {
    display: grid;
    place-items: center;
    width: 36px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .rm-btn:focus-visible,
  .rm-it:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .rm-pop {
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 20;
    min-width: 210px;
    padding: 4px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    box-shadow: 0 10px 28px var(--shadow);
  }
  .rm-pop hr {
    margin: 4px 0;
    border: 0;
    border-top: 1px solid var(--line);
  }
  .rm-it {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    width: 100%;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .rm-it:hover:not(:disabled) {
    background: var(--paper-2);
  }
  .rm-it:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .rm-it.danger {
    color: var(--warn);
  }
</style>
