<script>
  /** The name that shows when the mouse rests on a place of a map (Noah 27.11.2026 «bei Mouseover erscheint der Name der Gemeinde / Kanton»). tip: { text, x, y } in pixels inside the map frame, or null. */
  let { tip = null, width = 0 } = $props();
  const flip = $derived(tip && width && tip.x > width * 0.6);
</script>

{#if tip}
  <span class="tip" class:flip style:left="{tip.x}px" style:top="{tip.y}px" role="tooltip" data-map-tip>{tip.text}</span>
{/if}

<style>
  .tip {
    position: absolute;
    z-index: 5;
    transform: translate(14px, 14px);
    max-width: 70%;
    padding: 4px 10px;
    border-radius: var(--r-ctl);
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    box-shadow: var(--shadow-1);
  }
  .tip.flip {
    transform: translate(calc(-100% - 14px), 14px);
  }
</style>
