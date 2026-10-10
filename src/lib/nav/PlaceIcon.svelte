<script>
  /** v0.76.0 «Fünf Orte» 1: the icon of a place, the same in the sidebar and the bottom bar. */
  import { Sun, Route, Backpack, Bike, Activity } from '@lucide/svelte';

  let { place, size = 22 } = $props();
  const ICONS = { today: Sun, trips: Route, gear: Backpack, bikes: Bike, active: Activity };
  const Icon = $derived(ICONS[place] ?? Sun);
</script>

<Icon {size} strokeWidth={2} aria-hidden="true" />
