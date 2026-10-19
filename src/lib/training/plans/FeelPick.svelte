<script>
  /**
   * «Gefühlte Anstrengung» 1–10 for one activity (Noah 19.10.2026, thread «Trainingspläne» 3): ten buttons,
   * the own answer is kept on the activity (feel) and stays when Strava sends it again. A second tap on
   * the chosen number takes the answer away. Strava's «How hard?» shows as the start when there is no own one.
   */
  import { db } from '../../db.js';
  import { feelOf } from '../../training.js';
  import { t } from '../../i18n.svelte.js';

  let { act, onpicked = () => {} } = $props();
  const now = $derived(feelOf(act));
  const WORDS = { 1: 'very easy', 3: 'easy', 5: 'medium', 7: 'hard', 9: 'very hard', 10: 'all out' };
  async function pick(n) {
    await db.activities.update(act.id, n === act.feel ? { feel: null } : { feel: n, feelSkip: false });
    onpicked(n);
  }
</script>

<div class="fp" role="group" aria-label={t('Felt effort from 1 to 10')} data-feel-pick={act.id}>
  {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
    <button type="button" class="fb num" aria-pressed={now === n} onclick={() => pick(n)} data-feel={n}>{n}</button>
  {/each}
</div>
<p class="fw">{now ? t('{n} of 10: {word}', { n: now, word: t(WORDS[Object.keys(WORDS).map(Number).filter((k) => k <= now).at(-1)]) }) : t('1 = very easy, 10 = all out')}</p>

<style>
  .fp { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; }
  .fb { min-height: 40px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
  .fb[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .fw { margin: 6px 0 0; color: var(--ink-2); font-size: var(--fs-small); }
</style>
