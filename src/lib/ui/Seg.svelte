<script>
  /**
   * v0.40.0 (Noah 4a): a segmented toggle instead of a drop-down with 2-4 choices. One tap, the
   * choice in sight. options: [{ key, name }] (name already translated); value: the chosen key.
   * The group is labelled (label or labelledby); each button tells its state with aria-pressed.
   */
  // v0.42.0 (Noah 1): suggest outlines a guessed choice (not chosen yet, one tap sets it); small: a
  // compact row (the wardrobe's layer and zone).
  // v0.105.0 Design-Refresh P8 «Aktiv» (A2, A6): `chips` draws separate round chips, the chosen one filled in ink.
  // B15 «Gleitende Umschalter» (Noah 27.10.2026 «ich möchte b13 bis b24 alle umsetzen»): the white pill is one
  // shape behind the buttons that glides to the new choice in 0.25 s (it jumps with «Bewegung reduzieren»).
  // It is measured from the chosen button, so a row that wraps to two lines works too. Chips stay as they are.
  let { options = [], value = null, onchange, label = '', labelledby = null, full = true, suggest = null, small = false, chips = false } = $props();

  let box = $state(null);
  let pill = $state(null);
  let moving = $state(false);
  function measure() {
    const b = box?.querySelector('button[aria-pressed="true"]');
    pill = b && b.offsetWidth ? { x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight } : null;
  }
  $effect(() => {
    void value;
    void options;
    if (chips) return;
    measure();
  });
  $effect(() => {
    if (!box || chips || typeof ResizeObserver === 'undefined') return;
    // a new size (turned phone, narrower window) moves the pill at once: gliding there would let the old,
    // wider pill stick out for a moment and widen the page
    let f = 0;
    const ro = new ResizeObserver(() => {
      moving = false;
      measure();
      cancelAnimationFrame(f);
      f = requestAnimationFrame(() => (moving = true));
    });
    ro.observe(box);
    // the first place is set without gliding; after that every change glides
    f = requestAnimationFrame(() => (moving = true));
    return () => (ro.disconnect(), cancelAnimationFrame(f));
  });
</script>

<div class="seg" class:full class:small class:chips class:glide={!!pill} class:moving bind:this={box} role="group" aria-label={labelledby ? undefined : label} aria-labelledby={labelledby}>
  {#if pill}<span class="seg-track" aria-hidden="true"><span class="seg-pill" style:translate={`${pill.x}px ${pill.y}px`} style:width={`${pill.w}px`} style:height={`${pill.h}px`}></span></span>{/if}
  {#each options as o (o.key)}
    <button type="button" data-key={o.key} class:sug={value !== o.key && suggest === o.key} aria-pressed={value === o.key} aria-description={value !== o.key && suggest === o.key ? o.hint : undefined} onclick={() => value !== o.key && onchange?.(o.key)}>{o.name}{#if o.n != null}{' '}<small class="n">{o.n}</small>{/if}</button>
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
    font: 500 var(--fs-body)/1.2 var(--font-body);
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
  /* B15: the pill glides behind the buttons; the chosen button itself stays clear */
  .seg {
    position: relative;
  }
  /* the track clips the pill: a pill measured before the row got narrower never widens the page */
  .seg-track {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }
  .seg-pill {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 9px;
    background: var(--paper);
    box-shadow: 0 1px 3px var(--shadow);
    pointer-events: none;
  }
  .glide button {
    position: relative;
  }
  .glide button[aria-pressed='true'] {
    background: transparent;
    box-shadow: none;
  }
  @media (prefers-reduced-motion: no-preference) {
    .moving .seg-pill {
      transition: translate 0.25s cubic-bezier(0.23, 1, 0.32, 1), width 0.25s cubic-bezier(0.23, 1, 0.32, 1), height 0.25s;
    }
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
    font-size: var(--fs-small);
  }
  /* Not full width: each button as wide as its word (v0.42.0). */
  /* v0.78.0: never narrower than its word, and a short word («Alle») still gets a 44 px wide tap area */
  .seg:not(.full) button {
    flex: 0 0 auto;
    min-width: 44px;
    padding-inline: 14px;
  }
  .seg.small:not(.full) button {
    padding-inline: 9px;
  }
  button:focus-visible {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  /* v0.105.0 Design-Refresh P8 «Aktiv»: round chips side by side, the chosen one filled in ink */
  .seg.chips {
    gap: 6px;
    padding: 0;
    border-radius: 0;
    background: none;
  }
  .chips button {
    flex: 0 0 auto;
    padding: 4px 14px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-weight: 500;
  }
  .chips button[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--paper);
    box-shadow: none;
  }
</style>
