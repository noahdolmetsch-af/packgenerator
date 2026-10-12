<script>
  /**
   * v0.31.0 (Noah 9a, variant A): a section of Bikes → Setup that is set once and rarely needed.
   * Closed it is one quiet row (icon, name, short summary, ›) like the rows on the trip pages;
   * its content is only drawn while it is open. Same markup as ui/Fold (details.fold, summary .lbl).
   * Design-Refresh P7 «Velo» (V1): drawn like the rows of the new cards: the icon in a soft square,
   * the name with the summary below it, the chevron right. `flat`: a row inside a card (no own frame).
   */
  import { ChevronRight } from '@lucide/svelte';

  let { label, summary = '', late = false, icon: Icon = null, flat = false, cls = '', open = $bindable(false), children } = $props();
</script>

<details class="fold sfold {cls}" class:flat bind:open>
  <summary>
    {#if Icon}<span class="ib"><Icon class="ic" size={18} aria-hidden="true" /></span>{/if}
    <span class="m"><span class="lbl">{label}</span>{#if summary}<span class="sum" class:late>{summary}</span>{/if}</span>
    <ChevronRight class="chev" size={18} aria-hidden="true" />
  </summary>
  {#if open}<div class="fold-in">{@render children()}</div>{/if}
</details>

<style>
  .sfold {
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
    margin: 0 0 12px;
    font-size: var(--fs-body);
  }
  .sfold.flat {
    background: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    margin: 0;
  }
  summary {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 8px 16px;
    box-sizing: border-box;
    cursor: pointer;
    list-style: none;
  }
  .flat summary {
    padding: 8px 0;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .ib {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .m {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  summary .lbl {
    margin: 0;
    font-size: var(--fs-body);
    font-weight: 500;
    line-height: 1.3;
    color: var(--ink);
  }
  .sum {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
    overflow-wrap: break-word;
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
  @media (hover: hover) {
    summary:hover .lbl {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  .fold-in {
    padding: 4px 16px 16px;
    min-width: 0;
  }
  .flat .fold-in {
    padding: 4px 0 16px;
  }
  /* Cards inside an open row lose their own shadow, so a card never floats inside a card. */
  .fold-in :global(.card) {
    box-shadow: none;
    border: 1px solid var(--line);
  }
</style>
