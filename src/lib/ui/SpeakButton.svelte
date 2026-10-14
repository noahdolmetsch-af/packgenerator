<script>
  /**
   * FE10 «Sprechen statt tippen» (Noah 13.10.2026 23:52): a small microphone next to a note field. Only
   * where the browser can turn speech into text and while «Speak instead of type» is on (Ich ›
   * Darstellung › Bedienung). onsaid(words) gets the recognised words; the field appends them
   * (speak.js appendSpoken). A second tap stops listening.
   */
  import { Mic, Square } from '@lucide/svelte';
  import { t, lang } from '../i18n.svelte.js';
  import { ops } from '../bedienung.svelte.js';
  import { speechApi, speechLang, heard } from '../speak.js';

  let { onsaid = () => {} } = $props();
  const Speech = speechApi();
  let rec = null;
  let listening = $state(false);
  let failed = $state(false);

  function toggle() {
    if (listening) return rec?.stop();
    failed = false;
    try {
      rec = new Speech();
      rec.lang = speechLang(lang.v);
      rec.interimResults = false;
      rec.onresult = (e) => {
        const said = heard(e.results);
        if (said) onsaid(said);
      };
      rec.onend = () => (listening = false);
      rec.onerror = () => ((listening = false), (failed = true));
      rec.start();
      listening = true;
    } catch {
      listening = false;
      failed = true;
    }
  }
  $effect(() => () => rec?.abort?.());
</script>

{#if Speech && ops.speak}
  <button type="button" class="btn sm speak" aria-pressed={listening} onclick={toggle} data-speak-field>
    {#if listening}<Square size={14} aria-hidden="true" />{t('Stop|speak')}{:else}<Mic size={16} aria-hidden="true" />{t('Speak')}{/if}
  </button>
  {#if failed}<span class="sp-err" role="status">{t('Dictation did not work. Type instead.')}</span>{/if}
{/if}

<style>
  .speak {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .speak[aria-pressed='true'] {
    border-color: var(--hi);
    color: var(--hi);
  }
  .sp-err {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
