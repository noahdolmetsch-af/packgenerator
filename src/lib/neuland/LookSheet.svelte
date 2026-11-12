<script>
  /**
   * «Neuland» › «Look»: choose the picture and the tint of a collection. Every tap saves at once (a suggestion,
   * changeable any time); «Back to the default» removes the choice.
   * name: the collection's name; look: { icon, tint } now; own: has a look of its own choosing; onpick({ icon? , tint? }); onreset.
   */
  import { X, RotateCcw } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import LookBadge from './LookBadge.svelte';
  import { ICONS, TINTS } from './look.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { name = '', look, own = false, onpick, onreset, onclose } = $props();

  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  // literal English keys (the German list check reads them)
  const iconName = (k) => ({ mountain: t('Mountain'), binoculars: t('Binoculars|look'), waves: t('Waves'), droplets: t('Drops'), landmark: t('Landmark'), footprints: t('Footprints'), bike: t('Bike'), tree: t('Tree'), tent: t('Tent'), coffee: t('Coffee'), camera: t('Camera'), flower: t('Flower'), castle: t('Castle'), route: t('Route'), sun: t('Sun'), pin: t('Pin|look') })[k] ?? k;
  const tintName = (k) => ({ ok: t('Green'), hi: t('Orange'), warn: t('Amber'), brand: t('Dark green'), ink: t('Grey') })[k] ?? k;
</script>

<dialog class="sheet vdlg nl-look" bind:this={dialog} use:backClose {onclose} aria-labelledby="nll-h" data-nl-look-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="nll-h">{t('Look of the collection')}</h2>
      <p class="vd-sub">{name}</p>
      <p class="vd-sub">{t('A picture and a tint, so you see at a glance which collection you are in. You can change it any time.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  <div class="now"><LookBadge {look} size={22} /><b>{name}</b></div>

  <h3 class="h3">{t('Picture')}</h3>
  <div class="grid" role="group" aria-label={t('Picture')}>
    {#each ICONS as k (k)}
      <button type="button" class="pick" aria-pressed={look.icon === k} aria-label={iconName(k)} data-look-icon={k} onclick={() => onpick?.({ icon: k })}><LookBadge look={{ icon: k, tint: look.tint }} /></button>
    {/each}
  </div>

  <h3 class="h3">{t('Tint')}</h3>
  <div class="grid" role="group" aria-label={t('Tint')}>
    {#each TINTS as k (k)}
      <button type="button" class="pick" aria-pressed={look.tint === k} aria-label={tintName(k)} data-look-tint={k} onclick={() => onpick?.({ tint: k })}><LookBadge look={{ icon: look.icon, tint: k }} /></button>
    {/each}
  </div>

  {#if own}
    <button type="button" class="reset" data-look-reset onclick={() => onreset?.()}><RotateCcw size={16} aria-hidden="true" />{t('Back to the default')}</button>
  {/if}
  <div class="vd-foot"><button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button></div>
</dialog>

<style>
  .nl-look {
    width: min(480px, calc(100vw - 24px));
  }
  .now {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0 8px;
  }
  .h3 {
    margin: 14px 0 6px;
    font-size: var(--fs-small);
    color: var(--ink-3);
    font-weight: 600;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pick {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 50%;
    background: none;
    cursor: pointer;
  }
  .pick[aria-pressed='true'] {
    border-color: var(--ink);
  }
  .pick:focus-visible {
    outline: var(--focus-ring);
    outline-offset: 2px;
  }
  .reset {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin: 14px 0 0;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
