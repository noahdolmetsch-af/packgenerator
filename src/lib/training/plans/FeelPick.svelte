<script>
  /**
   * «Gefühlte Anstrengung» 1–10 for one activity (Noah 19.10.2026, thread «Trainingspläne» 3): ten buttons,
   * the own answer is kept on the activity (feel) and stays when Strava sends it again. A second tap on
   * the chosen number takes the answer away. Strava's «How hard?» shows as the start when there is no own one.
   */
  import { db } from '../../db.js';
  import { feelOf } from '../../training.js';
  import { t } from '../../i18n.svelte.js';
  import { FEEL_WORDS, FEEL_KEY, feelPatch } from '../../flow/feelword.js';

  let { act, onpicked = () => {} } = $props();
  // only an own number shows as chosen here; an answer in words («Von selbst») shows on the words row
  const ownNum = $derived(Number.isFinite(act?.feel) && act.feel >= 1 && act.feel <= 10 ? act.feel : null);
  const now = $derived(ownNum ?? (act?.feelWord ? null : feelOf(act)));
  const WORDS = { 1: 'very easy', 3: 'easy', 5: 'medium', 7: 'hard', 9: 'very hard', 10: 'all out' };
  async function pick(n) {
    await db.activities.update(act.id, n === act.feel ? { feel: null } : { feel: n, feelWord: null, feelSkip: false });
    onpicked(n);
  }
  async function word(w) {
    await db.activities.update(act.id, feelPatch(act, w));
    onpicked(w);
  }
</script>

<div class="fpw" role="group" aria-label={t('How was it?')} data-feel-words={act.id}>
  {#each FEEL_WORDS as w (w)}
    <button type="button" class="fb fbw" aria-pressed={act.feelWord === w} onclick={() => word(w)} data-feel-word={w}>{t(FEEL_KEY[w])}</button>
  {/each}
</div>

<div class="fp" role="group" aria-label={t('Felt effort from 1 to 10')} data-feel-pick={act.id}>
  {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
    <button type="button" class="fb num" aria-pressed={now === n} onclick={() => pick(n)} data-feel={n}>{n}</button>
  {/each}
</div>
<p class="fw">{act.feelWord && now == null ? t('Your answer: {word}', { word: t(FEEL_KEY[act.feelWord]) }) : now ? t('{n} of 10: {word}', { n: now, word: t(WORDS[Object.keys(WORDS).map(Number).filter((k) => k <= now).at(-1)]) }) : t('1 = very easy, 10 = all out')}</p>

<style>
  .fpw { display: flex; gap: 8px; margin-bottom: 8px; }
  .fbw { flex: 1; padding: 0 12px; }
  .fp { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; }
  .fb { min-height: 40px; border: 1px solid var(--line); border-radius: var(--r-ctl); background: var(--paper); color: var(--ink); font-weight: 600; cursor: pointer; }
  .fb[aria-pressed='true'] { background: var(--hi); border-color: var(--hi); color: var(--hi-ink); }
  .fw { margin: 6px 0 0; color: var(--ink-2); font-size: var(--fs-small); }
</style>
