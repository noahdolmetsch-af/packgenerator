<script>
  /** Design audit C2: one main button per row, the other answers behind •••. (v0.21.0: own component.) */
  import { t } from '../i18n.svelte.js';

  let { label, actions } = $props();
  // v0.46.1 (Noah's phone: "Priorität über ••• ändern: nicht möglich"): near the bottom of the screen
  // the menu opened under the bottom bar; now it opens upwards when there is no room below.
  let up = $state(false);
  function place(ev) {
    const d = ev.currentTarget;
    if (!d.open) return (up = false);
    const box = d.querySelector('.more-in')?.getBoundingClientRect();
    const bar = document.querySelector('nav.bottom')?.getBoundingClientRect();
    const floor = bar && bar.height ? bar.top : window.innerHeight;
    up = !!box && box.bottom > floor - 8 && d.getBoundingClientRect().top - box.height > 64;
  }
</script>

<details class="more" class:up ontoggle={place}>
  <summary aria-label={t('More answers for {label}', { label })}>•••</summary>
  <div class="more-in">{#each actions as a (a.name)}<button type="button" class="btn sm" onclick={(ev) => (ev.currentTarget.closest('details').open = false, a.run())}>{a.name}</button>{/each}</div>
</details>

<style>
  .more {
    position: relative;
  }
  .more > summary {
    list-style: none;
    cursor: pointer;
    padding: 2px 8px;
    border: 1.5px solid var(--line);
    border-radius: 4px;
    font-weight: 700;
    color: var(--ink-2);
  }
  /* v0.31.0: 44 px for a thumb. */
  @media (pointer: coarse) {
    .more > summary {
      display: grid;
      place-items: center;
      min-width: 44px;
      min-height: 44px;
    }
  }
  .more > summary::-webkit-details-marker {
    display: none;
  }
  .more-in {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    z-index: 4;
    display: grid;
    gap: 6px;
    min-width: 170px;
    padding: 8px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    box-shadow: 0 6px 18px var(--shadow);
  }
  .up .more-in {
    top: auto;
    bottom: calc(100% + 4px);
  }
  .btn.sm {
    padding: 3px 10px;
    font-size: var(--fs-small);
  }
  /* v0.46.1: each answer 44 px tall for a thumb. */
  @media (pointer: coarse) {
    .more-in .btn.sm {
      min-height: 44px;
    }
  }
</style>
