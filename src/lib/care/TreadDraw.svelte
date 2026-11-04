<script>
  /**
   * «Reifenprofil als Verschleiss» (Noah 03.11.2026 «b», Paket C idea 16): a small drawing of the tread of a tyre
   * that gets smoother with the km. frac: the share of the life that is used (0 = new, 1 = at the limit, more is capped).
   * The blocks stay as wide as they are and only get lower; the line below is the road. A drawing with a text
   * alternative («Tread: 30 % left»); the bar and the km next to it say the same in numbers.
   */
  import { t, num } from '../i18n.svelte.js';

  let { frac = 0 } = $props();
  const used = $derived(Math.min(1, Math.max(0, Number(frac) || 0)));
  const left = $derived(Math.round((1 - used) * 100));
  const H = 20;
  const h = $derived(Math.max(2, Math.round(H * (1 - used) * 10) / 10));
  const BLOCKS = 28;
</script>

<svg class="tread" viewBox="0 0 280 30" role="img" aria-label={t('Tread: {pct} % left', { pct: num(left) })} data-tread={left}>
  {#each Array(BLOCKS) as _, i (i)}
    <rect x={i * 10 + 2} y={26 - h} width="6" height={h} rx="1.5" />
  {/each}
  <rect class="road" x="0" y="26" width="280" height="3" rx="1.5" />
</svg>

<style>
  .tread {
    display: block;
    width: 100%;
    max-width: 280px;
    height: auto;
    fill: var(--ink-2);
  }
  .road {
    fill: var(--ink);
  }
  @media (prefers-reduced-motion: no-preference) {
    rect:not(.road) {
      transition:
        y 500ms var(--ease-out),
        height 500ms var(--ease-out);
    }
  }
</style>
