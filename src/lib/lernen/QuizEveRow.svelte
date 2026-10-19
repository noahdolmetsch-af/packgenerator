<script>
  /**
   * Paket M «Quiz am Vorabend»: the small row «Quiz zum Vorabend · 3 Fragen» on «Gepackt» (#/trip/<id>/packed),
   * only when the quiz is on and only on the evening before the trip (phase.js eveningBefore, from 18:00).
   * ✕ puts it away for this trip (quiz.hidden); the quiz itself stays at #/quiz. A row of the list «Bis zum Start».
   */
  import { liveQuery } from 'dexie';
  import { Brain, ChevronRight, X } from '@lucide/svelte';
  import { db } from '../db.js';
  import { eveningBefore } from '../phase.js';
  import { QUIZ_KEY, PER_QUIZ, quizOf, showEveCard, hideCard } from './quiz.js';
  import { t } from '../i18n.svelte.js';

  let { trip, today, hour = new Date().getHours() } = $props();
  const q = liveQuery(() => db.settings.get(QUIZ_KEY));
  const show = $derived($q !== undefined && trip ? showEveCard($q?.value, trip, { today, hour, eveningBefore }) : false);
  async function hide() {
    await db.settings.put({ key: QUIZ_KEY, value: hideCard(quizOf($q?.value), trip.id) });
  }
</script>

{#if show}
  <li class="qe" data-quiz-eve>
    <a class="row" href="#/quiz/{encodeURIComponent(trip.id)}"><span class="ic" aria-hidden="true"><Brain size={18} /></span><span class="bt"><b>{t('Quiz the evening before · {n} questions', { n: PER_QUIZ })}</b><small>{t('About your gear and the route, only for fun')}</small></span><ChevronRight size={18} aria-hidden="true" /></a>
    <button type="button" class="x" aria-label={t('Put the quiz away for this trip')} onclick={hide} data-quiz-eve-hide><X size={16} aria-hidden="true" /></button>
  </li>
{/if}

<style>
  /* the look of the rows of «Bis zum Start» (Between.svelte); it sits between two of them */
  .qe {
    display: flex;
    align-items: center;
    min-width: 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }
  .row {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 12px;
    min-width: 0;
    min-height: 60px;
    padding: 6px 0;
    color: var(--ink);
    text-decoration: none;
  }
  .row :global(svg) {
    flex: none;
  }
  .row > :global(svg) {
    color: var(--ink-3);
  }
  .ic {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: var(--hi-soft);
    color: var(--ink-2);
  }
  .bt {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bt b {
    display: block;
    font-weight: 500;
  }
  .bt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .x {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
</style>
