<script>
  /**
   * v0.31.0 (Noah 9a, variant A): a section of Bikes → Setup that is set once and rarely needed.
   * Closed it is one quiet row (icon, name, short summary, ›) like the rows on the trip pages;
   * its content is only drawn while it is open. Same markup as ui/Fold (details.fold, summary .lbl).
   */
  import { ChevronRight } from '@lucide/svelte';

  let { label, summary = '', late = false, icon: Icon = null, open = $bindable(false), children } = $props();
</script>

<details class="fold sfold" bind:open>
  <summary>
    {#if Icon}<Icon class="ic" size={20} aria-hidden="true" />{/if}
    <span class="lbl">{label}</span>
    <span class="sum" class:late>{summary}</span>
    <ChevronRight class="chev" size={18} aria-hidden="true" />
  </summary>
  {#if open}<div class="fold-in">{@render children()}</div>{/if}
</details>

<style>
  .sfold {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 12px;
    margin: 0 0 8px;
    font-size: 15px;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 4px 12px;
    min-height: 56px;
    padding: 8px 14px 8px 16px;
    box-sizing: border-box;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary :global(.ic) {
    flex: none;
    color: var(--ink-3);
  }
  summary .lbl {
    flex: none;
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--ink);
  }
  .sum {
    flex: 1 1 auto;
    min-width: 0;
    text-align: right;
    color: var(--ink-3);
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .sum.late {
    color: var(--bad);
    font-weight: 600;
  }
  summary :global(.chev) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .sfold[open] summary :global(.chev) {
    transform: rotate(90deg);
  }
  .sfold[open] summary {
    border-bottom: 1px solid var(--line);
  }
  .fold-in {
    padding: 12px 16px 16px;
    min-width: 0;
  }
  /* A small phone: the summary goes under the name, so neither is squeezed. */
  @media (max-width: 400px) {
    summary {
      flex-wrap: wrap;
    }
    .sum {
      order: 4;
      flex-basis: 100%;
      text-align: left;
      padding-left: 32px;
    }
    summary :global(.chev) {
      margin-left: auto;
    }
  }
</style>
