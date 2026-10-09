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
    <button type="button" data-key={o.key} class:sug={value !== o.key && suggest === o.key} aria-pressed={value === o.key} aria-description={value !== o.key && suggest === o.key ? o.hint : undefined} onclick={() => value !== o.key && onchange?.(o.key)}>{o.name}{#if o.n != null} <small class="n">{o.n}</small>{/if}</button>
  {/each}
</div>

<style>
  /* v0.45.1 (G006): a word never breaks in the middle: a button is at least as wide as its longest
     word; when the row is too narrow (five zones at 320 px) the buttons wrap to a second row.
     v0.47.0 (style sheet «Gletscher»): a soft grey tray, the chosen one a raised white pill. */
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px;
    max-width: 100%;
    padding: 3px;
    border-radius: 12px;
    background: var(--paper-2);
    box-sizing: border-box;
  }
  .seg.full {
    display: flex;
    width: 100%;
  }
  button {
    flex: 1 1 0;
    min-width: min-content;
    min-height: 44px;
    padding: 4px 12px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--ink-2);
    font: 500 15px/1.2 var(--font-body);
    overflow-wrap: break-word;
    cursor: pointer;
  }
  button:hover {
    color: var(--ink);
    background: color-mix(in srgb, var(--paper) 55%, transparent);
  }
  /* The chosen one: a raised white pill in ink (orange stays for the one main action). */
  button[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    font-weight: 600;
    box-shadow: 0 1px 3px var(--shadow);
  }
  /* The guess: outlined in the calm accent, not filled. */
  button.sug {
    box-shadow: inset 0 0 0 2px var(--accent);
    color: var(--ink);
    font-weight: 600;
  }
  /* v0.47.0: a small count after the name ("Velo 82") */
  .n {
    margin-left: 2px;
    color: var(--ink-3);
    font-size: 0.82em;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }
  .small button {
    padding: 4px 6px;
    font-size: 13.5px;
  }
  /* Not full width: each button as wide as its word (v0.42.0). */
  .seg:not(.full) button {
    flex: 0 1 auto;
    padding-inline: 14px;
  }
  .seg.small:not(.full) button {
    padding-inline: 9px;
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
</style>
