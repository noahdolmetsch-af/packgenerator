<script>
  /**
   * «Weiter von hier» (UI-Prüfung 07.11.2026, Q1): one block at the end of a place with the ways on from here: what
   * fits right after an action, what fits this section and what the page names itself (src/lib/weitervon.js). A tap
   * jumps to the function and lets it glow (goFeature), as «Fits here» does. Only a suggestion: a function marked
   * «Not for me» (Me › Calmer) stays out. Used by no page yet.
   * Props: place (a key of PASST_HIER), moment (a key of ALS_NAECHSTES), also (feature ids), ontap (called before the jump).
   */
  import { liveQuery } from 'dexie';
  import { t } from '../i18n.svelte.js';
  import { db } from '../db.js';
  import { goFeature } from '../know/featureRun.js';
  import { NOT_KEY, notForMeOf } from '../ruhig/weniger.js';
  import { weiterVon } from '../weitervon.js';

  let { place = '', moment = '', also = [], ontap = null, ...rest } = $props();
  const notQ = liveQuery(async () => notForMeOf((await db.settings.get(NOT_KEY))?.value));
  const items = $derived($notQ ? weiterVon({ place, moment, also }, $notQ) : []);
  const hid = $derived(`wv-${place || moment || 'x'}`);
</script>

{#if items.length}
  <nav class="wv" aria-labelledby={hid} data-weiter-von={place || moment} {...rest}>
    <h3 id={hid}>{t('Continue from here')}</h3>
    <ul>
      {#each items as { f, why } (f.id)}
        <li><button type="button" class="chip" data-why={why} onclick={() => { ontap?.(); goFeature(f, {}); }} data-weiter-item={f.id}>{t(f.title)}</button></li>
      {/each}
    </ul>
  </nav>
{/if}

<style>
  .wv {
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
