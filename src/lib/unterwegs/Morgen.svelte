<script>
  /**
   * Paket 4 «Bereit für morgen?» (Noah 19.10.2026 «3a»): inside «Bereit für …?» on the evening before a
   * tour. Free hints from the rules (morgen.js) always; with the KI helper set up and switched on, a
   * button asks it for a few hints of its own (task «evening», within the monthly cap). Optional.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t, nameOf, isDe } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { serviceDue, checkState } from '../care.js';
  import { ask, errorText, helper, isOn } from '../helper/client.svelte.js';
  import { eveningPayload } from '../helper/payload.js';
  import { eveningHints, nextDay } from './morgen.js';
  import { CloudSun, Package, Wrench, Lightbulb, BatteryCharging, Sparkles } from '@lucide/svelte';

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

  let busy = $state(false);
  let ki = $state(null);
  let msg = $state('');
  async function askKi() {
    busy = true;
    msg = '';
    const today = localDay();
    const learnings = await db.learnings.toArray();
    const r = await ask('evening', eveningPayload($state.snapshot(trip), { open, due, learnings, today, tomorrow: nextDay(today), lang: isDe() ? 'de' : 'en' }));
    busy = false;
    if (!r.ok) return (msg = errorText(r.error, { capChf: helper.capChf }));
    ki = r.result?.hints ?? [];
  }
</script>

<div class="morgen" data-morgen>
  <ul class="hl">
    {#each hints as h (h.key)}
      {@const I = ICON[h.kind]}
      <li data-hint={h.key}><I size={18} aria-hidden="true" /><span>{t(h.text, h.vars)}</span></li>
    {/each}
  </ul>
  {#if isOn()}
    {#if ki}
      <h3 class="uw-h3"><Sparkles size={16} aria-hidden="true" /> {t('From the AI helper')}</h3>
      {#if ki.length}
        <ul class="hl" data-morgen-ki>
          {#each ki as h, i (i)}
            {@const I = ICON[h.kind] ?? Lightbulb}
            <li><I size={18} aria-hidden="true" /><span>{h.text}</span></li>
          {/each}
        </ul>
      {:else}<p class="tp-small tp-muted">{t('The helper has nothing to add for tomorrow.')}</p>{/if}
    {:else}
      <button type="button" class="btn" onclick={askKi} disabled={busy} data-morgen-ask><Sparkles size={18} aria-hidden="true" />{busy ? t('The helper is thinking …') : t('Ask the AI helper for tomorrow')}</button>
      <p class="uw-fine">{t('Optional. Sends the trip, the weather, what is not packed and parts due; no health data.')}</p>
    {/if}
    {#if msg}<p class="tp-small" role="alert">{msg}</p>{/if}
  {/if}
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
