<script>
  /**
   * Thin grid lines at the round steps of a scale (axis.js), inside an <svg>. ticks: the values; y(v): the
   * y of a value in the svg; x1/x2: where the lines start and end. The line at the bottom is a bit stronger.
   */
  let { ticks = [], y, x1 = 0, x2 = 100 } = $props();
</script>

<g class="grid" aria-hidden="true" data-grid>
  {#each ticks as v, i (v)}
    <line class:first={i === 0} {x1} {x2} y1={y(v)} y2={y(v)} vector-effect="non-scaling-stroke" />
  {/each}
</g>

<style>
  line {
    stroke: var(--line);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  line.first {
    stroke-dasharray: none;
  }
</style>
