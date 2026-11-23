<script>
  /**
   * «Zusammenhänge» (Noah 22.11.2026 «a», Schritt L): the night after sauna, meditation and the like against the other nights (deep sleep), and the
   * felt sleep against the watch. From 20 times on a line says what it found with how sure it is; before that it says only how many more times
   * it needs. «So gerechnet» opens the arithmetic. Observation only: going together is not a cause. The rules are pure and tested
   * (lib/flow/zusammenhang.js). Nothing to show (no ritual ticked, no answer of «How did you sleep?»), nothing shown.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { actName } from './ui.svelte.js';
  import { normAct } from '../flow.js';
  import { localDay } from '../localday.js';
  import { SLEEP_Q } from '../weekreview.js';
  import { zusammenhaenge, MIN_TIMES, T_PROBABLY, T_CLEARLY } from './zusammenhang.js';
  import { t, tn, num } from '../i18n.svelte.js';

  const q = liveQuery(async () => {
    const [health, log, acts, answers] = await Promise.all([db.healthDays.toArray(), db.flowLog.toArray(), db.flowActs.toArray(), db.abAnswers.where('qid').equals(SLEEP_Q).toArray()]);
    return { health, log, acts: acts.map(normAct), feel: answers.map((a) => ({ day: a.day, value: a.value })) };
  });
  const r = $derived($q ? zusammenhaenge({ ...$q, today: localDay() }) : null);
  const nameOf = (id) => actName(($q?.acts ?? []).find((a) => a.id === id)) || id;
  const SURE = { clear: 'Quite sure', probably: 'Probably', unsure: 'Not sure yet: no clear difference' };
  const any = $derived(!!r && (r.rituals.length > 0 || !!r.feel));
</script>

{#if any}
  <section class="card zh" data-zusammenhang aria-labelledby="zh-h">
    <h2 id="zh-h">{t('What goes together in your days')}</h2>
    <ul>
      {#each r.rituals as x (x.actId)}
        <li data-zh-ritual={x.actId} data-zh-kind={x.kind}>
          {#if x.kind === 'wait'}
            {tn(x.left, 'After {name}: deep sleep. {n} more time to go ({have} so far).', 'After {name}: deep sleep. {n} more times to go ({have} so far).', { name: nameOf(x.actId), have: x.n })}
          {:else}
            {t('After {name}: deep sleep {a} min against {b} min on the other nights ({n} times).', { name: nameOf(x.actId), a: num(x.mOn), b: num(x.mOff), n: x.on })}
            <small data-zh-sure={x.sure}>{t(SURE[x.sure])}</small>
          {/if}
        </li>
      {/each}
      {#if r.feel}
        <li data-zh-feel data-zh-kind={r.feel.kind}>
          {#if r.feel.kind === 'wait' && r.feel.flat}
            {t('Felt sleep against the watch: your answers hardly differ yet, so there is nothing to compare.')}
          {:else if r.feel.kind === 'wait'}
            {tn(r.feel.left, 'Felt sleep against the watch: {n} more night with an answer to go ({have} so far).', 'Felt sleep against the watch: {n} more nights with an answer to go ({have} so far).', { have: r.feel.n })}
          {:else}
            {t('On nights you felt rested (above your usual feeling) the watch measured {a} min of sleep, otherwise {b} min.', { a: num(r.feel.mOn), b: num(r.feel.mOff) })}
            <small data-zh-sure={r.feel.sure}>{t(SURE[r.feel.sure])}</small>
          {/if}
        </li>
      {/if}
    </ul>
    <details class="how" data-zh-how>
      <summary>{t('How it is counted')}</summary>
      <p>{t('The night after the ritual against all other nights of the last twelve months (only nights the watch measured). How sure comes from the size of the difference against how much the nights vary: from {a} «probably», from {b} «quite sure». A line speaks from {n} times on; before that it only counts.', { a: num(T_PROBABLY), b: num(T_CLEARLY), n: MIN_TIMES })}</p>
    </details>
    <p class="cap">{t('Going together is not a cause. Only a look back, nothing is rated.')}</p>
  </section>
{/if}

<style>
  .zh {
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
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: var(--sp-2);
  }
  li {
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  li small {
    display: block;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .how summary {
    cursor: pointer;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .how p,
  .cap {
    margin: var(--sp-2) 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
    overflow-wrap: break-word;
  }
  .cap {
    margin: 0;
  }
</style>
