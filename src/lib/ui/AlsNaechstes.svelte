<script>
  /**
   * «Wegweiser statt Katalog» PR 9: the line «As next» inside the confirmation of an action (src/lib/alsnaechstes.js).
   * Only a suggestion: a function marked «Not for me» (Me › Calmer) stays out.
   */
  import { liveQuery } from 'dexie';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { goFeature } from '../know/featureRun.js';
  import { NOT_KEY, notForMeOf } from '../ruhig/weniger.js';
  import { alsNaechstes } from '../alsnaechstes.js';

  let { moment = '', ontap = null } = $props();
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const items = $derived($notQ ? alsNaechstes(moment, $notQ) : []);
</script>

{#if items.length}
  <span class="an" data-als-naechstes={moment}>
    <span class="alsn-lbl">{t('As next')}</span>
    {#each items as f (f.id)}
      <button type="button" class="chip" onclick={() => { ontap?.(); goFeature(f, {}); }} data-naechstes-item={f.id}>{t(f.title)}</button>
    {/each}
  </span>
{/if}

<style>
  .an {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    flex-basis: 100%;
    margin-top: 6px;
  }
  .alsn-lbl {
    font: 600 var(--fs-small)/1.3 var(--font-body);
    color: inherit;
    opacity: 0.85;
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
