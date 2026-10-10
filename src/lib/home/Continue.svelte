<script>
  /**
   * v0.67.0 «Übergänge 1» (rule U3, Noah U24b, Ü6a, U22b; flow audit U007): one small block at the top
   * of Today, before the rest of the page (which E1 rebuilds later):
   * - from 18:00 the evening before a start: «Morgen geht's los: …» (when its reminder is on, U21a);
   * - on the evening of a trip's last day: «Letzter Abend: … Tour abschliessen» (the interstitial);
   * - «Weitermachen: Tour X · Packen, Schritt 2 von 4»: always the next planned trip (U24b), else a
   *   trip still waiting for its debrief. One tap opens exactly that step (phase.js stepOf).
   */
  import { ChevronRight, Moon, Flag } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { TAB_NAMES } from '../tabs.js';
  import { nextTrip, toDebrief } from '../debrief.js';
  import { openTrip } from '../nav.js';
  import { stepOf, eveningBefore, lastEvening, betweenHref } from '../phase.js';

  let { trips, debriefs, today, hour } = $props();

  const done = (x) => debriefs.some((d) => d.tripId === x.id && d.status === 'done');
  const lead = $derived(nextTrip(trips, today) ?? toDebrief(trips, debriefs, today)[0] ?? null);
  const step = $derived(lead ? stepOf(lead, today, { debriefDone: done(lead) }) : null);
  const eve = $derived(trips.find((x) => eveningBefore(x, today, hour)) ?? null);
  const last = $derived(trips.find((x) => lastEvening(x, today, hour, { debriefDone: done(x) })) ?? null);
</script>

{#if eve || last || (lead && step)}
  <div class="continue" data-section="continue">
    {#if eve}
      <a class="row eve" href="#/pack?day" onclick={() => openTrip(eve.id)} data-row="eve">
        <Moon size={20} aria-hidden="true" />
        <span class="tx"><b>{t("Tomorrow it starts: {trip}", { trip: eve.title })}</b><small>{t('Charge the batteries, look at the weather, fill the bottles.')}</small></span>
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
    {#if lead && step}
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
  .row:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
