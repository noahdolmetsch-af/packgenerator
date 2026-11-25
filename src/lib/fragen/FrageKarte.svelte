<script>
  /**
   * One question of «Fragen» as the page and the assistant show it: the answer in one sentence, its limit, the calm line «Stand»,
   * «Why? How it was counted» and «More about this». `slim`: a question that still needs data is one slim row («Needs 5 more days
   * with a ride»); a tap opens the sentence with its numbers, the limit, how it is counted and the way on. The words come from
   * saetze.js, the answer from `answerOf` (fragen.js): nothing is counted here.
   */
  import { ChevronDown } from '@lucide/svelte';
  import { GROUP, ASK, sentence, limit, HOW, more, need } from './saetze.js';
  import { t } from '../i18n.svelte.js';

  let { q, a, stand = '', slim = false } = $props();
  const m = $derived(more(q.key, a));
</script>

{#if slim}
  <div class="slim" data-frage={q.key} data-state={a.state}>
    <details>
      <summary>
        <span class="sm"><b>{ASK[q.key]()}</b><small data-frage-braucht>{need(q.key, a)}</small></span>
        <ChevronDown size={20} aria-hidden="true" />
      </summary>
      <div class="sb">
        <p class="ans few" data-frage-antwort>{sentence(q.key, a)}</p>
        <p class="lim">{limit(q.key, a)}</p>
        <p class="lim">{HOW[q.key]()}</p>
        {#if m}<a class="more" href={m.href} data-frage-mehr>{t('More about this')}: {m.label} ›</a>{/if}
      </div>
    </details>
  </div>
{:else}
  <div class="card q" data-frage={q.key} data-state={a.state}>
    <p class="g">{GROUP[q.group]()}</p>
    <h2 class="ask-t">{ASK[q.key]()}</h2>
    <p class="ans" data-frage-antwort>{sentence(q.key, a)}</p>
    <p class="lim">{limit(q.key, a)}</p>
    {#if stand}<p class="stand" data-frage-stand>{stand}</p>{/if}
    <details class="why">
      <summary>{t('Why? How it was counted')}</summary>
      <p>{HOW[q.key]()}</p>
    </details>
    {#if m}<a class="more" href={m.href} data-frage-mehr>{t('More about this')}: {m.label} ›</a>{/if}
  </div>
{/if}

<style>
  .q {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0;
  }
  .g {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .ask-t {
    margin: 0;
    font: 600 var(--fs-h3, 1.05rem) / 1.3 var(--font-body);
  }
  .ans {
    margin: 0;
    line-height: 1.5;
  }
  .ans.few {
    color: var(--ink-2);
  }
  .lim {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .stand {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .slim {
    border: 1px solid var(--line);
    border-radius: var(--r-lg, 14px);
    min-width: 0;
  }
  .slim summary {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 56px;
    padding: var(--sp-2) var(--sp-4);
    cursor: pointer;
    list-style: none;
    color: var(--ink-3);
  }
  .slim summary::-webkit-details-marker {
    display: none;
  }
  .slim .sm {
    flex: 1;
    min-width: 0;
    line-height: 1.35;
  }
  .slim .sm b {
    display: block;
    color: var(--ink);
    font-weight: 500;
  }
  .slim .sm small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .slim details[open] summary :global(svg) {
    transform: rotate(180deg);
  }
  .sb {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    padding: 0 var(--sp-4) var(--sp-2);
  }
  .why summary {
    display: flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .why p {
    margin: 0 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.45;
  }
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--ink);
    font-size: var(--fs-small);
    font-weight: 500;
  }
</style>
