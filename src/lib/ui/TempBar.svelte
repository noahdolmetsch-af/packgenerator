<script>
  /**
   * v0.59.0 (Baukasten): the temperature bar of a piece of clothing (scale −10 … 35 °C, the global
   * class .tbar of app.css, as in the wardrobe). Without a °C range the class warm / mittel / kalt
   * gives the bar (wardrobe.js tempKey). mark: the trip's range { min, max } as a thin frame on the
   * same scale, so the eye sees at once whether the piece covers the ride.
   */
  import { tempKey, barStyle, markStyle } from '../wardrobe.js';
  let { item, mark = null, width = 72 } = $props();
  const fill = $derived(barStyle(tempKey(item)));
  const frame = $derived(markStyle(mark));
</script>

{#if fill || frame}<span class="tbar tb" style="width:{width}px" aria-hidden="true">{#if fill}<i style={fill}></i>{/if}{#if frame}<b class="mk" style={frame}></b>{/if}</span>{/if}

<style>
  /* the frame of the trip's range: an outline above the colour, never a second colour */
  .tb { overflow: visible; }
  .mk { position: absolute; top: -3px; bottom: -3px; border: 1.5px solid var(--ink); border-radius: 4px; box-sizing: border-box; }
</style>
