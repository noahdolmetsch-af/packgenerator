<script>
  /**
   * The rides of a try as dots (Noah 05.11.2026 «a», Persönliches Lernen Idee 2): one dot per ride, the rides
   * before the try above and during it below, on the same scale; the little bar marks each mean. The text under
   * it says the same in words, so the picture is a help, not the only way to read it.
   */
  import { t, num } from '../i18n.svelte.js';
  import { valueText } from '../analyse/format.js';

  let { before, during, mi } = $props();
  const all = $derived([...before.dots, ...during.dots].map((d) => d.v));
  const lo = $derived(Math.min(...all));
  const hi = $derived(Math.max(...all));
  const span = $derived(hi - lo || 1);
  // 4 % to 96 % of the track, so a dot at the edge is not cut off
  const at = (v) => 4 + ((v - lo) / span) * 92;
  const rows = $derived([
    { key: 'before', label: t('Before the try|exp'), side: before },
    { key: 'during', label: t('During the try|exp'), side: during },
  ]);
</script>

<div class="dots" data-exp-dots role="img" aria-label={t('Every ride as a dot, before and during the try, from {lo} to {hi}.|exp', { lo: valueText(mi, lo, num), hi: valueText(mi, hi, num) })}>
  {#each rows as r (r.key)}
    <div class="row" data-dots={r.key}>
      <span class="lab">{r.label}</span>
      <span class="track">
        {#each r.side.dots as d, i (i)}<span class="dot {r.key}" style="left:{at(d.v)}%"></span>{/each}
        {#if r.side.mean != null}<span class="mean" style="left:{at(r.side.mean)}%"></span>{/if}
      </span>
    </div>
  {/each}
  <div class="row" aria-hidden="true"><span></span><span class="scale"><span>{valueText(mi, lo, num)}</span><span>{valueText(mi, hi, num)}</span></span></div>
</div>

<style>
  .dots {
    display: grid;
    gap: var(--sp-1);
  }
  .row {
    display: grid;
    grid-template-columns: 6.5rem 1fr;
    align-items: center;
    gap: var(--sp-2);
  }
  .lab {
    font-size: var(--fs-small);
    opacity: 0.75;
  }
  .track {
    position: relative;
    height: 1.7rem;
    border-bottom: 1px solid var(--line);
  }
  .dot {
    position: absolute;
    top: 50%;
    width: 0.8rem;
    height: 0.8rem;
    margin: -0.4rem 0 0 -0.4rem;
    border-radius: 50%;
    opacity: 0.75;
  }
  .dot.before {
    background: var(--line-strong);
  }
  .dot.during {
    background: var(--accent);
  }
  .mean {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: currentColor;
  }
  .scale {
    display: flex;
    justify-content: space-between;
    font-size: var(--fs-small);
    opacity: 0.75;
  }
</style>
