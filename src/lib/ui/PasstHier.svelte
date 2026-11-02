<script>
  /**
   * «Wegweiser statt Katalog» PR 2: the row «Fits here» at the end of a section (src/lib/passthier.js). Only a suggestion:
   * a function marked «Not for me» (Me › Calmer) stays out.
   */
  import { liveQuery } from 'dexie';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { goFeature } from '../know/featureRun.js';
  import { NOT_KEY, notForMeOf } from '../ruhig/weniger.js';
  import { passtHier } from '../passthier.js';

  let { place = '' } = $props();
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const items = $derived($notQ ? passtHier(place, $notQ) : []);
  const hid = $derived(`ph-${place}`);
</script>

{#if items.length}
  <nav class="ph" aria-labelledby={hid} data-passt-hier={place}>
    <h3 id={hid}>{t('Fits here')}</h3>
    <ul>
      {#each items as f (f.id)}
        <li><button type="button" class="chip" onclick={() => goFeature(f, {})} data-passt-item={f.id}>{t(f.title)}</button></li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .ph {
    margin: 12px 0 0;
  }
  h3 {
    margin: 0 0 6px;
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: var(--ink-2);
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font: 500 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .chip:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
</style>
