<script>
  /**
   * «Ruhige Punkte an allen Orten» (Noah 23.11.2026 «4a»): reads, on every page, how many ticks are open today and how many
   * tours that start soon still have things to pack, and hands the numbers to the menu (punkte.svelte.js). Draws nothing.
   * The ticks are counted exactly like «Heute abhaken» (flowQuery + flowStates), so the number is the same everywhere.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { flowQuery } from '../flow/data.svelte.js';
  import { flowStates } from '../flow.js';
  import { localDay } from '../localday.js';
  import { openTicks, toursToPack } from './punkte.js';
  import { punkte } from './punkte.svelte.js';
  import { ops } from '../bedienung.svelte.js';

  let today = $state(localDay());
  $effect(() => {
    const id = setInterval(() => (today = localDay()), 60_000);
    return () => clearInterval(id);
  });
  // a query only while its switch is on
  const flowQ = $derived(ops.dotplan ? flowQuery(today) : null);
  const tripsQ = $derived(ops.dottrips ? liveQuery(() => db.trips.toArray()) : null);
  $effect(() => {
    const q = flowQ;
    if (!q) {
      punkte.ticks = 0;
      return;
    }
    const sub = q.subscribe((data) => (punkte.ticks = data ? openTicks(flowStates(data.acts, data.log, today, data.tripDays)) : 0));
    return () => sub.unsubscribe?.();
  });
  $effect(() => {
    const q = tripsQ;
    if (!q) {
      punkte.tours = 0;
      return;
    }
    const day = today;
    const sub = q.subscribe((rows) => (punkte.tours = toursToPack(rows ?? [], day)));
    return () => sub.unsubscribe?.();
  });
</script>
