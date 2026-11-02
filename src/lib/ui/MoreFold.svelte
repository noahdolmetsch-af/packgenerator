<script>
  /**
   * «Daten und Backup aufräumen» (Noah 01.11.2026 «1a 2a 3a 4a 5b»): one closed fold for the things that are
   * rarely needed, so the page shows three things first. A real <details>: what is inside stays on the page
   * (jump chips, tests and «Find» can open it), and it opens by itself when something inside needs you.
   * title / sub: already translated. open: bindable.
   */
  import { ChevronRight } from '@lucide/svelte';
  let { title, sub = '', open = $bindable(false), id = undefined, children } = $props();
</script>

<details class="morefold card" bind:open data-morefold={id}>
  <summary>
    <span class="mf-m"><b>{title}</b>{#if sub}<small>{sub}</small>{/if}</span>
    <ChevronRight class="mf-chev" size={18} aria-hidden="true" />
  </summary>
  <div class="mf-body">{@render children()}</div>
</details>

<style>
  .morefold {
    margin: 0 0 var(--gap, 14px);
    padding: 0;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 10px 16px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .mf-m {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }
  .mf-m b {
    font-weight: 600;
  }
  .mf-m small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  :global(.mf-chev) {
    flex: none;
    color: var(--ink-2);
    transition: transform 0.15s;
  }
  .morefold[open] > summary :global(.mf-chev) {
    transform: rotate(90deg);
  }
  summary:focus-visible {
    outline: 2px solid var(--accent, currentColor);
    outline-offset: -2px;
    border-radius: inherit;
  }
  .mf-body {
    padding: 4px 12px 12px;
    border-top: 1px solid var(--line);
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.mf-chev) {
      transition: none;
    }
  }
</style>
