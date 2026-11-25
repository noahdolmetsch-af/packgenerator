<script>
  /**
   * «Schreibweise» (Noah 25.11.2026): after you save the text of an own rule, a quiet line suggests a better spelling
   * (capital at the start of a sentence, «5 Std.» for «5h»). Only a suggestion: your text stays as you wrote it until you
   * tap «Use it». `text` is the text just saved; `ontake` gets the suggested one.
   */
  import { Check } from '@lucide/svelte';
  import { suggestSpelling } from '../schreibweise.js';
  import { t } from '../i18n.svelte.js';
  let { text = '', ontake } = $props();
  let kept = $state('');
  const sug = $derived(text && text !== kept ? suggestSpelling(text) : null);
</script>

{#if sug}
  <p class="spell" data-spell>
    <span class="sp-t">{t('Spelling suggestion:')} <b data-spell-text>{sug}</b></span>
    <span class="sp-b">
      <button type="button" class="ab-lnk" onclick={() => ontake?.(sug)} data-spell-take><Check size={16} aria-hidden="true" />{t('Use it')}</button>
      <button type="button" class="ab-lnk" onclick={() => (kept = text)} data-spell-keep>{t('Keep mine')}</button>
    </span>
  </p>
{/if}

<style>
  .spell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 14px;
    margin: 6px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sp-t b {
    color: var(--ink-2);
    font-weight: 600;
  }
  .sp-b {
    display: inline-flex;
    gap: 4px 14px;
    flex-wrap: wrap;
  }
</style>
