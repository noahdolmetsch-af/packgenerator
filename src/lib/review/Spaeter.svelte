<script>
  /**
   * R1 «Rückblick in drei Stufen» (Noah 23.11.2026): on the saved debrief of a trip, three short questions again
   * after 1 day, 1 week and 1 month. A stage that is due waits open; one that is not yet due says when; an answered one
   * shows the answers and can be changed. All answers are optional; a stage can stay empty. The answers belong to the
   * trip (trip.later), see spaeter.js.
   */
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { t, dateOf } from '../i18n.svelte.js';
  import { localDay } from '../localday.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { stagesOf, withLater, cleanAnswers, ANSWER_MAX } from './spaeter.js';
  import { Check } from '@lucide/svelte';

  let { trip } = $props();
  const today = localDay();
  const stages = $derived(stagesOf(trip, today));
  let editing = $state(null); // the key of a done stage that is changed
  let draft = $state({}); // key → three texts being typed

  const open = (s) => s.state === 'open' || editing === s.key;
  const textsOf = (s) => draft[s.key] ?? cleanAnswers(s.answers?.a);
  const type = (s, i, v) => {
    const cur = [...textsOf(s)];
    cur[i] = v;
    draft = { ...draft, [s.key]: cur };
  };
  async function save(e, s) {
    e.preventDefault();
    const before = $state.snapshot(trip.later ?? null);
    const next = withLater(trip, s.key, textsOf(s), today);
    await db.trips.update(trip.id, touched({ later: next }));
    editing = null;
    draft = { ...draft, [s.key]: undefined };
    offerDone(t('Answers saved.'), () => db.trips.update(trip.id, touched({ later: before })));
  }
</script>

{#if stages.length}
  <section class="tp-card spaeter" aria-labelledby="later-h" data-later>
    <h2 id="later-h">{t('Later, three questions each')}</h2>
    <p class="quiet">{t('After 1 day, 1 week and 1 month some things show that you cannot know today. Every answer is optional.')}</p>
    {#each stages as s (s.key)}
      <div class="stage" data-later-stage={s.key} data-later-state={s.state}>
        <h3>{t(s.name)}{#if s.state === 'done'}<Check size={16} aria-hidden="true" />{/if}</h3>
        {#if s.state === 'later'}
          <p class="quiet">{t('The questions come on {date}.', { date: dateOf(s.dueDay) })}</p>
        {:else if open(s)}
          <form onsubmit={(e) => save(e, s)}>
            {#each s.questions as q, i (q)}
              <label class="q">{t(q)}<input class="inp" type="text" maxlength={ANSWER_MAX} value={textsOf(s)[i]} oninput={(e) => type(s, i, e.currentTarget.value)} data-later-input={i} /></label>
            {/each}
            <p class="row"><button type="submit" class="btn sm" data-later-save>{t('Save')}</button>{#if editing === s.key}<button type="button" class="btn sm" onclick={() => ((editing = null), (draft = { ...draft, [s.key]: undefined }))}>{t('Cancel')}</button>{/if}</p>
          </form>
        {:else}
          <dl class="ans">
            {#each s.questions as q, i (q)}{#if s.answers.a[i]}<dt>{t(q)}</dt><dd>{s.answers.a[i]}</dd>{/if}{/each}
          </dl>
          <p><button type="button" class="tp-link" onclick={() => (editing = s.key)} data-later-edit>{t('Change')}</button></p>
        {/if}
      </div>
    {/each}
  </section>
{/if}

<style>
  .spaeter h3 { margin: 12px 0 4px; font-size: var(--fs-body); display: flex; align-items: center; gap: 6px; }
  .quiet { color: var(--ink-2); margin: 0 0 6px; overflow-wrap: break-word; }
  .q { display: grid; gap: 4px; margin: 8px 0; min-width: 0; font-size: var(--fs-small); color: var(--ink-2); }
  .row { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 0; }
  .ans { margin: 4px 0; display: grid; gap: 2px; }
  .ans dt { font-size: var(--fs-small); color: var(--ink-2); }
  .ans dd { margin: 0 0 6px; overflow-wrap: break-word; }
  .spaeter :global(.tp-link) { min-height: 44px; }
</style>
