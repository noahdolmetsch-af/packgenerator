<script>
  /**
   * «Timer» face «Digital» (Z1–Z3, Noah 3a «Digital zuerst»): seven-segment digits like a clock radio,
   * the unlit segments faintly visible. text: «00:25:00» (digits and colons only); the screen reader
   * reads `label`.
   */
  let { text = '00:00', label = '', size = 'l' } = $props();

  // segments a b c d e f g of each digit
  const ON = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  // a slanted digit in a 60 × 100 box
  const SEG = {
    a: 'M14 4 L50 4 L44 12 L20 12 Z',
    b: 'M52 6 L58 6 L54 46 L46 42 L49 14 Z',
    c: 'M46 58 L54 54 L50 94 L44 94 L42 86 Z',
    d: 'M10 96 L46 96 L40 88 L16 88 Z',
    e: 'M8 54 L16 58 L13 86 L6 94 L4 94 Z',
    f: 'M10 6 L16 14 L14 42 L6 46 L8 6 Z',
    g: 'M12 50 L18 45 L44 45 L50 50 L44 55 L18 55 Z',
  };
  const chars = $derived([...String(text)]);
</script>

<span class="dg {size}" role="timer" aria-label={label || text}>
  {#each chars as c, i (i)}
    {#if c === ':'}
      <svg class="col" viewBox="0 0 20 100" aria-hidden="true"><circle cx="10" cy="34" r="6" /><circle cx="8" cy="70" r="6" /></svg>
    {:else}
      <svg class="dig" viewBox="0 0 60 100" aria-hidden="true">
        {#each Object.entries(SEG) as [k, d] (k)}
          <path {d} class:on={(ON[c] ?? '').includes(k)} />
        {/each}
      </svg>
    {/if}
  {/each}
</span>

<style>
  .dg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.06em;
    max-width: 100%;
    color: var(--ink);
    line-height: 0;
  }
  .dig {
    height: 1em;
    width: 0.6em;
    flex: none;
  }
  .col {
    height: 1em;
    width: 0.2em;
    flex: none;
    fill: currentColor;
  }
  path {
    fill: currentColor;
    opacity: 0.08;
  }
  path.on {
    opacity: 0.92;
  }
  /* the size of a clock: its own scale (the digits are drawn, 1em high) */
  .dg {
    font-size: var(--fs-dg);
  }
  .s {
    --fs-dg: 44px;
  }
  .m {
    --fs-dg: 72px;
  }
  .l {
    --fs-dg: clamp(56px, 13vw, 120px);
  }
  .xl {
    --fs-dg: clamp(72px, 16vw, 200px);
  }
</style>
