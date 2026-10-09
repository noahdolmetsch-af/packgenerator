<script>
  /**
   * v0.46.0 «Startseite neu» (Noah 16a, 17a, 28a): "Tried it yet?", the dark card beside "Important
   * today". ONE card about a function never used, with ONE button; "Next ›" goes round. Below:
   * "You use 9 of 16 functions · Level 2". It took the place of "Good to know" (three cards): when
   * every function is used, the tips of "What the app can do" not yet tried take turns here.
   */
  import { t } from '../i18n.svelte.js';

  // list: [{ id, title?, text, button, run }] (texts already translated); used / total / level: numbers
  let { list = [], used = 0, total = 16, level = 1, onnext } = $props();

  let turn = $state(0);
  const pick = $derived(list.length ? list[turn % list.length] : null);
  function next() {
    turn++;
    onnext?.();
  }
</script>

<section class="try" aria-labelledby="try-h" data-try={pick?.id ?? 'none'}>
  <div class="th">
    <h2 id="try-h">{t('Tried it yet?')}</h2>
    {#if list.length > 1}<button type="button" class="next" onclick={next} aria-label={t('Next idea')}>{t('Next ›')}</button>{/if}
  </div>
  {#if pick}
    <p class="pitch">{pick.text}</p>
  {:else}
    <p class="pitch">{t('You know every function. Enjoy the ride!')}</p>
  {/if}
  <div class="foot">
    {#if pick}<button type="button" class="tryb" onclick={() => pick.run()}>{pick.button}</button>{/if}
    <span class="lvl num">{t('You use {n} of {total} functions · Level {level}', { n: used, total, level })}</span>
  </div>
</section>

<style>
  .try {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    padding: 18px 20px;
    border-radius: 18px;
    background: var(--brand);
    color: var(--brand-ink);
  }
  .th {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font: 500 14px/1.3 var(--font-body);
    color: var(--brand-ink-2);
  }
  .next {
    min-height: 44px;
    margin: -10px -8px -10px 0;
    padding: 0 8px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--brand-ink);
    font: 500 14px var(--font-body);
    cursor: pointer;
  }
  .next:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .next:focus-visible,
  .tryb:focus-visible {
    outline: 3px solid var(--focus-on-dark);
    outline-offset: 2px;
  }
  .pitch {
    margin: 0;
    font: 600 20px/1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    margin-top: auto;
  }
  .tryb {
    min-height: 44px;
    padding: 0 16px;
    border: 0;
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
  }
  .lvl {
    flex: 1 1 200px;
    font-size: 14px;
    color: var(--brand-ink-2);
    text-align: right;
  }
</style>
