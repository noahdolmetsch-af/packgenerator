<script>
  /**
   * v0.39.0 (AP28): the quiet ••• of a template row or page: a small menu below the button.
   * actions: [{ key, label, bad? }]; onpick(key). Escape and a tap outside close it; the focus goes
   * back to •••. The button is 44 px (touch) and always reachable with Tab.
   */
  import { Ellipsis } from '@lucide/svelte';

  let { label, actions = [], onpick, align = 'right' } = $props();
  let open = $state(false);
  let wrap = $state();
  let btn = $state();

  function close(focus = false) {
    open = false;
    if (focus) btn?.focus();
  }
  function key(e) {
    if (e.key !== 'Escape' || !open) return;
    e.stopPropagation();
    e.preventDefault();
    close(true);
  }
  $effect(() => {
    if (!open) return;
    const away = (e) => {
      if (wrap && !wrap.contains(e.target)) close();
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  });
  function pick(k) {
    close(true);
    onpick?.(k);
  }
</script>

<div class="mw" bind:this={wrap}>
  <button type="button" class="icb" bind:this={btn} aria-label={label} aria-haspopup="menu" aria-expanded={open} onkeydown={key} onclick={() => (open = !open)}><Ellipsis size={20} aria-hidden="true" /></button>
  {#if open}
    <div class="menu {align}" role="menu">
      {#each actions as a (a.key)}<button type="button" role="menuitem" class:bad={a.bad} onkeydown={key} onclick={() => pick(a.key)}>{a.label}</button>{/each}
    </div>
  {/if}
</div>

<style>
  .mw {
    position: relative;
    display: inline-flex;
  }
  .icb {
    width: 44px;
    height: 44px;
    display: inline-grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--ink-2);
    border-radius: 8px;
    cursor: pointer;
  }
  .icb:hover {
    background: var(--paper-2);
  }
  .menu {
    position: absolute;
    top: 46px;
    z-index: 20;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 46, 39, 0.15);
    min-width: 200px;
    max-width: calc(100vw - 32px);
    padding: 4px 0;
  }
  .menu.right {
    right: 0;
  }
  .menu.left {
    left: 0;
  }
  .menu button {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 44px;
    border: 0;
    background: none;
    font: 400 15px var(--font-body);
    color: var(--ink);
    padding: 0 14px;
    text-align: left;
    cursor: pointer;
  }
  .menu button:hover,
  .menu button:focus-visible {
    background: var(--paper-2);
  }
  .menu button.bad {
    color: var(--bad);
  }
</style>
