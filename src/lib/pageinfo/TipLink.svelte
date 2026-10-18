<script>
  /**
   * «Links nach aussen» at a tip (Noah 15.10.2026 «5a»): «More at meteoschweiz.admin.ch ↗», opens in a
   * new tab. Nothing when the tip has no link (tipLink in pageinfo.js).
   */
  import { ExternalLink } from '@lucide/svelte';
  import { tipLink } from '../pageinfo.js';
  import { t, lang } from '../i18n.svelte.js';

  let { tip } = $props();
  const l = $derived(tipLink(tip, lang.v));
</script>

{#if l}<a class="tlk" href={l.href} target="_blank" rel="noopener noreferrer" data-tip-link={tip.id}>{t('More at {site}', { site: l.domain })}<ExternalLink size={13} aria-hidden="true" /><span class="sr">{t('(opens elsewhere)')}</span></a>{/if}

<style>
  /* its own line under the tip, a whole finger high (guard: 44 px targets on a phone) */
  .tlk {
    display: flex;
    width: fit-content;
    max-width: 100%;
    align-items: center;
    gap: 4px;
    min-height: 44px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
