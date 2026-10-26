<script>
  /**
   * Einzelidee 22 «Kategorien als Ansichten»: in the item window, the own views of Material it shows in
   * (Repair, Winter, Always along …). One item can be in several views; it is never copied. The views
   * themselves are added, renamed and deleted in Material › Own views.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { kindName } from '../ruhig/kinds.js';
  import { VIEWS_KEY, ownViewsOf, toggleOwnView } from './material.js';

  let { value = $bindable() } = $props();
  const q = liveQuery(() => db.settings.get(VIEWS_KEY));
  const views = $derived(ownViewsOf($q?.value));
</script>

{#if views.length}
  <fieldset class="iv wide" data-item-views>
    <legend class="lbl">{t('Also shows in these views')}</legend>
    {#each views as v (v.id)}
      <label class="cb"><input type="checkbox" checked={(value ?? []).includes(v.id)} onchange={() => (value = toggleOwnView(value, v.id, views))} /> {kindName(v, t)}</label>
    {/each}
    <p class="hint">{t('Add, rename or delete views in Material › Own views.')}</p>
  </fieldset>
{/if}

<style>
  .iv {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .iv legend {
    flex: 1 1 100%;
  }
  .hint {
    flex: 1 1 100%;
    margin: 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
