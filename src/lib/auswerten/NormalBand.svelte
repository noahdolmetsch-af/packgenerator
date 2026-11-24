<script>
  /**
   * «Dein Normal» (Noah 24.11.2026 «eigenes normal»): one line that shows where a value stands in YOUR usual range of the last 12 months:
   * the light band is nearly all your days (10 %–90 %), the darker band the middle half, the tick the middle, the dot the value.
   * No colour of «good» or «bad»: it only shows where you are (observation).
   */
  let { normal, value = null, label = '' } = $props();
  const lo = $derived(Math.min(normal.p10, value ?? normal.p10));
  const hi = $derived(Math.max(normal.p90, value ?? normal.p90));
  const pad = $derived(Math.max(1, (normal.p90 - normal.p10) * 0.3));
  const a = $derived(lo - pad);
  const span = $derived(hi + pad - a || 1);
  const at = (v) => `${(((v - a) / span) * 100).toFixed(2)}%`;
  const w = (x, y) => `${(((y - x) / span) * 100).toFixed(2)}%`;
</script>

<span class="nb" role="img" aria-label={label} data-normal-band>
  <span class="all" style="left:{at(normal.p10)};width:{w(normal.p10, normal.p90)}"></span>
  <span class="mid" style="left:{at(normal.q1)};width:{w(normal.q1, normal.q3)}"></span>
  <span class="med" style="left:{at(normal.median)}"></span>
  {#if value != null}<span class="now" style="left:{at(value)}"></span>{/if}
</span>

<style>
  .nb {
    position: relative;
    display: block;
    height: 22px;
  }
  .nb::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 10px;
    height: 2px;
    background: var(--line);
  }
  .all,
  .mid {
    position: absolute;
    top: 5px;
    height: 12px;
    border-radius: 6px;
  }
  .all {
    background: var(--accent-soft);
  }
  .mid {
    background: color-mix(in srgb, var(--accent) 38%, var(--accent-soft));
  }
  .med {
    position: absolute;
    top: 3px;
    width: 2px;
    height: 16px;
    margin-left: -1px;
    background: var(--ink-3);
  }
  .now {
    position: absolute;
    top: 3px;
    width: 16px;
    height: 16px;
    margin-left: -8px;
    border-radius: 50%;
    background: var(--ink);
    border: 2px solid var(--paper);
    box-sizing: border-box;
  }
</style>
