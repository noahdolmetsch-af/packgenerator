<script>
  /**
   * How often the eat reminder comes: 30, 45 or 60 minutes, or your own (Noah 21.10.2026 «eigene dauer kann
   * eingerichtet werden»: 10 to 180 minutes). Used on the card «Ess-Erinnerung» (Unterwegs) and in Plan.
   */
  import { t } from '../i18n.svelte.js';
  import { EVERY, EVERY_MIN, EVERY_MAX, everyOf } from './essen.js';

  let { value = 45, onpick = () => {} } = $props();
  let own = $state(false);
  let typed = $state('');
  const custom = $derived(own || !EVERY.includes(value));
  $effect(() => {
    if (!EVERY.includes(value)) typed = String(value);
  });
  const pickOwn = () => {
    own = true;
    typed = EVERY.includes(value) ? '' : String(value);
  };
  const takeOwn = () => {
    const n = Number(typed);
    if (Number.isFinite(n) && n >= EVERY_MIN && n <= EVERY_MAX) onpick(everyOf(n));
  };
</script>

<div class="ee">
  <span class="tp-small">{t('Every')}</span>
  {#each EVERY as n (n)}<button type="button" class="tp-chip" aria-pressed={!custom && value === n} onclick={() => ((own = false), onpick(n))}>{t('{n} min', { n })}</button>{/each}
  <button type="button" class="tp-chip" aria-pressed={custom} onclick={pickOwn} data-eat-own>{t('Own|eat')}</button>
  {#if custom}
    <label class="tp-small own">
      <input class="inp num" type="number" inputmode="numeric" min={EVERY_MIN} max={EVERY_MAX} step="1" bind:value={typed} onchange={takeOwn} aria-label={t('Minutes between reminders')} data-eat-own-min />
      {t('min|eat')}
    </label>
    <small class="tp-small tp-muted">{t('{min} to {max} minutes', { min: EVERY_MIN, max: EVERY_MAX })}</small>
  {/if}
</div>

<style>
  .ee {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .own {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .own input {
    width: 5.5em;
  }
</style>
