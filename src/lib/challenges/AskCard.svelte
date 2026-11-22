<script>
  /**
   * «Challenges» PR 4 (Noah 22.11.2026 «c»): the question every 10 days, a card at the top of the page «Challenges»:
   * «Time for a look: a new challenge, a milestone or a crazy idea?» with three buttons and «Later». A button answers
   * (the next question comes in 10 days) and goes on: «Challenge» opens the window for a new one (onchallenge),
   * «Milestone» and «Crazy idea» go to their pages. «Later» asks again tomorrow. Nothing is blocked; the card only shows
   * when the question is due (src/lib/challengeask.js, setting `challengeask`).
   */
  import { liveQuery } from 'dexie';
  import { Target, Flag, Lightbulb } from '@lucide/svelte';
  import { db } from '../db.js';
  import { putSetting } from '../flowdb.js';
  import { ASK_KEY, askOf, askDue, answered, postponed } from '../challengeask.js';
  import { t } from '../i18n.svelte.js';

  let { today, onchallenge } = $props();

  const q = liveQuery(async () => (await db.settings.get(ASK_KEY))?.value ?? null);
  // undefined while reading: nothing is shown until the record is known
  const rec = $derived($q);
  const due = $derived(rec !== undefined && askDue(rec, today));

  const save = (v) => putSetting(db, ASK_KEY, v);
  async function pick(where) {
    await save(answered(today));
    if (where === 'challenge') onchallenge?.();
    else location.hash = where === 'milestone' ? '#/flow/milestones' : '#/flow/ideen';
  }
  const later = () => save(postponed(askOf(rec), today));
</script>

{#if due}
  <section class="ask" aria-labelledby="ask-h" data-challenge-ask>
    <h2 id="ask-h" class="sh">{t('Time for a look')}</h2>
    <p>{t('Do you want a new challenge, a milestone or a crazy idea? Only if you like; nothing is needed.')}</p>
    <div class="acts">
      <button type="button" class="btn hi" onclick={() => pick('challenge')} data-ask-challenge><Target size={16} aria-hidden="true" />{t('Challenge')}</button>
      <button type="button" class="btn" onclick={() => pick('milestone')} data-ask-milestone><Flag size={16} aria-hidden="true" />{t('Milestone')}</button>
      <button type="button" class="btn" onclick={() => pick('idea')} data-ask-idea><Lightbulb size={16} aria-hidden="true" />{t('Crazy idea')}</button>
      <button type="button" class="btn quiet" onclick={later} data-ask-later>{t('Later')}</button>
    </div>
    <p class="small">{t('Asks again in 10 days. A message on the phone: Ich › Reminders on the phone.')}</p>
  </section>
{/if}

<style>
  .ask {
    display: grid;
    gap: 8px;
    padding: 12px 16px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .sh {
    margin: 0;
    font-size: var(--fs-body);
  }
  p {
    margin: 0;
    color: var(--ink-2);
  }
  .small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
