<script>
  /**
   * v0.49.0 R1 (Noah 6a): a small bar chart, drawn to scale from 0. values: [{ id, v }] oldest first
   * (v null: unknown, a thin grey mark); mark: the id drawn in the action colour (the newest trip);
   * avg: a dashed line. label: what the chart shows, for screen readers (the numbers sit beside it).
   */
  let { values = [], mark = null, avg = null, label = '', height = 44 } = $props();
  const W = 120;
  const top = $derived(Math.max(0, ...values.map((x) => x.v ?? 0), avg ?? 0) || 1);
  const step = $derived(values.length ? W / values.length : W);
  const bw = $derived(Math.max(2, step * 0.72));
  const y = (v) => height - (v / top) * (height - 2);
</script>

<svg class="spark" viewBox="0 0 {W} {height}" preserveAspectRatio="none" role="img" aria-label={label}>
  {#each values as x, i (x.id)}
    {#if x.v == null}
      <rect class="none" x={i * step + (step - bw) / 2} y={height - 1.5} width={bw} height="1.5" />
    {:else}
      <rect class:mark={x.id === mark} x={i * step + (step - bw) / 2} y={y(x.v)} width={bw} height={Math.max(1.5, height - y(x.v))} rx="1" />
    {/if}
  {/each}
  {#if avg != null && avg > 0}<line class="avg" x1="0" x2={W} y1={y(avg)} y2={y(avg)} vector-effect="non-scaling-stroke" />{/if}
</svg>

<style>
  .spark {
    display: block;
    width: 100%;
    height: 44px;
    overflow: visible;
  }
  rect {
    fill: var(--bar);
  }
  rect.mark {
    fill: var(--hi);
  }
  rect.none {
    fill: var(--line);
  }
  .avg {
    stroke: var(--ink-3);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
</style>
