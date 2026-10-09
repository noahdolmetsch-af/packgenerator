<script>
  /**
   * v0.40.0 (Noah 4a): a segmented toggle instead of a drop-down with 2-4 choices. One tap, the
   * choice in sight. options: [{ key, name }] (name already translated); value: the chosen key.
   * The group is labelled (label or labelledby); each button tells its state with aria-pressed.
   */
  // v0.42.0 (Noah 1): suggest outlines a guessed choice (not chosen yet, one tap sets it); small: a
  // compact row (the wardrobe's layer and zone).
  let { options = [], value = null, onchange, label = '', labelledby = null, full = true, suggest = null, small = false } = $props();
</script>

<div class="seg" class:full class:small role="group" aria-label={labelledby ? undefined : label} aria-labelledby={labelledby}>
  {#each options as o (o.key)}
    <button type="button" data-key={o.key} class:sug={value !== o.key && suggest === o.key} aria-pressed={value === o.key} aria-description={value !== o.key && suggest === o.key ? o.hint : undefined} onclick={() => value !== o.key && onchange?.(o.key)}>{o.name}</button>
  {/each}
</div>

<style>
  /* v0.45.1 (G006): a word never breaks in the middle: a button is at least as wide as its longest
     word; when the row is too narrow (five zones at 320 px) the buttons wrap to a second row. */
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    max-width: 100%;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
    background: var(--paper);
  }
  .seg.full {
    display: flex;
    width: 100%;
  }
  button {
    flex: 1 1 0;
    min-width: min-content;
    min-height: calc(44px + 1.5px);
    margin: -1.5px 0 0 -1.5px; /* the left and top lines of the outer buttons hide under the frame */
    padding: 4px 10px;
    border: 0;
    border-left: 1.5px solid var(--line-strong);
    border-top: 1.5px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink);
    font: 500 15px/1.2 var(--font-body);
    overflow-wrap: break-word;
    cursor: pointer;
  }
  button:hover {
    background: var(--paper-2);
  }
  /* The chosen one: the dark ink, not orange (orange is only for the one main action). */
  button[aria-pressed='true'] {
    background: var(--brand);
    color: var(--brand-ink);
    font-weight: 600;
  }
  /* The guess: outlined, not filled. */
  button.sug {
    box-shadow: inset 0 0 0 2px var(--ink-2);
    background: var(--paper-2);
    font-weight: 600;
  }
  .small button {
    padding: 4px 6px;
    font-size: 13px;
  }
  /* Not full width: each button as wide as its word (v0.42.0). */
  .seg:not(.full) button {
    flex: 0 1 auto;
    padding-inline: 14px;
  }
  .seg.small:not(.full) button {
    padding-inline: 8px;
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -3px;
  }
</style>
