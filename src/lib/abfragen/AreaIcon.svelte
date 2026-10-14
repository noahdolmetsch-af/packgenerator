<script>
  /** AB5: the icon of an area of «Deine Abfragen» (abfragen.js AREAS), a pencil for «Eigene». */
  import { BatteryCharging, Smile, Bike, Flower2, Users, Trees, Telescope, Target, Trophy, HeartPulse, Pencil } from '@lucide/svelte';
  import { AREA } from '../abfragen.js';

  let { area, size = 18 } = $props();
  const ICONS = { 'battery-charging': BatteryCharging, smile: Smile, bike: Bike, flower: Flower2, users: Users, trees: Trees, telescope: Telescope, target: Target, trophy: Trophy, 'heart-pulse': HeartPulse };
  const Icon = $derived(ICONS[AREA[area]?.icon] ?? Pencil);
</script>

<Icon {size} aria-hidden="true" />
