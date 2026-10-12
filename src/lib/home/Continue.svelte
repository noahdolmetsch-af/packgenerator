<script>
  /**
   * v0.67.0 «Übergänge 1» (rule U3, Noah U24b, Ü6a, U22b; flow audit U007): one small block at the top
   * of Today, before the rest of the page (which E1 rebuilds later):
   * - from 18:00 the evening before a start: «Morgen geht's los: …» (when its reminder is on, U21a);
   *   v0.106.0 (Noah 1-5a): it opens «Gepackt» with the evening-before check (was the packing day);
   * - on the evening of a trip's last day: «Letzter Abend: … Tour abschliessen» (the interstitial);
   * - «Weitermachen: Tour X · Packen, Schritt 2 von 4»: always the next planned trip (U24b), else a
   *   trip still waiting for its debrief. One tap opens exactly that step (phase.js stepOf).
   * v0.73.0 «Ruhige Startseite» (Noah 2a): «Weitermachen» is left out when the trip card below already
   * leads with the same trip (cardId); it stays for another trip and for the evening rows.
   * v0.102.0 Design-Refresh P4 (T1, approved 12.10.2026): banner on Touren: «Weitermachen» as a soft band
   * with the step's icon, the trip, how far it is packed and «Weiter ›» on the right (the page's one main action).
   */
  import { ChevronRight, Moon, Flag, Backpack, Map as MapIcon, Bike, NotebookPen } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';
  import { TAB_NAMES } from '../tabs.js';
  import { nextTrip, toDebrief } from '../debrief.js';
  import { openTrip } from '../nav.js';
  import { stepOf, eveningBefore, lastEvening, betweenHref } from '../phase.js';
  import { sameAsCard } from './ruhig.js';

  let { trips, debriefs, today, hour, cardId = null, banner = false } = $props();
  const STEP_ICON = { plan: MapIcon, pack: Backpack, ride: Bike, debrief: NotebookPen };

  const done = (x) => debriefs.some((d) => d.tripId === x.id && d.status === 'done');
  const lead = $derived(nextTrip(trips, today) ?? toDebrief(trips, debriefs, today)[0] ?? null);
  const step = $derived(lead && !sameAsCard(lead.id, cardId) ? stepOf(lead, today, { debriefDone: done(lead) }) : null);
  const eve = $derived(trips.find((x) => eveningBefore(x, today, hour)) ?? null);
  const last = $derived(trips.find((x) => lastEvening(x, today, hour, { debriefDone: done(x) })) ?? null);
</script>

{#if eve || last || (lead && step)}
  <div class="continue" data-section="continue">
    {#if eve}
      <a class="row eve" href={betweenHref(eve, 'packed')} onclick={() => openTrip(eve.id)} data-row="eve">
        <Moon size={20} aria-hidden="true" />
        <span class="tx"><b>{t("Tomorrow it starts: {trip}", { trip: eve.title })}</b><small>{t('Your evening-before check is waiting.')}</small></span>
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    {/if}
    {#if last}
      <a class="row eve" href={betweenHref(last, 'ended')} onclick={() => openTrip(last.id)} data-row="last">
        <Flag size={20} aria-hidden="true" />
        <span class="tx"><b>{t('Last evening: {trip}', { trip: last.title })}</b><small>{t('Back home? Finish the trip.')}</small></span>
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    {/if}
    {#if lead && step && banner}
      {@const Icon = STEP_ICON[step.key] ?? Backpack}
      {@const n = lead.entries?.length ?? 0}
      {@const p = (lead.entries ?? []).filter((e) => e.packed).length}
      <a class="row go band" href={step.href} onclick={() => openTrip(lead.id)} data-row="continue" data-step={step.key}>
        <span class="ic" aria-hidden="true"><Icon size={20} /></span>
        <span class="tx"><small>{t('Continue · {step}, step {n} of {total}', { step: t(TAB_NAMES[step.key]), n: step.n, total: step.total })}</small><b>{lead.title}{#if step.key === 'pack' && n}<span class="pk num">{` · ${tn(n, '{done} of {n} packed', '{done} of {n} packed', { done: p })}`}</span>{/if}</b></span>
        <span class="gob">{t('Continue|go')}<ChevronRight size={18} aria-hidden="true" /></span>
      </a>
    {:else if lead && step}
      <a class="row go" href={step.href} onclick={() => openTrip(lead.id)} data-row="continue" data-step={step.key}>
        <span class="tx"><small class="k">{t('Continue · {step}, step {n} of {total}', { step: t(TAB_NAMES[step.key]), n: step.n, total: step.total })}</small><b>{lead.title}</b></span>
        <ChevronRight size={18} aria-hidden="true" />
      </a>
    {/if}
  </div>
{/if}

<style>
  .continue {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    margin: 0 0 14px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
    text-decoration: none;
  }
  .row :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  .row.eve {
    background: var(--hi-soft);
    border-color: var(--hi-soft);
  }
  .tx {
    display: grid;
    flex: 1;
    min-width: 0;
    gap: 2px;
    overflow-wrap: break-word;
  }
  b {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  small {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .k {
    color: var(--hi);
    font-weight: 600;
  }
  /* v0.102.0 P4 (T1): the soft band on Touren */
  .row.band {
    min-width: 0;
    gap: 14px;
    min-height: 68px;
    padding: 12px 14px 12px 16px;
    border-color: transparent;
    background: var(--hi-soft);
    box-shadow: none;
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--r-ctl);
    background: var(--hi);
    color: var(--hi-ink);
  }
  .row.band .ic :global(svg) {
    color: var(--hi-ink);
  }
  .row.band b {
    font-size: var(--fs-sub);
  }
  .pk {
    font-weight: 400;
  }
  .gob {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0 12px 0 16px;
    border-radius: var(--r-ctl);
    background: var(--hi);
    color: var(--hi-ink);
    font-weight: 600;
  }
  .row.band .gob :global(svg) {
    color: var(--hi-ink);
  }
  /* a small phone: the text gets the room of the icon */
  @media (max-width: 379px) {
    .row.band {
      gap: 10px;
      padding-inline: 12px;
    }
    .row.band .ic {
      display: none;
    }
  }
  .row:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
