<script>
  /**
   * The frame of a zoomable map (Noah 27.11.2026): the buttons + − «Whole map» and «Full screen», the hint for the wheel, and the
   * full screen itself (header with a cross, Escape closes). The map is the child (an svg that uses `zoom` from createZoom).
   */
  import { Plus, Minus, Maximize2, LocateFixed, X } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import MapTip from './MapTip.svelte';

  let { zoom, title = '', children } = $props();
  let full = $state(false);
  let frameW = $state(0);
  $effect(() => {
    if (!full) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = old);
  });
</script>

<svelte:window onkeydown={(e) => full && e.key === 'Escape' && ((full = false), e.stopPropagation())} />
<div class="zb" bind:clientWidth={frameW} class:full role={full ? 'dialog' : undefined} aria-modal={full ? 'true' : undefined} aria-label={full ? title || t('Map') : undefined}>
  {#if full}<div class="zb-top"><b>{title || t('Map')}</b><button type="button" class="zb-x" onclick={() => (full = false)} data-zoom-close aria-label={t('Close')}><X size={20} aria-hidden="true" /></button></div>{/if}
  {@render children()}
  <div class="zb-btns" role="group" aria-label={t('Zoom')}>
    <button type="button" aria-label={t('Zoom in')} onclick={() => zoom.zoomBy(1.7)} disabled={zoom.z >= zoom.max - 0.01} data-zoom-in><Plus size={20} aria-hidden="true" /></button>
    <button type="button" aria-label={t('Zoom out')} onclick={() => zoom.zoomBy(1 / 1.7)} disabled={!zoom.zoomed} data-zoom-out><Minus size={20} aria-hidden="true" /></button>
    <button type="button" aria-label={t('Whole map')} onclick={() => zoom.reset()} disabled={!zoom.zoomed} data-zoom-reset><LocateFixed size={20} aria-hidden="true" /></button>
    {#if !full}<button type="button" aria-label={t('Full screen')} onclick={() => (full = true)} data-zoom-full><Maximize2 size={16} aria-hidden="true" /></button>{/if}
  </div>
  <MapTip tip={zoom.tip} width={frameW} />
  {#if zoom.hint}<p class="zb-hint" role="status">{t('Ctrl and scroll, or pinch, to zoom')}</p>{/if}
</div>

<style>
  .zb {
    position: relative;
  }
  .zb.full {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: calc(8px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-left));
    background: var(--paper);
    overscroll-behavior: contain;
  }
  .zb-top {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 44px;
  }
  .zb-x {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .zb.full :global(svg) {
    flex: 1;
    min-height: 0;
    max-height: none !important;
    height: 100%;
  }
  .zb-btns {
    position: absolute;
    right: 8px;
    top: 8px;
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-radius: var(--r-ctl);
    overflow: hidden;
    box-shadow: var(--shadow-1);
    background: var(--line);
  }
  .full .zb-btns {
    right: calc(20px + env(safe-area-inset-right));
    top: calc(64px + env(safe-area-inset-top));
  }
  .zb-btns button {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .zb-btns button:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  .zb-btns button:not(:disabled):hover {
    background: var(--paper-2);
  }
  .zb-hint {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    margin: 0;
    padding: 8px 14px;
    border-radius: var(--r-ctl);
    background: var(--ink);
    color: var(--paper);
    font-size: var(--fs-small);
    pointer-events: none;
    text-align: center;
  }
</style>
