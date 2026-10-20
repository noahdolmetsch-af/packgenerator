<script>
  /**
   * «Form und Erholung» in the Wochenrückblick: one line with the fitness and the form at the end of the
   * week and how the fitness changed against the week before; a tap opens the page «Form».
   */
  import { ChevronRight, Activity } from '@lucide/svelte';
  import { liveQuery } from 'dexie';
  import { loadTable } from '../../messwerte-data.js';
  import { formOf } from '../../form-data.js';
  import { weekForm } from '../../form.js';
  import { t, num } from '../../i18n.svelte.js';

  let { end } = $props();
  const q = $derived(liveQuery(async () => weekForm(formOf({ table: await loadTable(), today: end }).series, end)));
  const w = $derived($q);
  const sign = (n) => (n > 0 ? `+${num(n)}` : n < 0 ? `−${num(-n)}` : '±0');
</script>

{#if w}
  <a class="card wf" href="#/flow/form" data-wr="form">
    <Activity size={18} aria-hidden="true" />
    <span>
      <b>{t('Form and recovery')}</b>
      <small class="num">{t('Fitness {fit} ({delta} against the week before) · form {form}', { fit: num(w.fit), delta: w.delta == null ? '–' : sign(w.delta), form: sign(w.form) })}</small>
    </span>
    <ChevronRight size={18} aria-hidden="true" />
  </a>
{/if}

<style>
  .wf {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    color: var(--ink);
    text-decoration: none;
  }
  .wf:hover {
    background: var(--paper-2);
  }
  .wf span {
    display: grid;
  }
  .wf small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
