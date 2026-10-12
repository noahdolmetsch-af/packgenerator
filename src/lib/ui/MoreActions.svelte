<script>
  /**
   * v0.114.0 «Knöpfe neu» (mockup N2, answer 3a): the «…» button of a row with all its other actions.
   * Every entry has a title (1–2 words) and a one-line explanation. On a computer the list opens under
   * the «…» (kept inside the screen by ui/inview.js); on a phone it opens as a sheet from the bottom.
   *
   *   <MoreActions title="Gabel-Service · MTB Grün" label={t('More for {what}', { what })} actions={[
   *     { name: t('Replace|part'), explain: explain('Replace|part'), icon: ArrowLeftRight, run: () => … },
   *   ]} />
   *
   * title    the list's head line (what the row is about)
   * label    the «…» button's accessible name (also its bubble, ui/explain.js)
   * actions  [{ name, explain?, icon?, run, current? }]; `current` marks the row's main action (shaded)
   * small    a «…» of the old small size (32 px, 44 on touch) for dense rows
   *
   * It closes after a choice, on Escape (focus back on «…»), when the focus leaves it (a click
   * elsewhere), on the sheet's dark background and on the phone's back key.
   */
  import { tick } from 'svelte';
  import { Ellipsis } from '@lucide/svelte';
  import { phone } from '../media.svelte.js';
  import { inView } from './inview.js';
  import { backClose } from './backclose.js';

  let { title = '', label = '', actions = [], small = false, class: cls = '' } = $props();
  let open = $state(false);
  let wrap = $state(null);
  let btn = $state(null);
  let sheet = $state(null);
  const uid = `ma${Math.random().toString(36).slice(2, 8)}`;

  async function toggle() {
    open = !open;
    if (!open) return;
    await tick();
    if (phone.matches) sheet?.showModal();
    (phone.matches ? sheet : wrap)?.querySelector('[role="menuitem"]')?.focus();
  }
  function close(refocus = true) {
    if (!open) return;
    open = false;
    if (sheet?.open) sheet.close();
    if (refocus) btn?.focus();
  }
  function choose(a) {
    close(false);
    a.run?.();
  }
  /** Arrow keys move between the entries, Escape closes (a menu's usual keys). */
  function keys(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]')];
    const at = items.indexOf(document.activeElement);
    items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length]?.focus();
  }
  /** A click or tap elsewhere moves the focus out of the list: it closes (desktop list). */
  function left(e) {
    if (phone.matches) return;
    const to = e.relatedTarget;
    if (to && wrap?.contains(to)) return;
    // a click on a blank part of the page gives no new focus target: wait for the click's own focus
    setTimeout(() => {
      if (wrap && !wrap.contains(document.activeElement)) close(false);
    }, 0);
  }
</script>

<span class="ma {cls}" bind:this={wrap} onfocusout={left}>
  <button type="button" class="btn dots" class:sm={small} bind:this={btn} aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? uid : undefined} onclick={toggle}><Ellipsis size={18} aria-hidden="true" /></button>
  {#if open && !phone.matches}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="ma-list" id={uid} role="menu" tabindex="-1" aria-label={title || label} use:inView onkeydown={keys}>
      {#if title}<p class="ma-h">{title}</p>{/if}
      {#each actions as a, n (n)}
        <button type="button" role="menuitem" class="ma-i" class:cur={a.current} data-explain="off" onclick={() => choose(a)}>
          {#if a.icon}<a.icon size={18} aria-hidden="true" />{:else}<span class="ma-ic" aria-hidden="true"></span>{/if}
          <span class="ma-t"><b>{a.name}</b>{#if a.explain}<small>{a.explain}</small>{/if}</span>
        </button>
      {/each}
    </div>
  {/if}
</span>
{#if open && phone.matches}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <dialog class="ma-sheet" id={uid} bind:this={sheet} aria-label={title || label} use:backClose onclose={() => (open = false)} onkeydown={keys} onclick={(e) => e.target === sheet && close()}>
    <span class="ma-grip" aria-hidden="true"></span>
    {#if title}<p class="ma-h">{title}</p>{/if}
    <div role="menu" aria-label={title || label}>
      {#each actions as a, n (n)}
        <button type="button" role="menuitem" class="ma-i" class:cur={a.current} data-explain="off" onclick={() => choose(a)}>
          {#if a.icon}<a.icon size={20} aria-hidden="true" />{:else}<span class="ma-ic" aria-hidden="true"></span>{/if}
          <span class="ma-t"><b>{a.name}</b>{#if a.explain}<small>{a.explain}</small>{/if}</span>
        </button>
      {/each}
    </div>
  </dialog>
{/if}

<style>
  .ma {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  .ma-list {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    z-index: 20;
    width: max-content;
    min-width: 260px;
    max-width: min(340px, calc(100vw - 16px));
    padding: 6px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 14px;
    box-shadow: 0 16px 40px var(--shadow);
    text-align: left;
    outline: none;
  }
  .ma-h {
    margin: 0;
    padding: 8px 12px 6px;
    color: var(--ink-3);
    font: 600 var(--fs-tiny)/1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .ma-i {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    min-height: 44px;
    padding: 9px 12px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .ma-i :global(svg),
  .ma-ic {
    flex: none;
    width: 18px;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .ma-i:hover,
  .ma-i:focus-visible,
  .ma-i.cur {
    background: var(--paper-2);
  }
  .ma-i:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  .ma-t {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ma-t b {
    font-weight: 600;
    font-size: var(--fs-body);
    line-height: 1.3;
  }
  .ma-t small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    overflow-wrap: break-word;
  }
  /* the phone: a sheet from the bottom over a dark background */
  .ma-sheet {
    position: fixed;
    inset: auto 0 0 0;
    width: 100%;
    max-width: 100%;
    max-height: 85vh;
    margin: 0;
    padding: 12px 10px calc(16px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    border: 0;
    border-radius: 22px 22px 0 0;
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 -10px 40px var(--shadow);
    overflow-y: auto;
  }
  .ma-sheet::backdrop {
    background: var(--scrim);
  }
  .ma-grip {
    display: block;
    width: 40px;
    height: 5px;
    margin: 0 auto 8px;
    border-radius: 9px;
    background: var(--line);
  }
  .ma-sheet .ma-h {
    font-size: var(--fs-small);
    padding: 6px 16px 8px;
  }
  .ma-sheet .ma-i {
    padding: 10px 16px;
  }
</style>
