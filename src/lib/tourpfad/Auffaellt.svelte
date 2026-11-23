<script>
  /**
   * «Das fällt auf» (Plan «ganze App», Schritt 7b): one sentence under the path of a tour whose debrief is saved, with «Why?».
   * It only reads (lib/tourpfad/auffaellt.js) and stores nothing. Without a sentence the block is not there.
   */
  import { t } from '../i18n.svelte.js';

  // hit: tourAuffaellt(...) or null
  let { hit = null } = $props();
  let open = $state(false);
</script>

{#if hit}
  <section class="af surf" data-tour-auffaellt={hit.key} aria-labelledby="taf-h">
    <h2 id="taf-h" class="h">{t('This stood out')}</h2>
    <p class="sen" data-tour-auffaellt-text>{hit.text}</p>
    <p class="why"><button type="button" class="quiet" aria-expanded={open} onclick={() => (open = !open)} data-tour-auffaellt-why>{t('Why?')}</button></p>
    {#if open}<p class="obs" data-tour-auffaellt-obs>{hit.why}</p>{/if}
  </section>
{/if}

<style>
  .af {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 18px;
    box-sizing: border-box;
  }
  .h {
    margin: 0;
    font-size: var(--fs-section);
  }
  .sen {
    margin: 0;
    font-size: var(--fs-body);
    color: var(--ink);
  }
  .why,
  .obs {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  .quiet {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .quiet::after {
    content: '';
    position: absolute;
    inset: -14px -8px;
  }
</style>
