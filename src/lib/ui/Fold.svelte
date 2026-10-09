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
  /* v0.47.0 (one type scale): the label in the row style (medium), the summary as its quiet sub line. */
  summary {
    flex-direction: column;
    gap: 2px;
  }
  summary .lbl {
    display: block;
    margin: 0;
    color: var(--ink);
    font: 500 15.5px/1.3 var(--font-body);
  }
  .sum {
    color: var(--ink-3);
    font-size: 14px;
    line-height: 1.4;
    min-width: 0;
  }
  .sum:empty {
    display: none;
  }
  .sum.late {
    color: var(--warn);
    font-weight: 500;
  }
  .fold-in {
    padding: 0 0 14px;
  }
</style>
