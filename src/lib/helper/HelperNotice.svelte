<script>
  /**
   * v0.77.0 (answer 8a): the calm notice before the helper is set up. Only in New trip and in the
   * settings; everywhere else the helper simply is not there. «Was geht an Claude?» unfolds.
   */
  import { Sparkles, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import './helper.css';

  let { onsetup = null, setupButton = true } = $props();
  function setup() {
    onsetup?.();
    location.hash = '#/helper';
  }
</script>

<div class="kh-note" role="region" aria-label={t('Helper')}>
  <p class="kh-t"><span class="kh-ic"><Sparkles size={18} aria-hidden="true" /></span>{t('The helper is not set up yet')}</p>
  <p class="kh-s">{t('It suggests packing lists, learnings and bike care. Without it everything works as before.')}</p>
  {#if setupButton}<div class="kh-acts"><button type="button" class="btn" onclick={setup}>{t('Set up')}</button></div>{/if}
  <details class="kh-fold">
    <summary><span class="kh-chev"><ChevronRight size={16} aria-hidden="true" /></span>{t('What goes to Claude?')}</summary>
    <p>{t('Only your question and the names it needs from the list and your gear, plus your notes. Never photos, receipts or health data.')}</p>
    <p>{t('A request costs a few centimes.')}</p>
  </details>
</div>
