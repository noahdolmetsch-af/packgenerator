<script>
  /**
   * A section that is set once and rarely needed (v0.21.0, Bikes Setup and Care): closed, it is one
   * line with a label and a short summary; its content is only drawn while it is open.
   */
  let { label, summary = '', late = false, open = $bindable(false), children } = $props();
</script>

<details class="fold" bind:open>
  <summary><span class="lbl">{label}</span><span class="sum" class:late>{summary}</span></summary>
  {#if open}<div class="fold-in">{@render children()}</div>{/if}
</details>

<style>
  .fold {
    border-top: 1.5px solid var(--line);
    font-size: 15px;
  }
  .fold:last-child {
    border-bottom: 1.5px solid var(--line);
  }
  summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
    min-height: 44px;
    padding: 10px 0;
    box-sizing: border-box;
    cursor: pointer;
  }
  summary .lbl {
    display: inline;
    margin: 0;
    min-width: 9em;
  }
  .sum {
    color: var(--ink-2);
    font-size: 14px;
    min-width: 0;
  }
  .sum.late {
    color: var(--ink);
    font-weight: 700;
  }
  .fold-in {
    padding: 0 0 14px;
  }
</style>
