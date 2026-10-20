<script>
  /** AB5: the icon of an area of «Deine Abfragen» (abfragen.js AREAS), a pencil for «Eigene». */
  import { BatteryCharging, Smile, Bike, Flower2, Users, Trees, Telescope, Target, Trophy, HeartPulse, Pencil, Folder } from '@lucide/svelte';
  import { AREA } from '../abfragen.js';

  let { area, size = 18 } = $props();
  const ICONS = { 'battery-charging': BatteryCharging, smile: Smile, bike: Bike, flower: Flower2, users: Users, trees: Trees, telescope: Telescope, target: Target, trophy: Trophy, 'heart-pulse': HeartPulse };
  // an own group (Noah 20.10.2026): a folder; «Eigene»: the pencil
  const Icon = $derived(ICONS[AREA[area]?.icon] ?? (/^area-/.test(String(area ?? '')) ? Folder : Pencil));
</script>

<Icon {size} aria-hidden="true" />
