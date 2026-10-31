<script module>
  // Only one row is open at a time, in every list.
  export const swipeOpen = $state({ id: null });
</script>

<script>
  /**
   * B13 «Wischen in Listen» (Noah 27.10.2026 «4a»): the same swipe in every list, on the phone.
   * - right: the «done» side (done, packed, pin) shows on the left;
   * - left: the «away» side (move, delete) shows on the right;
   * - a long swipe does the first action of that side at once; the action offers Undo itself.
   * Every action is also in the item itself, so nothing needs a swipe (keyboard, screen reader,
   * computer): the actions under the row are hidden from them.
   * actions: { key, label, icon, run, tone: 'ok' | 'bad' | 'move' }.
   */
  import { uiZoom } from '../uizoom.js';
  import { phone } from '../media.svelte.js';
  import { direction, settle, follow, ACTION_W } from './swiperow.js';

  let { id, right = [], left = [], touch = phone.matches, children } = $props();

  let offset = $state(0);
  let rest = $state(0);
  let dragging = $state(false);
  let el = $state();
  let start = null;
  let moved = false;
  const sides = $derived({ right: right.length, left: left.length });

  $effect(() => {
    if (swipeOpen.id !== id && rest !== 0) offset = rest = 0;
  });

  function down(e) {
    if (!touch || e.pointerType !== 'touch') return;
    start = { x: e.clientX, y: e.clientY, dir: null };
    moved = false;
  }
  function move(e) {
    if (!start || e.pointerType !== 'touch') return;
    const dx = (e.clientX - start.x) / uiZoom();
    const dy = (e.clientY - start.y) / uiZoom();
    if (!start.dir) {
      start.dir = direction(dx, dy);
      if (start.dir === 'swipe') {
        dragging = true;
        moved = true;
        try {
          el?.setPointerCapture?.(e.pointerId);
        } catch {
          // a pointer the browser no longer knows: the swipe works without the capture
        }
      }
    }
    if (start.dir === 'scroll') return (start = null);
    if (start.dir === 'swipe') offset = follow(rest, dx, el?.offsetWidth ?? 360, sides);
  }
  function up(e) {
    if (!start) return;
    const was = start.dir;
    start = null;
    dragging = false;
    if (was !== 'swipe') return;
    const r = settle(offset, el?.offsetWidth ?? 360, sides);
    offset = rest = r.offset;
    swipeOpen.id = r.state === 'right' || r.state === 'left' ? id : null;
    if (r.state === 'long-right') right[0]?.run();
    if (r.state === 'long-left') left[0]?.run();
    if (r.state.startsWith('long')) navigator.vibrate?.(10);
    e.preventDefault?.();
  }
  function cancel() {
    start = null;
    dragging = false;
    offset = rest;
  }
  function close() {
    offset = rest = 0;
    if (swipeOpen.id === id) swipeOpen.id = null;
  }
  // the click that ends a swipe, or a tap on an open row, must not open the item
  function guardClick(e) {
    if (moved || rest !== 0) {
      e.preventDefault();
      e.stopPropagation();
      if (!moved) close();
      moved = false;
    }
  }
  const run = (a) => () => {
    close();
    a.run();
  };
</script>

<div class="swr" class:open={rest !== 0} data-swipe-row>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="face" class:dragging bind:this={el} style:transform={offset ? `translateX(${offset}px)` : undefined} onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={cancel} onclickcapture={guardClick}>
    {@render children?.()}
  </div>
  <!-- after the row in the page order, so the row's own buttons come first -->
  {#if touch}
    {#if right.length}
      <div class="under ul" aria-hidden="true" inert={rest <= 0}>
        {#each right as a (a.key)}{@const I = a.icon}<button type="button" class="sa {a.tone ?? 'ok'}" style:width="{ACTION_W}px" onclick={run(a)} data-swipe-act={a.key}>{#if I}<I size={20} aria-hidden="true" />{/if}{a.label}</button>{/each}
      </div>
    {/if}
    {#if left.length}
      <div class="under ur" aria-hidden="true" inert={rest >= 0}>
        {#each left as a (a.key)}{@const I = a.icon}<button type="button" class="sa {a.tone ?? 'bad'}" style:width="{ACTION_W}px" onclick={run(a)} data-swipe-act={a.key}>{#if I}<I size={20} aria-hidden="true" />{/if}{a.label}</button>{/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .swr {
    position: relative;
    overflow: hidden;
  }
  .face {
    position: relative;
    z-index: 1;
    background: var(--paper);
    /* up and down stays the page's scroll; sideways is the swipe */
    touch-action: pan-y;
  }
  @media (prefers-reduced-motion: no-preference) {
    .face {
      transition: transform 0.18s ease-out;
    }
  }
  .face.dragging {
    transition: none;
  }
  .under {
    position: absolute;
    top: 0;
    bottom: 0;
    display: flex;
  }
  .ul {
    left: 0;
  }
  .ur {
    right: 0;
  }
  .sa {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: 0;
    color: var(--paper);
    font: 600 var(--fs-tiny)/1.2 var(--font-body);
    text-align: center;
    cursor: pointer;
  }
  .sa.ok {
    background: var(--accent);
  }
  .sa.move {
    background: var(--ink-2);
  }
  .sa.bad {
    background: var(--bad);
  }
</style>
