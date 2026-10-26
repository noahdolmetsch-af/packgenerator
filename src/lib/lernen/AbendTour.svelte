<script>
  /**
   * Paket M #223: in the evening review, on a trip day: «How was the trip «X» today?» on the scale
   * 1–10 (a tap on the chosen number takes it back). Saved in the trip's debrief (abendtour.js).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import Scale from '../flow/check/Scale.svelte';
  import { tripToday, rateEvening, rateEveningPart, partsOf, PARTS, MARKS, POOR_FROM } from './abendtour.js';
  import { ChevronRight } from '@lucide/svelte';

  let { trips = [], today } = $props();

  const trip = $derived(tripToday(trips, today));
  const dQ = $derived(trip ? liveQuery(() => db.debriefs.get(trip.id).then((r) => r ?? null)) : null);
  const score = $derived($dQ?.evening?.[today] ?? null);
  // Einzelidee Heute 4: a low score may say what it was about (all optional)
  const parts = $derived(partsOf($dQ, today));
  const split = $derived(score != null && (score <= POOR_FROM || Object.keys(parts).length > 0));

  async function pick(v) {
    const prev = await db.debriefs.get(trip.id);
    await db.debriefs.put(rateEvening(prev ?? null, $state.snapshot(trip), today, v));
  }
  async function mark(part, m) {
    const prev = await db.debriefs.get(trip.id);
    await db.debriefs.put(rateEveningPart(prev ?? null, $state.snapshot(trip), today, part, m));
  }
</script>

{#if trip && $dQ !== undefined}
  <div class="q at" data-q="tour" data-abendtour>
    <span class="qt"><b id="cq-tour">{t('How was the trip «{name}» today?', { name: trip.title || t('This trip') })}</b><small>{t('1 tough … 10 wonderful · goes into its debrief')}</small></span>
    <Scale value={score} label="cq-tour" onpick={pick} />
    {#if split}
      <div class="at-parts" data-abendtour-parts>
        <small>{t('What was it about? Only if you like; one tap each.')}</small>
        {#each PARTS as p (p.key)}
          <div class="at-row" role="group" aria-label={t(p.name)}>
            <span class="at-k">{t(p.name)}</span>
            {#each MARKS as m (m.key)}<button type="button" class="at-chip" aria-pressed={parts[p.key] === m.key} onclick={() => mark(p.key, m.key)} data-part={p.key} data-mark={m.key}>{t(m.name)}</button>{/each}
          </div>
        {/each}
      </div>
    {/if}
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
  .at-parts {
    display: grid;
    gap: 6px;
  }
  .at-parts small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .at-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    align-items: center;
  }
  .at-k {
    min-width: 5.5rem;
    font-weight: 500;
  }
  .at-chip {
    min-height: 44px;
    padding: 6px 10px;
    border: 1px solid var(--line-strong);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .at-chip[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .at-lnk {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    justify-self: start;
  }
</style>
