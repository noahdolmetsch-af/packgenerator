<script>
  /**
   * «Alles finden 2» (Noah 22.10.2026 «1a», new proposal): pages that stood far down a long page (Rückblick › Heatmap,
   * Neuland …; Verschleiss › Velo verpacken …) as one row of chips right under the title. The rows further down stay.
   * links: [{ href, label, key }] (labels already translated); label: the row's name for screen readers.
   */
  let { links = [], label = '' } = $props();
</script>

{#if links.length}
  <nav class="ql" aria-label={label} data-quick-links>
    {#each links as l (l.key ?? l.href)}<a href={l.href} data-quick={l.key}>{l.label}</a>{/each}
  </nav>
{/if}

<style>
  .ql {
    display: flex;
    gap: 6px;
    margin: 0 0 12px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .ql a {
    flex: none;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 99px;
    background: var(--paper);
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
  }
  .ql a:hover {
    border-color: var(--ink-3);
  }
</style>
