<script>
  /**
   * «Von selbst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T3): at the top of Aktiv one card asks
   * «How was it?» about the newest Strava activity of the last 3 days without an answer, for every sport: three words
   * (light, good, hard) or «Later». The answer is kept on the activity (feelWord); the old 1–10 stays readable (feelword.js).
   * Before (Noah 19.10.2026, 1–10 after every ride): the card stood on Active › Training and asked only about rides.
   * «Later» asks no more for that activity (it is only asked within 3 days anyway); the page of the activity has all
   * the ways to answer later (words and 1–10). Draft: https://claude.ai/artifact/2gziTtHYQWcPa7wPDsWwah
   */
  import { liveQuery } from 'dexie';
  import { Gauge } from '@lucide/svelte';
  import { db } from '../../db.js';
  import { feelToAsk } from '../plans.js';
  import { shiftDay } from '../../training.js';
  import { FEEL_WORDS, FEEL_KEY, feelPatch } from '../../flow/feelword.js';
  import { dayWhen } from '../../strava/when.js';
  import { localDay } from '../../localday.js';
  import { t, num } from '../../i18n.svelte.js';
  import { stravaName } from '../../stravanames.js';

  const today = localDay();
  const q = liveQuery(() => db.activities.where('day').aboveOrEqual(shiftDay(today, -3)).toArray());
  const act = $derived(feelToAsk($q ?? [], today));
  const facts = $derived(
    act
      ? [
          act.km > 0 ? `${num(Math.round(act.km * 10) / 10)} km` : '',
          act.movingS > 0 ? t('{n} min', { n: Math.round(act.movingS / 60) }) : '',
          Number.isFinite(act.hrAvg) && act.hrAvg > 0 ? t('Heart rate avg {n}', { n: Math.round(act.hrAvg) }) : '',
        ].filter(Boolean)
      : [],
  );
  const later = () => db.activities.update(act.id, { feelSkip: true });
  const pick = (w) => db.activities.update(act.id, feelPatch(act, w));
</script>

{#if act}
  <section class="card fa" aria-labelledby="feel-h" data-section="feel-ask">
    <span class="fi" aria-hidden="true"><Gauge size={20} /></span>
    <div class="fc">
      <p class="fn">{t('New from Strava|feel')} · {dayWhen(act.day, act.time)}</p>
      <p class="fs"><b>{stravaName(act.name) || t('Activity')}</b>{#if facts.length}{' '}· {facts.join(' · ')}{/if}</p>
      <h2 id="feel-h" class="fh">{t('How was it?')}</h2>
      <div class="fw" role="group" aria-label={t('How was it?')}>
        {#each FEEL_WORDS as w (w)}
          <button type="button" class="fb" onclick={() => pick(w)} data-feel-word={w}>{t(FEEL_KEY[w])}</button>
        {/each}
        <button type="button" class="btn btn-link sm" onclick={later} data-feel-skip>{t('Later|feel')}</button>
      </div>
      <p class="fs">{t('Your answer helps the training plans when there is no heart rate. Only on this device.')}</p>
    </div>
  </section>
{/if}

<style>
  .fa { display: flex; gap: 12px; margin-bottom: 16px; border-color: var(--accent); background: var(--accent-soft); }
  .fi { color: var(--accent); padding-top: 2px; }
  .fc { flex: 1; min-width: 0; }
  .fn { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .fh { margin: 6px 0 8px; font-size: var(--fs-sub); }
  .fs { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .fs b { color: var(--ink); }
  .fw { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .fb { min-height: 44px; padding: 0 18px; border: 1px solid var(--line); border-radius: 99px; background: var(--paper); color: var(--ink); font: 600 var(--fs-small) var(--font-body); cursor: pointer; }
</style>
