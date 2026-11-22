<script>
  /**
   * Paket 4 «Bereit für morgen?» (Noah 19.10.2026 «3a»): inside «Bereit für …?» on the evening before a
   * tour. Free hints from the rules (morgen.js): weather, what is not packed, parts due.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { serviceDue, checkState } from '../care.js';
  import { eveningHints } from './morgen.js';
  import { CloudSun, Package, Wrench, Lightbulb, BatteryCharging } from '@lucide/svelte';

  let { trip } = $props();
  const itemsQ = liveQuery(() => db.items.toArray());
  const bikeQ = liveQuery(() => (trip?.bikeId ? db.bikes.get(trip.bikeId) : undefined));
  const byId = $derived(new Map(($itemsQ ?? []).map((i) => [i.id, i])));
  const open = $derived((trip?.entries ?? []).filter((e) => !e.packed && byId.has(e.itemId)).map((e) => nameOf(byId.get(e.itemId))));
  const due = $derived.by(() => {
    const b = $bikeQ;
    if (!b) return [];
    return [...serviceDue(b).map((s) => s.name), ...checkState(b).rows.filter((r) => r.due).map((r) => r.name)];
  });
  const hints = $derived(eveningHints({ wx: trip?.wx ?? null, open, due }));
  const ICON = { weather: CloudSun, pack: Package, bike: Wrench, learning: Lightbulb, rest: BatteryCharging };
</script>

<div class="morgen" data-morgen>
  <ul class="hl">
    {#each hints as h (h.key)}
      {@const I = ICON[h.kind]}
      <li data-hint={h.key}><I size={18} aria-hidden="true" /><span>{t(h.text, h.vars)}</span></li>
    {/each}
  </ul>
</div>

<style>
  .morgen {
    display: grid;
    gap: 8px;
  }
  .hl {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .hl li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    overflow-wrap: break-word;
  }
  .hl li :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .morgen p {
    margin: 0;
  }
</style>
