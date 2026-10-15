<script>
  /**
   * «Inspiration» UC2-2 (answer 5a): a packing rule from your own inspiration as a quiet hint while
   * packing: «Aus deiner Inspiration: … (bikepacking.com) · Warum?» and «✕» to hide it (the rule stays
   * under «What the app has learned»). The dialog «Aus der Notiz wird …» shows the same hint as a preview
   * (preview: nothing to tap).
   */
  import { t } from '../i18n.svelte.js';
  import { domainOf } from '../rig.js';
  import { Lightbulb, X } from '@lucide/svelte';

  let { rule, url = '', title = '', onhide = null, preview = false } = $props();
  let why = $state(false);
  const site = $derived(domainOf(url));
</script>

<div class="ih-box" class:ih-pre={preview} role={preview ? undefined : 'note'} data-inspo-hint={preview ? undefined : ''}>
  <span class="ih-ic" aria-hidden="true"><Lightbulb size={16} /></span>
  <div class="ih-tx">
    <p class="ih-l">
      {t('From your inspiration:')} {rule}{#if site}{' '}<span class="ih-src">({site})</span>{/if}
      {#if !preview}· <button type="button" class="ih-why" aria-expanded={why} onclick={() => (why = !why)}>{t('Why?')}</button>{:else}· <span class="ih-whyp">{t('Why?')}</span>{/if}
    </p>
    {#if why}<p class="ih-more">{t('Your note on «{title}», taken over on the Inspiration page.', { title })} <a href="#/inspiration">{t('Inspiration')}</a></p>{/if}
  </div>
  {#if onhide && !preview}<button type="button" class="ih-x" aria-label={t('Hide this hint')} onclick={onhide}><X size={16} aria-hidden="true" /></button>{/if}
</div>

<style>
  .ih-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--warn);
    border-radius: 12px;
    background: var(--warn-soft);
    color: var(--ink);
  }
  .ih-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    color: var(--warn);
  }
  .ih-tx {
    flex: 1;
    min-width: 0;
  }
  .ih-l,
  .ih-more {
    margin: 0;
    font-size: var(--fs-small);
    line-height: 1.45;
    overflow-wrap: break-word;
  }
  .ih-more {
    margin-top: 4px;
    color: var(--ink-2);
  }
  .ih-src {
    color: var(--ink-2);
  }
  .ih-why,
  .ih-whyp {
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--hi);
    font: 600 var(--fs-small) / 1.45 var(--font-body);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .ih-whyp {
    cursor: default;
  }
  .ih-why {
    position: relative;
  }
  .ih-why::after {
    content: '';
    position: absolute;
    left: -8px;
    right: -8px;
    top: 50%;
    height: 44px;
    min-width: 44px;
    transform: translateY(-50%);
  }
  .ih-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -10px -8px -10px 0;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
  }
  .ih-x:hover {
    background: var(--paper);
  }
</style>
