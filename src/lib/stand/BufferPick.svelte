<script>
  /**
   * Paket A part 3, UC-228-I1: in «Woche planen» › Add › Date, time before and after the date as its own
   * entries (getting ready and the way there, the way back). Nothing is chosen at first.
   */
  import { t } from '../i18n.svelte.js';
  import { BUFFER_MIN } from './stand.js';

  let { before = $bindable(0), after = $bindable(0) } = $props();
  const label = (m) => (m ? t('{n} min', { n: m }) : t('None'));
</script>

<div class="bp" data-buffer-pick>
  <label>{t('Plan ahead (getting ready, the way there)')}
    <select bind:value={before} data-buffer-before>{#each BUFFER_MIN as m (m)}<option value={m}>{label(m)}</option>{/each}</select>
  </label>
  <label>{t('Plan afterwards (the way back)')}
    <select bind:value={after} data-buffer-after>{#each BUFFER_MIN as m (m)}<option value={m}>{label(m)}</option>{/each}</select>
  </label>
  <p class="why">{t('Becomes its own entry, so the time stays free.')}</p>
</div>

<style>
  .bp {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;
  }
  .bp label {
    display: grid;
    gap: 4px;
    min-width: 0;
    font-size: var(--fs-small);
  }
  .why {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
