<script>
  /**
   * «Testrunde» (Noah 27.11.2026 «1b 2a 3b 4b 5a»): how to test one release and the two answers, shared by the card on Today, the
   * window of the news and the list of all releases (Me › What is new).
   *   <TestRow e={entry} pr={1820} result={'ok' | 'fail' | undefined} compact onshow={...} />
   * compact: only the first step (the card on Today), else all steps. Nothing to test (a release nobody sees, or an old one without
   * steps) says so. «Works» and «Does not work» load know/testact.js on the tap only.
   */
  import { t, tn } from '../i18n.svelte.js';
  import { stepsOf } from '../logbuch/testrunde.js';
  import { Check, X } from '@lucide/svelte';

  let { e, pr = null, result = null, compact = false, onshow = null, showLabel = '' } = $props();
  const steps = $derived(stepsOf(e));
  async function works() {
    (await import('./testact.js')).markWorks(e, pr);
  }
  async function fails() {
    (await import('./testact.js')).markFails(e, pr);
  }
</script>

<div class="tr" data-test-row={e.version}>
  {#if steps.length}
    {#if compact}
      <p class="tr-s"><b>{t('How to test it')}:</b> {t(steps[0])}{#if steps.length > 1}{' '}<span class="tr-more">{tn(steps.length - 1, '+ {n} more step', '+ {n} more steps')}</span>{/if}</p>
    {:else}
      <p class="tr-h"><b>{t('How to test it')}</b></p>
      <ol class="tr-l">
        {#each steps as s, i (i)}<li>{t(s)}</li>{/each}
      </ol>
    {/if}
    <div class="tr-a">
      {#if onshow}<button type="button" class="tr-b tr-go" onclick={onshow} data-test-show>{showLabel || t('Show me')}</button>{/if}
      <button type="button" class="tr-b" class:on={result === 'ok'} aria-pressed={result === 'ok'} onclick={works} data-test-works><Check size={16} aria-hidden="true" />{t('Works|test')}</button>
      <button type="button" class="tr-b" class:on={result === 'fail'} aria-pressed={result === 'fail'} onclick={fails} data-test-fails><X size={16} aria-hidden="true" />{t('Does not work|test')}</button>
    </div>
  {:else}
    <p class="tr-s" data-test-none>{t('Nothing to test')}</p>
    {#if onshow}<div class="tr-a"><button type="button" class="tr-b tr-go" onclick={onshow} data-test-show>{showLabel || t('Show me')}</button></div>{/if}
  {/if}
</div>

<style>
  .tr {
    min-width: 0;
  }
  .tr-s,
  .tr-h {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .tr-h {
    color: var(--ink);
  }
  .tr-l {
    margin: 2px 0 0;
    padding-left: 20px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .tr-more {
    color: var(--ink-2);
  }
  .tr-a {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--sp-3);
    margin-top: 2px;
  }
  .tr-b {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .tr-b.on {
    text-decoration-thickness: 3px;
    color: var(--ok, var(--ink));
  }
</style>
