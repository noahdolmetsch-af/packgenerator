<script>
  /**
   * SN7 «Seiten neu» (Noah 13.10.2026 «ich gebe alle bild mockups frei», answer 5a): something rare in a
   * window, folded into one row: an icon, the label, a quiet summary right and a chevron
   * («Mehr Angaben · Typ, wofür, km-Stand ›»). Its content is only drawn while it is open.
   * icon: a lucide component; label; summary: the quiet text right; open: bindable; children: the content.
   */
  import { ChevronRight } from '@lucide/svelte';

  let { icon: Icon = null, label, summary = '', open = $bindable(false), children, ...rest } = $props();
</script>

<details class="foldrow" bind:open {...rest}>
  <summary>
    {#if Icon}<Icon class="fri" size={18} aria-hidden="true" />{/if}
    <span class="frl">{label}</span>
    {#if summary}<span class="frs">{summary}</span>{/if}
    <ChevronRight class="frc" size={18} aria-hidden="true" />
  </summary>
  {#if open}<div class="frin">{@render children()}</div>{/if}
</details>

<style>
  .foldrow {
    border-top: 1px solid var(--line);
  }
  summary {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 6px 0;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary :global(.fri) {
    flex: none;
    color: var(--ink-2);
  }
  .frl {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--ink);
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .frs {
    flex: 0 1 auto;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    text-align: right;
    overflow-wrap: break-word;
  }
  summary :global(.frc) {
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .foldrow[open] > summary :global(.frc) {
    transform: rotate(90deg);
  }
  .frin {
    padding: 0 0 14px;
  }
  /* a phone: the quiet summary goes on its own line under the label, the chevron stays right */
  @media (max-width: 480px) {
    summary {
      flex-wrap: wrap;
      row-gap: 0;
    }
    summary :global(.frc) {
      order: 2;
    }
    .frs {
      order: 3;
      flex: 1 0 100%;
      padding-left: 28px;
      text-align: left;
    }
  }
</style>
