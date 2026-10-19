<script>
  /**
   * Paket M «Quiz am Vorabend» (wish #207): one question at a time. A tap on an answer shows right or
   * wrong (and the right answer, with a short note like the weights); «Weiter» goes on. A question of your
   * own without wrong answers is a «Weisst du's?» card: «Antwort zeigen», then you say whether you knew it.
   * At the end: «2 von 3 richtig · Serie: 4 Touren» and «Nochmal». The rules are in lernen/quiz.js.
   * questions: from buildQuiz; streakN: the streak to show at the end; counted: false when this round
   * does not count (already done today, or the trip has started); onfinish({ right, of, ids }).
   */
  import { Check, X, ChevronRight, RotateCcw, Eye, Flame } from '@lucide/svelte';
  import { t, tn } from '../i18n.svelte.js';

  let { questions = [], streakN = 0, counted = true, onfinish } = $props();

  let at = $state(0);
  let picked = $state(null); // index of the tapped answer, or 'yes' / 'no' on a «Weisst du's?» card
  let shown = $state(false); // the answer of a «Weisst du's?» card is shown
  let score = $state([]); // true / false per question
  let done = $state(false);
  let rounds = $state(0); // «Nochmal»: a second round never counts
  const counts = $derived(counted && rounds === 0);

  const q = $derived(questions[at] ?? null);
  const right = $derived(score.filter(Boolean).length);
  const isRight = $derived(q && picked != null ? (q.answers.length ? !!q.answers[picked]?.right : picked === 'yes') : null);

  function pick(i) {
    if (picked != null) return;
    picked = i;
    score = [...score, q.answers.length ? !!q.answers[i].right : i === 'yes'];
  }
  function next() {
    if (at + 1 < questions.length) {
      at++;
      picked = null;
      shown = false;
      return;
    }
    done = true;
    onfinish?.({ right, of: questions.length, ids: questions.map((x) => x.id), counts });
  }
  function again() {
    at = 0;
    picked = null;
    shown = false;
    score = [];
    done = false;
    rounds++;
  }
</script>

<section class="quiz tp-card" data-quiz aria-live="polite">
  {#if !questions.length}
    <p class="tp-muted" data-quiz-empty>{t('No questions yet: this trip needs a packing list, a route or questions of your own.')}</p>
  {:else if done}
    <div class="end" data-quiz-end>
      <p class="res num"><b>{t('{n} of {m} right', { n: right, m: questions.length })}</b>{#if counts}<span class="streak"><Flame size={16} aria-hidden="true" />{tn(streakN, 'Streak: {n} trip', 'Streak: {n} trips')}</span>{/if}</p>
      {#if !counts}<p class="tp-muted tp-small">{t('Only for fun: one quiz a day counts, for a trip still ahead.')}</p>{/if}
      <button type="button" class="btn" onclick={again} data-quiz-again><RotateCcw size={16} aria-hidden="true" />{t('Again|quiz')}</button>
    </div>
  {:else if q}
    <p class="step num">{t('Question {n} of {m}', { n: at + 1, m: questions.length })}</p>
    <h3 class="qt" data-quiz-q={q.id}>{q.text}</h3>
    {#if q.answers.length}
      <ul class="ans">
        {#each q.answers as a, i (i)}
          <li>
            <button type="button" class="an" class:ok={picked != null && a.right} class:bad={picked === i && !a.right} disabled={picked != null && picked !== i && !a.right} aria-pressed={picked === i} onclick={() => pick(i)} data-quiz-a={a.right ? 'right' : 'wrong'}>
              <span>{a.text}</span>
              {#if picked != null && a.right}<Check size={18} aria-hidden="true" />{:else if picked === i}<X size={18} aria-hidden="true" />{/if}
            </button>
          </li>
        {/each}
      </ul>
    {:else if !shown}
      <p class="tp-muted tp-small">{t('Know it? Think of the answer, then look.')}</p>
      <button type="button" class="btn" onclick={() => (shown = true)} data-quiz-show><Eye size={16} aria-hidden="true" />{t('Show the answer')}</button>
    {:else}
      <p class="reveal" data-quiz-reveal>{q.reveal}</p>
      {#if picked == null}
        <div class="self">
          <button type="button" class="btn" onclick={() => pick('yes')} data-quiz-self="yes"><Check size={16} aria-hidden="true" />{t('I knew it')}</button>
          <button type="button" class="btn" onclick={() => pick('no')} data-quiz-self="no"><X size={16} aria-hidden="true" />{t('Not this time')}</button>
        </div>
      {/if}
    {/if}
    {#if picked != null}
      <p class="fb" class:ok={isRight} data-quiz-feedback={isRight ? 'right' : 'wrong'}>
        {#if isRight}<Check size={18} aria-hidden="true" />{t('Right!')}{:else}<X size={18} aria-hidden="true" />{q.answers.length ? t('Not quite. Right is «{a}».', { a: q.answers.find((a) => a.right).text }) : t('Next time then.')}{/if}
      </p>
      {#if q.note}<p class="tp-muted tp-small note">{q.note}</p>{/if}
      <button type="button" class="btn hi nx" onclick={next} data-quiz-next>{at + 1 < questions.length ? t('Next|quiz') : t('See the result')}<ChevronRight size={16} aria-hidden="true" /></button>
    {/if}
  {/if}
</section>

<style>
  .quiz {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .step {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .qt {
    margin: 0;
    font: 600 var(--fs-sub) / 1.35 var(--font-body);
    overflow-wrap: break-word;
  }
  .ans {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .an {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
  }
  .an:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .an.ok {
    border-color: var(--ok, var(--hi));
    background: var(--ok-soft);
  }
  .an.bad {
    border-color: var(--warn, var(--ink-3));
    background: var(--warn-soft);
  }
  .an :global(svg) {
    flex: none;
  }
  .fb {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .fb :global(svg) {
    flex: none;
  }
  .note {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .reveal {
    margin: 0;
    padding: 12px 14px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .self {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .btn :global(svg) {
    flex: none;
  }
  .nx {
    align-self: flex-start;
  }
  .end {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .res {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
</style>
