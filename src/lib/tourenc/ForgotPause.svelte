<script>
  /**
   * Touren c 61 «Vergessene Pause erkennen»: you stood a long time without «Pause» and ride on. A calm card over
   * the map asks what it was: rest, repair or waiting puts that time in as a pause with its reason; «Nothing»
   * leaves it. It never decides on its own and goes away after the answer.
   * ask: { from, to } (ms); onanswer(why | '').
   */
  import { t } from '../i18n.svelte.js';
  import { WHYS } from './pausewhy.js';

  let { ask, bottom = 12, onanswer } = $props();
  const min = $derived(Math.max(1, Math.round((ask.to - ask.from) / 6e4)));
</script>

<div class="fp-card" role="dialog" aria-labelledby="fp-h" style:bottom="{bottom + 64}px" data-live-forgot>
  <p class="fp-h" id="fp-h"><b>{t('You stood still for {n} min.', { n: min })}</b> {t('Was it a pause?')}</p>
  <p class="fp-s">{t('Then the riding time and the pauses are right afterwards.')}</p>
  <div class="fp-acts">
    {#each WHYS as w (w.key)}<button type="button" class="btn sm" onclick={() => onanswer(w.key)} data-forgot-why={w.key}>{t(w.name)}</button>{/each}
    <button type="button" class="btn sm btn-link" onclick={() => onanswer('')} data-forgot-no>{t('No, leave it')}</button>
  </div>
</div>

<style>
  .fp-card {
    position: absolute;
    left: 8px;
    right: 60px;
    z-index: 3;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper);
    border: 1px solid var(--line);
    box-shadow: 0 2px 8px var(--shadow);
    color: var(--ink);
  }
  .fp-h {
    margin: 0;
  }
  .fp-s {
    margin: 2px 0 8px;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .fp-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
