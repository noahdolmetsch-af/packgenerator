<script>
  /** v0.76.0 «Fünf Orte» 1: the icon of a place, the same in the sidebar and the bottom bar. */
  import { Sun, CloudSun, Route, Backpack, Bike, Activity, Mountain, CalendarDays, BarChart3, Pin } from '@lucide/svelte';

  let { place, size = 22 } = $props();
  const ICONS = { today: Sun, trips: Route, gear: Backpack, bikes: Bike, active: Activity, equipment: Mountain, week: CalendarDays, analysis: BarChart3, quick: Pin, weather: CloudSun }; // «Wetter» had no entry and fell back to the sun of Heute (24.11.2026: CloudSun); AU1: Ausrüstung; «Woche planen»; «Aktiv neu»: Auswerten
  const Icon = $derived(ICONS[place] ?? Sun);
</script>

<Icon {size} strokeWidth={2} aria-hidden="true" />
