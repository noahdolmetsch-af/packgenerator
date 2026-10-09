<script>
  /**
   * v0.38.0 (Noah 1a-4a): one gear row in one line: star, name, (bag on wish), weight, •••.
   * - The bag shows only with "With bag" (showBag) above the list.
   * - Not weighed: only "–" (the category header counts them).
   * - Phone: swipe right for Favourite and Assign …, left for Delete (or Archive when the item was on
   *   a trip); a long swipe left does it at once, with Undo. ••• is always there with every action, so
   *   nothing needs a swipe (keyboard, screen reader).
   * - Computer: ••• is quiet; on hover and on keyboard focus the actions show written out.
   */
  import FavStar from './FavStar.svelte';
  import { db } from '../db.js';
  import { BAG, formatWeight, itemWeight } from '../gear.js';
  import { direction, release, drag, leftActions, ACTION_W } from './swipe.js';
  import { t, nameOf } from '../i18n.svelte.js';
  import { Star, Layers, Archive, Trash, Ellipsis } from '@lucide/svelte';

  let { item, showBag = false, used = false, touch = false, swiped = null, onswipe, onopen, onmenu, onassign, onarchive, ondelete } = $props();

  let offset = $state(0);
  let rest = $state(0);
  let dragging = $state(false);
  let el = $state();
  let start = null; // { x, y, dir }
  let moved = false;
  const left = $derived(leftActions(used));
  // Another row was swiped: this one closes.
  $effect(() => {
    if (swiped !== item.id && rest !== 0) offset = rest = 0;
  });

  function down(e) {
    if (!touch || e.pointerType !== 'touch') return;
    start = { x: e.clientX, y: e.clientY, dir: null };
    moved = false;
  }
  function move(e) {
    if (!start || e.pointerType !== 'touch') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (!start.dir) {
      start.dir = direction(dx, dy);
      if (start.dir === 'swipe') {
        dragging = true;
        moved = true;
        el?.setPointerCapture?.(e.pointerId);
      }
    }
    if (start.dir === 'scroll') return (start = null);
    if (start.dir === 'swipe') offset = drag(rest, dx, el?.offsetWidth ?? 360);
  }
  function up(e) {
    if (!start) return;
    const was = start.dir;
    start = null;
    dragging = false;
    if (was !== 'swipe') return;
    const r = release(offset, el?.offsetWidth ?? 360, { used });
    if (r.state === 'long') {
      offset = rest = 0;
      onswipe?.(null);
      return used ? onarchive(item) : ondelete(item);
    }
    offset = rest = r.offset;
    onswipe?.(r.state === 'closed' ? null : item.id);
    // the click that ends a swipe must not open the item
    e.preventDefault?.();
  }
  function cancel() {
    start = null;
    dragging = false;
    offset = rest;
  }
  const close = () => {
    offset = rest = 0;
    onswipe?.(null);
  };
  function guardClick(e) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
      return;
    }
    if (rest !== 0) {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }
  async function fav() {
    await db.items.update(item.id, { favorite: item.favorite ? null : true, updatedAt: new Date().toISOString() });
    close();
  }
  const run = (fn) => () => {
    close();
    fn(item);
  };
</script>

<li class="fr gr" class:open={rest !== 0} data-item={item.id}>
  {#if touch}
    <!-- the actions under the row, shown by the swipe (also reachable through •••) -->
    <div class="under ul" aria-hidden={rest <= 0} inert={rest <= 0}>
      <button type="button" class="sa fav" onclick={fav}><Star size={20} aria-hidden="true" />{item.favorite ? t('Unmark') : t('Favourite')}</button>
      <button type="button" class="sa asg" onclick={run(onassign)}><Layers size={20} aria-hidden="true" />{t('Assign …')}</button>
    </div>
    <div class="under ur" aria-hidden={rest >= 0} inert={rest >= 0} style:width="{left.length * ACTION_W}px">
      {#if used}
        <button type="button" class="sa arc" onclick={run(onarchive)}><Archive size={20} aria-hidden="true" />{t('Archive')}</button>
      {:else}
        <button type="button" class="sa del" onclick={run(ondelete)}><Trash size={20} aria-hidden="true" />{t('Delete')}</button>
      {/if}
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="face"
    class:dragging
    bind:this={el}
    style:transform={offset ? `translateX(${offset}px)` : undefined}
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={cancel}
    onclickcapture={guardClick}
  >
    <FavStar {item} describedby="gn-{item.id}" />
    <button type="button" class="main" class:bagcol={showBag} onclick={() => onopen(item)}>
      <span class="nm" id="gn-{item.id}">{nameOf(item)}{#if item.qty > 1}<small> × {item.qty}</small>{/if}</span>
      {#if showBag}<span class="bg">{BAG[item.defaultBag] ? t(BAG[item.defaultBag]) : '–'}</span>{/if}
      {#if item.weightG == null}<span class="w num nw"><span aria-hidden="true">–</span><span class="sr">{t('not weighed')}</span></span>{:else}<span class="w num">{formatWeight(itemWeight(item))}</span>{/if}
    </button>
    {#if !touch}
      <!-- computer: written out on hover and keyboard focus, quiet otherwise -->
      <span class="acts">
        <button type="button" class="ra" onclick={() => onassign(item)}>{t('Assign …')}</button>
        {#if used}<button type="button" class="ra" onclick={() => onarchive(item)}>{t('Archive')}</button>{:else}<button type="button" class="ra del" onclick={() => ondelete(item)}>{t('Delete')}</button>{/if}
      </span>
    {/if}
    <button type="button" class="dots" aria-haspopup="dialog" aria-label={t('Actions')} aria-describedby="gn-{item.id}" onclick={() => onmenu(item)}><Ellipsis size={20} aria-hidden="true" /></button>
  </div>
</li>

<style>
  .gr {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .face {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    background: var(--paper);
    /* up and down stays the page's scroll; sideways is the swipe */
    touch-action: pan-y;
    transition: transform 0.18s ease-out;
  }
  .face.dragging {
    transition: none;
  }
  .main {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 2px 12px;
    min-height: 44px;
    padding: 9px 4px 9px 2px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .main.bagcol {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .nm {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .bg {
    grid-column: 1;
    grid-row: 2;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .w {
    grid-column: 2;
    grid-row: 1 / span 2;
    font-weight: 500; /* v0.47.0: calm numbers (style sheet «Gletscher») */
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .nw {
    color: var(--ink-3);
    font-weight: 500;
  }
  @media (min-width: 720px) {
    .main.bagcol {
      grid-template-columns: minmax(0, 1fr) minmax(0, 170px) 80px;
    }
    .main.bagcol .bg {
      grid-column: 2;
      grid-row: 1;
      font-size: 15px;
    }
    .main.bagcol .w {
      grid-column: 3;
      grid-row: 1;
    }
  }
  @media (hover: hover) {
    .main:hover {
      background: var(--paper-2);
    }
  }
  .dots {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 44px;
    min-height: 44px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .dots:hover {
    color: var(--ink);
    background: var(--paper-2);
  }
  /* computer: the actions written out, quiet until the row is hovered or has the keyboard focus */
  .acts {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.12s;
  }
  .gr:hover .acts,
  .gr:focus-within .acts {
    opacity: 1;
  }
  .ra {
    min-height: 32px;
    padding: 2px 10px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: 500 14px var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .ra:hover {
    border-color: var(--ink);
  }
  .ra.del {
    color: var(--bad);
  }
  /* phone: the actions under the row */
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
    width: 88px;
    border: 0;
    color: var(--paper);
    font: 600 13px/1.2 var(--font-body);
    text-align: center;
    cursor: pointer;
  }
  .sa.fav {
    background: var(--hi);
    color: var(--hi-ink);
  }
  .sa.asg {
    background: var(--brand);
    color: var(--brand-ink);
  }
  .sa.arc {
    background: var(--ink-2);
    flex: 1;
  }
  .sa.del {
    background: var(--bad);
    flex: 1;
  }
</style>
