<script>
  /**
   * v0.44.0 "Rückblick 12 Monate" (Noah: "immer die letzten 12 Monate als Karte auf Heute"): a calm
   * card in the "Jump to" column, where the calendar season was. Up to 4 numbers (trips, km, nights
   * outside, base weight change), the one most interesting fact and "View →" to #/review. Only with
   * at least one finished trip or ride in the last 12 months. Not urgent: no colour, no button.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { loadReview } from '../review/load.js';
  import { yearReview, cardNumbers, highlight } from '../yearreview.js';
  import { cardLabel, cardValue, factText } from '../review/words.js';
  import { t } from '../i18n.svelte.js';

  let { today } = $props();

  const dataQ = liveQuery(() => loadReview(db));
  const review = $derived($dataQ ? yearReview({ ...$dataQ, today }) : null);
  const nums = $derived(cardNumbers(review));
  const fact = $derived(factText(highlight(review)));
</script>

{#if review && !review.empty}
  <section class="review" aria-labelledby="review-h" data-review-card>
    <h2 id="review-h" class="lbl">{t('Last 12 months')}</h2>
    {#if nums.length}
      <dl style:--n={nums.length}>
        {#each nums as n (n.key)}
          <div data-k={n.key}><dt>{cardLabel(n)}</dt><dd class="num">{cardValue(n)}</dd></div>
        {/each}
      </dl>
    {/if}
    {#if fact}<p class="fact">{fact}</p>{/if}
    <a class="view" href="#/review">{t('View →|review')}</a>
  </section>
{/if}

<style>
  .lbl {
    margin: 0;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
    color: var(--ink-3);
  }
  dl {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0 0;
  }
  @media (max-width: 479px) {
    dl {
      grid-template-columns: repeat(min(var(--n), 2), minmax(0, 1fr));
    }
  }
  dl div {
    display: flex;
    flex-direction: column-reverse;
    min-width: 0;
  }
  dd {
    margin: 0;
    font: 800 30px/1.05 var(--font-brand);
    white-space: nowrap;
  }
  dt {
    font-size: var(--fs-small);
    color: var(--ink-3);
    overflow-wrap: anywhere;
  }
  .fact {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .view {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    font-weight: 600;
  }
</style>
