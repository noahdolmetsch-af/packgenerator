<script>
  import { readLite } from '../../actlite.js';
  /**
   * «Von selbst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T3): at the top of Aktiv one card asks
   * «How was it?» about the Strava activities of the last 3 days without an answer, for every sport: three words
   * (light, good, hard) or «Later». The answer is kept on the activity (feelWord); the old 1–10 stays readable (feelword.js).
   * Before (Noah 19.10.2026, 1–10 after every ride): the card stood on Active › Training and asked only about rides.
   * «Later» asks no more for that activity (it is only asked within 3 days anyway); the page of the activity has all
   * the ways to answer later (words and 1–10). Draft: https://claude.ai/artifact/2gziTtHYQWcPa7wPDsWwah
   * Noah 21.11.2026: the same for a workout the watch recorded (Fitbit via Google Health), asked like Strava; the newer of the two
   * is asked first, a workout that Strava has as well is asked once (healthfeel.js). The card shows more facts: pace or speed, climb,
   * heart rate, kcal, zone minutes (actfacts.js), only what is there.
   * Noah 27.11.2026 «Eine Fahrt = ein Eintrag»: a workout that Garmin (via Strava) has as well is not asked on the watch side, a plain
   * walk of the watch is never asked, pieces of one workout are asked once (dieselbe.js).
   * Noah 27.11.2026 «2a 3b»: the open ones stand as a small list (the first three, then «Show n more»), and every answer shows
   * «Kept: …» with Undo for 8 seconds (offerDone) instead of just vanishing.
   */
  import { liveQuery } from 'dexie';
  import { Gauge } from '@lucide/svelte';
  import { db } from '../../db.js';
  import { feelAllToAsk } from '../plans.js';
  import { shiftDay } from '../../training.js';
  import { FEEL_WORDS, FEEL_KEY, feelPatch } from '../../flow/feelword.js';
  import { dayWhen } from '../../strava/when.js';
  import { localDay } from '../../localday.js';
  import { t, num } from '../../i18n.svelte.js';
  import { stravaName } from '../../stravanames.js';
  import { HEALTH_FEEL_KEY, healthAllToAsk, withAnswer } from '../../flow/healthfeel.js';
  import { stravaFacts, healthFacts } from '../../flow/actfacts.js';
  import { offerDone } from '../../ui/rename.svelte.js';

  /** Noah 27.11.2026 «3b»: the open ones stand as a small list; the first SHOWN are visible, the rest behind one button. */
  const SHOWN = 3;
  const today = localDay();
  const q = liveQuery(() => readLite(db, (T) => T.where('day').aboveOrEqual(shiftDay(today, -3)).toArray()));
  const hq = liveQuery(() => db.healthDays.where('date').aboveOrEqual(shiftDay(today, -3)).toArray());
  const sq = liveQuery(() => db.settings.get(HEALTH_FEEL_KEY));
  let all = $state(false);
  const items = $derived(
    [
      ...feelAllToAsk($q ?? [], today).map((a) => ({ id: `s${a.id}`, watch: false, a, sort: `${a.day} ${a.time ?? ''}` })),
      ...healthAllToAsk($hq ?? [], $q ?? [], $sq?.value ?? null, today, shiftDay).map((a) => ({ id: `w${a.key}`, watch: true, a, sort: `${a.date} ${a.start ?? ''}` })),
    ].sort((x, y) => y.sort.localeCompare(x.sort)),
  );
  const rows = $derived(all ? items : items.slice(0, SHOWN));
  const hidden = $derived(items.length - rows.length);
  const facts = (it) => (it.watch ? healthFacts(it.a, t, num) : stravaFacts(it.a, t, num));
  const title = (it) => (it.watch ? it.a.name || t('Workout|feel') : stravaName(it.a.name) || t('Activity'));
  const when = (it) => (it.watch ? dayWhen(it.a.date, it.a.start) : dayWhen(it.a.day, it.a.time));

  /** Writes the answer and offers Undo (8 s): `word` is light/good/hard, or 'later'. */
  async function answer(it, word) {
    const a = it.a;
    if (it.watch) {
      const before = $sq?.value ?? null;
      await db.settings.put({ key: HEALTH_FEEL_KEY, value: withAnswer(before, a.key, word) });
      offerDone(word === 'later' ? t('Not asked again.') : t('Kept: {word}.', { word: t(FEEL_KEY[word]) }), () => db.settings.put({ key: HEALTH_FEEL_KEY, value: before }));
      return;
    }
    const before = { feelWord: a.feelWord ?? null, feel: a.feel ?? null, feelSkip: a.feelSkip ?? false };
    await db.activities.update(a.id, word === 'later' ? { feelSkip: true } : feelPatch(a, word));
    offerDone(word === 'later' ? t('Not asked again.') : t('Kept: {word}.', { word: t(FEEL_KEY[word]) }), () => db.activities.update(a.id, before));
  }
</script>

{#if rows.length}
  <section class="card fa" aria-labelledby="feel-h" data-section="feel-ask">
    <span class="fi" aria-hidden="true"><Gauge size={20} /></span>
    <div class="fc">
      <h2 id="feel-h" class="fh">{t('How was it?')}</h2>
      <ul class="fl">
        {#each rows as it (it.id)}
          <li class="fr" data-feel-row>
            <p class="fn">{it.watch ? t('New from Fitbit|feel') : t('New from Strava|feel')} · {when(it)}</p>
            <p class="fs"><b>{title(it)}</b>{#if facts(it).length}{' '}· {facts(it).join(' · ')}{/if}</p>
            <div class="fw" role="group" aria-label={`${t('How was it?')} ${title(it)}`}>
              {#each FEEL_WORDS as w (w)}
                <button type="button" class="fb" onclick={() => answer(it, w)} data-feel-word={w}>{t(FEEL_KEY[w])}</button>
              {/each}
              <button type="button" class="btn btn-link sm" onclick={() => answer(it, 'later')} data-feel-skip>{t('Later|feel')}</button>
            </div>
          </li>
        {/each}
      </ul>
      {#if hidden > 0}
        <button type="button" class="btn btn-link sm fmore" onclick={() => (all = true)} data-feel-more>{t('Show {n} more', { n: hidden })}</button>
      {/if}
      <!-- the answer for a Strava activity counts for the plans; a watch workout counts in the felt effort of Auswerten (Noah 27.11.2026 «1a») -->
      <p class="fs fnote">{rows.some((r) => !r.watch) ? t('Your answer helps the training plans when there is no heart rate. Only on this device.') : t('Only on this device.')}</p>
    </div>
  </section>
{/if}

<style>
  .fa { display: flex; gap: 12px; margin-bottom: 16px; border-color: var(--accent); background: var(--accent-soft); }
  .fi { color: var(--accent); padding-top: 2px; }
  .fc { flex: 1; min-width: 0; }
  .fl { list-style: none; margin: 0; padding: 0; }
  .fr + .fr { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }
  .fn { margin: 0; color: var(--ink-2); font-size: var(--fs-small); }
  .fh { margin: 0 0 8px; font-size: var(--fs-sub); }
  .fs { margin: 2px 0 8px; color: var(--ink-2); font-size: var(--fs-small); }
  .fs b { color: var(--ink); }
  .fnote { margin: 10px 0 0; }
  .fmore { margin-top: 6px; }
  .fw { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .fb { min-height: 44px; padding: 0 18px; border: 1px solid var(--line); border-radius: 99px; background: var(--paper); color: var(--ink); font: 600 var(--fs-small) var(--font-body); cursor: pointer; }
</style>
