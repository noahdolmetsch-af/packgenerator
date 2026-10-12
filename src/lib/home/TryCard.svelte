<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): a light card like every tile (it was dark).
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
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink);
  }
  .th {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink);
  }
  .next {
    min-height: 44px;
    margin: -10px -8px -10px 0;
    padding: 0 8px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--ink-2);
    font: 500 14px var(--font-body);
    cursor: pointer;
  }
  .next:hover {
    background: var(--paper-2);
  }
  .pitch {
    margin: 0;
    font: 600 18px/1.35 var(--font-body);
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
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctl);
    background: var(--paper);
    color: var(--ink);
    font: 600 15px var(--font-body);
    cursor: pointer;
  }
  .lvl {
    flex: 1 1 200px;
    font-size: 14px;
    color: var(--ink-3);
    text-align: right;
  }
</style>
