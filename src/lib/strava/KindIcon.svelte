<script>
  /** «Training»: the icon of an activity's kind (bike, run, hike, other). */
  import { Bike, Footprints, Mountain, Activity } from '@lucide/svelte';

  let { kind = 'other', size = 18 } = $props();
  const Icon = $derived({ bike: Bike, run: Footprints, hike: Mountain }[kind] ?? Activity);
</script>

<Icon {size} aria-hidden="true" />
