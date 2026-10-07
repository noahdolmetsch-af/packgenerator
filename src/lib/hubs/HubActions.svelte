<script>
  /**
   * v0.25.1 (Noah 3a): the buttons of a tile on Today. The first four show as buttons, the rest sit
   * under "More": a small menu opened by tap, click, Enter or Space; it closes on Escape (focus goes
   * back to "More"), on a tap outside and after a choice. Nothing is only on hover.
   *   actions: [{ key, label, href?, run?, plus? }] (href: a link; run: a button)
   */
  import { tick } from 'svelte';
  import { t } from '../i18n.svelte.js';

  let { actions = [], shown = 4, label = '' } = $props();

  const first = $derived(actions.slice(0, shown));
  const rest = $derived(actions.slice(shown));
  let open = $state(false);
  let wrap = $state();
  let moreBtn = $state();
  let menu = $state();
  const uid = `hm-${Math.random().toString(36).slice(2, 8)}`;

  async function toggle() {
    open = !open;
    if (open) {
      await tick();
      menu?.querySelector('a, button')?.focus();
    }
  }
  function close(focus = false) {
    open = false;
    if (focus) moreBtn?.focus();
  }
  // A tap or click outside the menu closes it.
  $effect(() => {
    if (!open) return;
    const outside = (e) => {
      if (wrap && !wrap.contains(e.target)) close();
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  });
  // Escape closes; the arrow keys move between the entries (Tab works as well).
  function keys(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close(true);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const list = [...menu.querySelectorAll('a, button')];
    const i = list.indexOf(document.activeElement);
    e.preventDefault();
    list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]?.focus();
  }
  function choose(a) {
    close();
    a.run?.();
  }
</script>

{#snippet plus()}<svg class="ic" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>{/snippet}

<div class="foot hub-actions" bind:this={wrap} role="group" aria-label={label || undefined}>
  {#each first as a (a.key)}
    {#if a.href}<a class="btn sm" href={a.href} onclick={() => a.run?.()}>{#if a.plus}{@render plus()}{/if}{a.label}</a>
    {:else}<button type="button" class="btn sm" onclick={() => a.run?.()}>{#if a.plus}{@render plus()}{/if}{a.label}</button>{/if}
  {/each}
  {#if rest.length}
    <button type="button" class="btn sm more" bind:this={moreBtn} aria-haspopup="menu" aria-expanded={open} aria-controls={uid} onclick={toggle}>
      {t('More')}<span class="chev" class:up={open} aria-hidden="true"></span>
    </button>
    {#if open}
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div class="menu" id={uid} role="menu" tabindex="-1" aria-label={label ? t('More: {label}', { label }) : t('More')} bind:this={menu} onkeydown={keys}>
        {#each rest as a (a.key)}
          {#if a.href}<a role="menuitem" href={a.href} onclick={() => choose(a)}>{a.label}</a>
          {:else}<button type="button" role="menuitem" onclick={() => choose(a)}>{a.label}</button>{/if}
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .foot {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
  }
  .foot .btn {
    gap: 6px;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
  .ic {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    flex: none;
  }
  .chev {
    width: 7px;
    height: 7px;
    margin-left: 2px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-2px) rotate(45deg);
  }
  .chev.up {
    transform: translateY(2px) rotate(-135deg);
  }
  /* Anchored to the row's left edge, so it never pushes the page sideways (320 px). */
  .menu {
    position: absolute;
    left: 0;
    top: calc(100% + 6px);
    z-index: 6;
    display: flex;
    flex-direction: column;
    min-width: min(240px, 100%);
    max-width: 100%;
    padding: 6px;
    box-sizing: border-box;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    box-shadow: 0 8px 22px rgba(15, 46, 39, 0.18);
  }
  .menu a,
  .menu button {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: 500 15px/1.3 var(--font-body);
    text-align: left;
    text-decoration: none;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  .menu a:hover,
  .menu button:hover,
  .menu a:focus-visible,
  .menu button:focus-visible {
    background: var(--paper-2);
  }
</style>
