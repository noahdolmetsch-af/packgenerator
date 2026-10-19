<script>
  /**
   * Paket M #223: in the evening review, on a trip day: «How was the trip «X» today?» on the scale
   * 1–10 (a tap on the chosen number takes it back). Saved in the trip's debrief (abendtour.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import Scale from '../flow/check/Scale.svelte';
  import { tripToday, rateEvening } from './abendtour.js';
  import { ChevronRight } from '@lucide/svelte';

  let { trips = [], today } = $props();

  const trip = $derived(tripToday(trips, today));
  const dQ = $derived(trip ? liveQuery(() => db.debriefs.get(trip.id).then((r) => r ?? null)) : null);
  const score = $derived($dQ?.evening?.[today] ?? null);

  async function pick(v) {
    const prev = await db.debriefs.get(trip.id);
    await db.debriefs.put(rateEvening(prev ?? null, $state.snapshot(trip), today, v));
  }
</script>

{#if trip && $dQ !== undefined}
  <div class="q at" data-q="tour" data-abendtour>
    <span class="qt"><b id="cq-tour">{t('How was the trip «{name}» today?', { name: trip.title || t('This trip') })}</b><small>{t('1 tough … 10 wonderful · goes into its debrief')}</small></span>
    <Scale value={score} label="cq-tour" onpick={pick} />
    <a class="tp-link at-lnk" href="#/debrief/{trip.id}">{t('Whole debrief')}<ChevronRight size={14} aria-hidden="true" /></a>
  </div>
{/if}

<style>
  .at {
    display: grid;
    gap: var(--sp-2);
    padding: var(--sp-3) 0;
    border-top: 1px solid var(--line);
  }
  .qt b {
    display: block;
    font: 500 var(--fs-body) / 1.35 var(--font-body);
  }
  .qt small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .at-lnk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    justify-self: start;
  }
</style>
