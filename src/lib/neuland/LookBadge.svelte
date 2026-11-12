<script>
  /**
   * «Sammlungen mit Charakter»: the small round picture of a collection, in its tint (a token, so it follows the
   * palette and the dark mode). look: { icon, tint } from lookOf(); size in px (only the icon).
   */
  import { Mountain, Binoculars, Waves, Droplets, Landmark, Footprints, Bike, TreePine, Tent, Coffee, Camera, Flower2, Castle, Route, Sun, MapPin } from '@lucide/svelte';

  let { look, size = 18 } = $props();
  const PIC = { mountain: Mountain, binoculars: Binoculars, waves: Waves, droplets: Droplets, landmark: Landmark, footprints: Footprints, bike: Bike, tree: TreePine, tent: Tent, coffee: Coffee, camera: Camera, flower: Flower2, castle: Castle, route: Route, sun: Sun, pin: MapPin };
  const Icon = $derived(PIC[look?.icon] ?? MapPin);
</script>

<span class="lb t-{look?.tint ?? 'ok'}" data-nl-look={`${look?.icon}.${look?.tint}`} aria-hidden="true"><Icon {size} /></span>

<style>
  .lb {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  .t-ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .t-hi {
    background: var(--hi-soft);
    color: var(--hi);
  }
  .t-warn {
    background: var(--warn-soft);
    color: var(--warn);
  }
  .t-brand {
    background: var(--brand);
    color: var(--brand-ink);
  }
  .t-ink {
    background: var(--paper-2);
    color: var(--ink-2);
  }
</style>
