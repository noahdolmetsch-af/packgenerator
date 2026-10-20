<script>
  /**
   * «Datenseiten wie am Garmin» (Noah 20.10.2026): the pager of the live map. Page 1 is the map (the
   * `map` snippet), then the rider's data pages. Swipe left and right on a data page (finger, pen or
   * mouse); the map keeps its own drag (it pans the map), so from the map you swipe on the strip at its
   * right edge, or use the dots and the arrows below. The arrow keys ← → change the page too.
   *
   * set: the cleaned stored value (datapages.js cleanPages); fields: the catalogue; values, series,
   * profileAhead, route: as for DataPage; smallMap: snippet(page) for the small map of a page;
   * index (bindable): the page shown, 0 = the map; onedit(pageId): open the editor.
   * Only the page shown and its neighbours are drawn (the numbers change every second).
   */
  import { ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { pageName, hrZones, powerZones } from './datapages.js';
  import DataPage from './DataPage.svelte';

  let { set, fields = [], values = {}, series = {}, profileAhead = [], route = false, map = null, smallMap = null, index = $bindable(0), onedit = null } = $props();

  const pages = $derived(set?.pages ?? []);
  const count = $derived(1 + pages.length);
  const hrZ = $derived(hrZones(set?.maxHr));
  const pwZ = $derived(powerZones(set?.ftp));
  const nameOf = (i) => (i === 0 ? t('Map') : pageName(pages[i - 1], t, i - 1));

  // a deleted page: stay within the pages
  $effect(() => {
    if (index > count - 1) index = count - 1;
    if (index < 0) index = 0;
  });

  const go = (i) => (index = Math.max(0, Math.min(count - 1, i)));

  // the swipe: decided after 10 px, sideways only when more sideways than up and down
  let width = $state(0);
  let drag = $state(0);
  let st = null;
  const skip = (e) => e.button > 0 || e.target.closest?.('button, a, input, select, textarea, label, [data-dp-noswipe]');
  function down(e) {
    if (skip(e)) return;
    st = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false };
    // the moves come here even when the finger leaves the narrow strip at the map's edge
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!st || e.pointerId !== st.id) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (!st.on) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) {
        if (Math.abs(dy) > 10) st = null;
        return;
      }
      st.on = true;
    }
    // at the ends it gives a little only
    const end = (dx > 0 && index === 0) || (dx < 0 && index === count - 1);
    drag = end ? dx / 4 : dx;
  }
  function up(e) {
    if (!st || e.pointerId !== st.id) return;
    const was = st.on;
    st = null;
    const dx = drag;
    drag = 0;
    if (!was) return;
    const min = Math.min(80, Math.max(40, width * 0.18));
    if (dx < -min) go(index + 1);
    else if (dx > min) go(index - 1);
  }
  function cancel() {
    st = null;
    drag = 0;
  }
  function key(e) {
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.key === 'ArrowRight') (e.preventDefault(), go(index + 1));
    else if (e.key === 'ArrowLeft') (e.preventDefault(), go(index - 1));
  }
  const swipe = { onpointerdown: down, onpointermove: move, onpointerup: up, onpointercancel: cancel };
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="dps" role="region" aria-roledescription={t('pages|dp')} aria-label={t('Map and data pages')} onkeydown={key} data-dp-pager data-dp-index={index}>
  <div class="dps-view" bind:clientWidth={width}>
    <div class="dps-track" class:dps-dragging={drag !== 0} style:transform="translateX(calc({-index * 100}% + {drag}px))">
      <div class="dps-page dps-mappage" role="group" aria-roledescription={t('page|dp')} aria-label={nameOf(0)} inert={index !== 0} data-dp-mappage>
        {@render map?.()}
        {#if count > 1}
          <!-- the map pans with a drag: swipe here to go to the data pages -->
          <div class="dps-edge" {...swipe} aria-hidden="true" data-dp-edge></div>
        {/if}
      </div>
      {#each pages as p, i (p.id)}
        <div class="dps-page" role="group" aria-roledescription={t('page|dp')} aria-label={nameOf(i + 1)} inert={index !== i + 1} {...swipe}>
          {#if Math.abs(index - (i + 1)) <= 1}
            <DataPage page={p} {i} {fields} {values} {series} {profileAhead} {route} {hrZ} {pwZ} active={index === i + 1} {smallMap} {onedit} />
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if count > 1}
    <nav class="dps-bar" aria-label={t('Map and data pages')}>
      <button type="button" class="dps-ar" onclick={() => go(index - 1)} disabled={index === 0} aria-label={t('Previous page')} data-dp-prev><ChevronLeft size={22} aria-hidden="true" /></button>
      <span class="dps-dots">
        {#each Array.from({ length: count }, (_, i) => i) as i (i)}
          <button type="button" class="dps-dot" aria-current={index === i ? 'page' : undefined} aria-label={t('Page {n}: {name}', { n: i + 1, name: nameOf(i) })} onclick={() => go(i)} data-dp-dot={i}><span></span></button>
        {/each}
      </span>
      <button type="button" class="dps-ar" onclick={() => go(index + 1)} disabled={index >= count - 1} aria-label={t('Next page')} data-dp-next><ChevronRight size={22} aria-hidden="true" /></button>
    </nav>
  {/if}
</div>

<style>
  .dps {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .dps-view {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .dps-track {
    display: flex;
    height: 100%;
    transition: transform 220ms ease;
  }
  .dps-dragging {
    transition: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .dps-track {
      transition: none;
    }
  }
  .dps-page {
    position: relative;
    flex: 0 0 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
    touch-action: pan-y;
    user-select: none;
  }
  .dps-mappage {
    touch-action: auto;
    user-select: auto;
  }
  .dps-edge {
    position: absolute;
    top: 64px;
    right: 0;
    bottom: 64px;
    z-index: 2;
    width: 22px;
    touch-action: none;
    cursor: ew-resize;
    border-left: 1px solid var(--line);
    background: var(--paper);
    opacity: 0.55;
  }
  .dps-bar {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--paper);
    border-top: 1px solid var(--line);
  }
  .dps-ar {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .dps-ar:disabled {
    opacity: 0.25;
    cursor: default;
  }
  .dps-dots {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .dps-dot {
    display: grid;
    place-items: center;
    width: 28px;
    height: 44px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .dps-dot span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid var(--ink-2);
    background: transparent;
  }
  .dps-dot[aria-current='page'] span {
    border-color: var(--ink);
    background: var(--ink);
  }
</style>
