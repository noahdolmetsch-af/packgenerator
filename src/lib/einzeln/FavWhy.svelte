<script>
  /**
   * Einzelidee 19 «Warum Favorit?»: under «Why it is a favourite» a tap on a short reason (comfortable,
   * reliable, within reach …) adds it to the note. The reason shows again when you swap the piece while
   * packing and on a wish that replaces it. Everything stays a free text you can change.
   */
  import { t } from '../i18n.svelte.js';
  import { FAV_WHY, addWhy } from './material.js';

  let { value = $bindable() } = $props();
  const has = (w) => String(value ?? '').toLowerCase().includes(t(w).toLowerCase());
</script>

<div class="fw" role="group" aria-label={t('Quick reasons')} data-fav-why>
  {#each FAV_WHY as w (w)}
    <button type="button" class="btn sm" aria-pressed={has(w)} disabled={has(w)} onclick={() => (value = addWhy(value, t(w)))}>+ {t(w)}</button>
  {/each}
</div>

<style>
  .fw {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: -4px;
  }
</style>
