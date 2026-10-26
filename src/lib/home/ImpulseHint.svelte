<script>
  /**
   * Paket T «Freie Zeit» (Noah 19.10.2026 «2a»): on a day without a ride idea, the spot «Idea for
   * today» on Heute shows an impulse instead (one quiet row). Off with the switch on the page Impulse;
   * «More» opens the tab Impulse of Aktiv.
   */
  import { Sparkles } from '@lucide/svelte';
  import { cfgQuery } from '../freidb.js';
  import { todayImpulse, impulseHref, collsOf } from '../frei.js';
  import { t } from '../i18n.svelte.js';
  import { suggest, watchSuggest } from '../clear/suggest.svelte.js'; // Einzelidee 36: «Ideas for free time» can be off

  let { today } = $props();
  const q = cfgQuery();
  watchSuggest();
  const imp = $derived($q === undefined || !suggest.on.impulse ? null : todayImpulse($q, today));
  const title = $derived(imp ? (imp.own || imp.edited ? imp.title : t(imp.title)) : '');
</script>

{#if imp}
  <div class="ih" data-impulse-today={imp.id}>
    <Sparkles size={20} aria-hidden="true" />
    <span class="it"><b>{t('Idea for today')}:</b> <span>{title}</span></span>
    <a class="btn" href={impulseHref(imp, collsOf($q))}>{t('Try it')}</a>
    <a class="linkq" href="#/flow/impulse?i={imp.id}">{t('More impulses')}</a>
  </div>
{/if}

<style>
  .ih {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    padding: 10px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
    color: var(--ink-2);
  }
  .it {
    flex: 1 1 200px;
    min-width: 0;
    color: var(--ink);
    font-size: var(--fs-body);
    overflow-wrap: break-word;
  }
  .linkq {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
