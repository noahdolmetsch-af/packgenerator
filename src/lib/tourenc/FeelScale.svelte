<script>
  /**
   * Touren c 70 «Gefühl vor den Zahlen»: how hard it felt, 1 to 10, in one tap (like FeelPick on Aktiv, but for
   * any record). A second tap on the chosen number takes it away. value: 1–10 or null; onpick(n | null).
   */
  import { t } from '../i18n.svelte.js';

  let { value = null, onpick, label = '' } = $props();
  const WORDS = { 1: 'very easy', 3: 'easy', 5: 'medium', 7: 'hard', 9: 'very hard', 10: 'all out' };
  const word = (n) => t(WORDS[Object.keys(WORDS).map(Number).filter((k) => k <= n).at(-1)]);
</script>

<div class="fs" role="group" aria-label={label || t('Felt effort from 1 to 10')} data-feel-scale>
  {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
    <button type="button" class="fb num" aria-pressed={value === n} onclick={() => onpick(value === n ? null : n)} data-feel={n}>{n}</button>
  {/each}
</div>
<p class="fw">{value ? t('{n} of 10: {word}', { n: value, word: word(value) }) : t('1 = very easy, 10 = all out')}</p>

<style>
  .fs { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; }
  .fb { min-height: 40px; min-width: 0; padding: 0; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
  .fb[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .fw { margin: 6px 0 0; color: var(--ink-2); font-size: var(--fs-small); }
</style>
