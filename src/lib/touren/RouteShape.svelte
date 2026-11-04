<script>
  /**
   * «Strecke als Bild» (Noah 03.11.2026, Paket E, Idee 23): the shape of a route as a small still sign.
   * d: the SVG path from streckenform.js shapeOf(); nothing is drawn without it. Purely decoration: the
   * name and the numbers next to it say the same, so it is hidden from screen readers.
   */
  import { SHAPE_W, SHAPE_H } from './streckenform.js';

  let { d = '' } = $props();
</script>

{#if d}
  <svg class="shape" viewBox="0 0 {SHAPE_W} {SHAPE_H}" aria-hidden="true" focusable="false" data-route-shape><path {d} /></svg>
{/if}

<style>
  .shape {
    flex: none;
    width: 64px;
    height: 40px;
    border-radius: 8px;
    background: var(--paper);
  }
  .shape path {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
