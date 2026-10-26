<script>
  /**
   * Einzelidee 20 «Upgrade nach gelöstem Ärger»: on a wish, which trouble it solves (stays dry, fewer
   * chargers …). A solved trouble moves the wish up the list and shows as its reason, also when it saves no
   * grams. Ticking is optional and changeable.
   */
  import { t } from '../i18n.svelte.js';
  import { SOLVES, toggleSolve } from './material.js';

  let { value = $bindable() } = $props();
</script>

<fieldset class="ws wide" data-wish-solves>
  <legend class="lbl">{t('What trouble does it solve?')}</legend>
  <p class="hint">{t('A wish counts for this too, not only for grams.')}</p>
  {#each SOLVES as s (s.key)}
    <label class="cb"><input type="checkbox" checked={(value ?? []).includes(s.key)} onchange={() => (value = toggleSolve(value, s.key))} /> {t(s.name)}</label>
  {/each}
</fieldset>

<style>
  .ws {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .ws legend,
  .hint {
    flex: 1 1 100%;
  }
  .hint {
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
