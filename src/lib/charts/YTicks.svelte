<script>
  /**
   * The labels of a value axis (axis.js), next to an <svg> that is stretched to the same height. ticks: the
   * values; y(v): the y of a value in the svg; h: the height of the svg's viewBox; text(v): the label;
   * unit: shown once, at the top label; side: 'left' or 'right'; color: of a layer with its own axis.
   */
  let { ticks = [], y, h, text = (v) => String(v), unit = '', side = 'left', color = null } = $props();
</script>

<div class="yt {side}" aria-hidden="true" data-yticks style={color ? `color:${color}` : ''}>
  {#each ticks as v, i (v)}
    <span style="top:{(y(v) / h) * 100}%">{text(v)}{#if unit && i === ticks.length - 1}&nbsp;{unit}{/if}</span>
  {/each}
</div>

<style>
  .yt {
    position: relative;
    flex: none;
    min-width: 34px;
    align-self: stretch;
    color: var(--ink-2);
    font-size: var(--fs-label);
    font-variant-numeric: tabular-nums;
  }
  span {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    white-space: nowrap;
    line-height: 1;
  }
  .right span {
    right: auto;
    left: 0;
  }
</style>
