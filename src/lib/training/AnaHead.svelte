<script>
  /**
   * TR7a–TR7c: the line over the analyses: «Analysen», how many show and «anpassen» (opens the sheet).
   * A group with everything hidden still shows this line, so the way back is never gone.
   */
  import { ana, openAnaSheet } from './analyses.svelte.js';
  import { ANALYSES } from './analyses.js';
  import { t, tn } from '../i18n.svelte.js';

  let { title = '', groups = ['act'], id = 'ana-h' } = $props();
  const all = $derived(groups.flatMap((g) => ANALYSES[g].map((a) => a.key)));
  const off = $derived(all.filter((k) => ana.hidden.includes(k)).length);
</script>

<div class="anh">
  <h2 {id}>{title || t('Analyses')}</h2>
  <p class="num">
    {t('{a} of {b}', { a: all.length - off, b: all.length })} ·
    <button type="button" class="btn-link" data-ana-adjust onclick={() => openAnaSheet(groups)}>{off ? tn(off, '{n} hidden · adjust', '{n} hidden · adjust') : t('each can be hidden · adjust')}</button>
  </p>
</div>

<style>
  .anh {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 4px 16px;
    margin: 0 2px;
  }
  h2 {
    margin: 0;
    font: 600 var(--fs-title, 1.4rem) / 1.25 var(--font-body);
  }
  p {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .btn-link {
    font: inherit;
    color: inherit;
    text-decoration: underline;
    background: none;
    border: 0;
    padding: 0;
    min-height: 32px;
    cursor: pointer;
  }
</style>
