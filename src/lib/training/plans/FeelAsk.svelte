<script>
  /**
   * After every ride (Noah 19.10.2026 «gefühlte anstrengung 1-10, dies wird bei jeder abgeschlossenen tour
   * abgefragt»): on Aktiv › Training one card asks «How hard was it?» for the newest ride of the last
   * 3 days without an answer (own or from Strava). «Skip» asks no more for that ride. Without an answer the
   * felt effort simply does not count anywhere.
   */
  import { Gauge } from '@lucide/svelte';
  import FeelPick from './FeelPick.svelte';
  import { db } from '../../db.js';
  import { feelToAsk } from '../plans.js';
  import { dayWhen } from '../../strava/when.js';
  import { t } from '../../i18n.svelte.js';
  import { stravaName } from '../../stravanames.js';

  let { acts = [], today } = $props();
  const act = $derived(feelToAsk(acts, today));
  const skip = () => db.activities.update(act.id, { feelSkip: true });
</script>

{#if act}
  <section class="card fa" aria-labelledby="feel-h" data-section="feel-ask">
    <span class="fi" aria-hidden="true"><Gauge size={20} /></span>
    <div class="fc">
      <h2 id="feel-h" class="fh">{t('How hard was your ride?')}</h2>
      <p class="fs">{stravaName(act.name) || t('Ride')} · {dayWhen(act.day, act.time)}</p>
      <FeelPick {act} />
      <p class="fs">{t('Your answer helps the training plans when there is no heart rate. Only on this device.')}</p>
      <button type="button" class="btn btn-link sm" onclick={skip} data-feel-skip>{t('Skip|feel')}</button>
    </div>
  </section>
{/if}

<style>
  .fa { display: flex; gap: 12px; margin-bottom: 16px; }
  .fi { color: var(--accent); padding-top: 2px; }
  .fc { flex: 1; min-width: 0; }
  .fh { margin: 0; font-size: var(--fs-sub); }
  .fs { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
</style>
