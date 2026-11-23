<script>
  /**
   * «Kursblick» (Noah 22.11.2026): the choice of the comparison period, as chips: Day, Week, Month … 40 years, and
   * «Own»: a number and a unit (days, weeks, months, years) for any period up to 999. value: the key of the period
   * ({ key, n, unit }); onchange(period). An own period that does not fit is not taken.
   */
  import { t } from '../i18n.svelte.js';
  import { PERIODS, eigenerZeitraum } from './rechnen.js';

  let { value, onchange } = $props();
  let open = $state(false);
  let n = $state('45');
  let unit = $state('d');
  const own = $derived(String(value?.key ?? '').startsWith('own-'));
  const ok = $derived(!!eigenerZeitraum(n, unit));
  const UNITS = [['d', 'days'], ['w', 'weeks'], ['m', 'months'], ['y', 'years']];
  function take() {
    const p = eigenerZeitraum(n, unit);
    if (p) onchange?.(p);
  }
</script>

<div class="zeit" role="group" aria-label={t('Period')} data-zeitraum>
  {#each PERIODS as p (p.key)}
    <button type="button" class="chip" aria-pressed={value?.key === p.key} onclick={() => { open = false; onchange?.(p); }}>{t(p.label)}</button>
  {/each}
  <button type="button" class="chip" aria-pressed={own} aria-expanded={open} onclick={() => (open = !open)}>{t('Own period')}</button>
</div>
{#if open || own}
  <div class="eigen" data-eigen>
    <label>{t('Back by|kurs')} <input class="inp num" type="number" inputmode="numeric" min="1" max="999" bind:value={n} onchange={take} aria-label={t('Number')} /></label>
    <select class="inp" bind:value={unit} onchange={take} aria-label={t('Unit|kurs')}>
      {#each UNITS as [k, name] (k)}<option value={k}>{t(name)}</option>{/each}
    </select>
    <button type="button" class="btn hi" disabled={!ok} onclick={take}>{t('Show')}</button>
  </div>
{/if}

<style>
  .zeit {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
  }
  .chip {
    min-height: 40px;
    padding: 0 var(--sp-3);
    border: 1px solid var(--line);
    border-radius: var(--r-btn);
    background: var(--card, transparent);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
    border-color: var(--ink);
  }
  .eigen {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }
  .eigen input {
    width: 5.5em;
  }
</style>
