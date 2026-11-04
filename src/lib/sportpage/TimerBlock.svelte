<script>
  /**
   * «Aktiv und Auswerten» 5a (Noah 03.11.2026): the block «Timer» of a sport page, the template is Meditation's timer.
   * A sport of Aktiv opens the stopwatch window with this sport chosen (flow/ui.svelte.js openTimer); the minutes
   * it suggests are the minimum time of the sport when it has one. A sport without an activity of Aktiv (a trip
   * sport) has no stopwatch to start. The block can be switched off like every other («Adjust blocks»).
   */
  import { Timer, ChevronRight } from '@lucide/svelte';
  import { openTimer } from '../flow/ui.svelte.js';
  import { t } from '../i18n.svelte.js';

  let { sport } = $props();
  const act = $derived(sport?.act ?? null);
  const minutes = $derived(act?.minMin > 0 ? act.minMin : 0);
</script>

{#if act}
  <button type="button" class="srow" onclick={() => openTimer(act.id)} data-sport-timer>
    <Timer size={18} aria-hidden="true" />
    <span class="t"><b>{t('Start the timer')}</b><small>{minutes ? t('A stopwatch for this sport, suggested {n} minutes.', { n: minutes }) : t('A stopwatch for this sport. You set the time.')}</small></span>
    <ChevronRight size={16} aria-hidden="true" />
  </button>
{:else}
  <p class="none">{t('The timer is for sports you tick off in Active.')}</p>
{/if}

<style>
  .srow {
    display: flex;
    align-items: center;
    gap: var(--s-2, 0.5rem);
    width: 100%;
    text-align: left;
  }
  .t {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .t small {
    color: var(--ink-3, #6b6860);
    font-weight: 400;
  }
  .none {
    margin: 0;
    color: var(--ink-3, #6b6860);
  }
</style>
