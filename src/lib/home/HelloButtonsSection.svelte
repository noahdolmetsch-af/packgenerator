<script>
  /**
   * Gruss B: «Knöpfe im Gruss» on «Deine Abfragen» (Ich › Wi gaht's?): the same editor as in the window
   * behind the greeting (HelloButtonsEdit), folded, so the buttons can be found where the questions are.
   * 21.11.2026: the editor is built only while the fold is open. Folded, it still built about 1500 elements and made
   * «Deine Abfragen» open slower for everyone (the guard test Seitengrösse, budget 2420, was red).
   */
  import { ChevronDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { buttonsQuery, saveButtons, defaults } from './hallobuttons.js';
  import HelloButtonsEdit from './HelloButtonsEdit.svelte';
  const q = buttonsQuery();
  const cfg = $derived($q ?? defaults());
  let open = $state(false);
</script>

<section class="ich-sec" aria-labelledby="hb-sec-h" data-hello-buttons>
  <details class="hbs" bind:open>
    <summary class="ich-h"><div><h2 id="hb-sec-h">{t('Buttons of the greeting')}</h2><p class="ich-hs">{t('Faces, feelings and plans behind «Hoi, wi gaht\'s?»')}</p></div><ChevronDown class="hbchev" size={20} aria-hidden="true" /></summary>
    {#if open}<div class="card side"><HelloButtonsEdit {cfg} onsave={saveButtons} /></div>{/if}
  </details>
</section>

<style>
  .hbs > summary {
    cursor: pointer;
    list-style: none;
  }
  .hbs > summary::-webkit-details-marker {
    display: none;
  }
  .hbs[open] :global(.hbchev) {
    transform: rotate(180deg);
  }
</style>
