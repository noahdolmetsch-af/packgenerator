<script>
  /**
   * Gruss B: «Knöpfe im Gruss» on «Deine Abfragen» (Ich › Wi gaht's?): the same editor as in the window
   * behind the greeting (HelloButtonsEdit), folded, so the buttons can be found where the questions are.
   */
  import { ChevronDown } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { buttonsQuery, saveButtons, defaults } from './hallobuttons.js';
  import HelloButtonsEdit from './HelloButtonsEdit.svelte';
  const q = buttonsQuery();
  const cfg = $derived($q ?? defaults());
</script>

<section class="ich-sec" aria-labelledby="hb-sec-h" data-hello-buttons>
  <details class="hbs">
    <summary class="ich-h"><div><h2 id="hb-sec-h">{t('Buttons of the greeting')}</h2><p class="ich-hs">{t('Faces, feelings and plans behind «Hoi, wi gaht\'s?»')}</p></div><ChevronDown class="hbchev" size={20} aria-hidden="true" /></summary>
    <div class="card side"><HelloButtonsEdit {cfg} onsave={saveButtons} /></div>
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
