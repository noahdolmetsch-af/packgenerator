<script>
  /**
   * «Deine Antworten» (Noah 22.11.2026 «4b», Schritt C): the answers of «Wi gaht's?» of the week in the review. One line per area from three
   * answers («Erholung: Ø 6,5, die Woche davor 4»), then every scale question on its own, also with one or two answers (then «zu wenig
   * Antworten»), and on how many days you answered at all. Observation only: no arrows of good or bad. The rules are pure and tested
   * (lib/weekrhythm.js answerLines). A week without any scale answer shows nothing (the question page is the place to start).
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { AB_KEY, areaLabel, questionOf } from '../abfragen.js';
  import { answerLines } from '../weekrhythm.js';
  import { shiftDay } from '../training.js';
  import { t, tn, num } from '../i18n.svelte.js';

  let { monday, upto } = $props();
  const q = $derived(
    liveQuery(async () => {
      const from = shiftDay(monday, -7);
      const [answers, cfg] = await Promise.all([db.abAnswers.where('day').between(from, shiftDay(monday, 6), true, true).toArray(), db.settings.get(AB_KEY)]);
      return { answers, cfg: cfg?.value ?? null };
    }),
  );
  const src = $derived($q);
  const lines = $derived(src ? answerLines(src.answers, monday, upto) : null);
  const name = (qid) => {
    const x = questionOf(src?.cfg, qid);
    return x ? (x.edited || x.own ? x.text : t(x.text)) : qid;
  };
  const area = (key) => areaLabel(src?.cfg, key, t) || key;
  const mean = (x) => (x == null ? '' : num(x));
  const prev = (x) => (x == null ? '' : t('week before: {n}', { n: num(x) }));
</script>

{#if lines && (lines.areas.length || lines.questions.length)}
  <section class="card wa" data-wr="answers" aria-labelledby="wr-answers">
    <h2 id="wr-answers">{t('Your answers')}</h2>
    <p class="say" data-answers-days>{tn(lines.of, 'You answered on {n} of {m} day.', 'You answered on {n} of {m} days.', { n: lines.days, m: lines.of })}</p>
    {#if lines.areas.length}
      <ul class="areas" data-answers="areas">
        {#each lines.areas as a (a.area)}
          <li data-answer-area={a.area}><span class="l">{area(a.area)}</span><b class="num">Ø {mean(a.mean)}</b><small>{tn(a.n, '{n} answer', '{n} answers')}{a.prev != null ? ` · ${prev(a.prev)}` : ''}</small></li>
        {/each}
      </ul>
    {/if}
    {#if lines.questions.length}
      <h3>{t('Each question')}</h3>
      <ul class="qs" data-answers="questions">
        {#each lines.questions as x (x.qid)}
          <li data-answer-q={x.qid}>
            <span class="l">{name(x.qid)}</span>
            {#if x.few}<small>{t('Too few answers ({n}).', { n: x.n })}</small>{:else}<b class="num">Ø {mean(x.mean)}</b><small>{tn(x.n, '{n} answer', '{n} answers')}{x.prev != null ? ` · ${prev(x.prev)}` : ''}</small>{/if}
          </li>
        {/each}
      </ul>
    {/if}
    <p class="cap">{t('Scale 1–10, the mean of your answers of the week. Only a look back, nothing is rated.')}</p>
  </section>
{/if}

<style>
  .wa {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-width: 0;
    margin: 0;
    padding: var(--sp-4);
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-body) / 1.3 var(--font-body);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0 var(--sp-3);
    align-items: baseline;
    font-size: var(--fs-body);
  }
  .l {
    overflow-wrap: break-word;
  }
  li small {
    grid-column: 1 / -1;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .say,
  .cap {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .say {
    font-size: var(--fs-body);
    color: var(--ink);
  }
</style>
