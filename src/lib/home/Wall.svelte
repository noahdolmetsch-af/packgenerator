<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockups A, B, Noah 1a 2a): the tiles of Today on a grid, 8 columns on a
   * computer and 4 on a phone; a tile takes 1 (small), 2 (wide), a large block or a whole row.
   * The last field is always «+» (Add a tile).
   *
   * Customising (Noah 2a): «Customise the start page» (or a long press on a tile on a phone) turns the
   * wall into edit mode. Then every tile has a handle to drag it, × to take it away, and a tap on it
   * shows ‹ › (one place earlier or later, also by keyboard) and its sizes. The tile's own buttons
   * rest meanwhile (inert). Every change goes to onchange(tiles) at once.
   *
   * tiles: [{ id, size }]; body: snippet (tile) → the tile's content; editing; onedit(); onchange; onadd.
   */
  import { GripVertical, X, ChevronLeft, ChevronRight, Plus } from '@lucide/svelte';
  import { TILE, SIZE_NAME, stepTile, moveTile, removeTile, resizeTile } from './tiles.js';
  import { t } from '../i18n.svelte.js';

  let { tiles = [], body, editing = false, onedit, onchange, onadd } = $props();

  let picked = $state(null); // the tile whose ‹ › and sizes show
  $effect(() => {
    if (!editing) picked = null;
  });
  const name = (id) => t(TILE[id]?.label ?? id);

  /* drag by the handle (mouse, finger or pen): the tile follows the pointer over the others */
  let drag = $state(null); // { id, list }
  let wallEl = $state();
  function dragStart(e, id) {
    if (e.button) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag = { id, list: tiles };
    picked = null;
  }
  function dragMove(e) {
    if (!drag) return;
    const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.dataset?.tile && x.dataset.tile !== drag.id && wallEl?.contains(x));
    if (!el) return;
    const to = drag.list.findIndex((x) => x.id === el.dataset.tile);
    if (to >= 0) drag = { ...drag, list: moveTile(drag.list, drag.id, to) };
  }
  function dragEnd() {
    if (!drag) return;
    const list = drag.list;
    drag = null;
    if (list.map((x) => x.id).join() !== tiles.map((x) => x.id).join()) onchange?.(list);
  }
  const shown = $derived(drag ? drag.list : tiles);
  const pickedTile = $derived(picked ? (tiles.find((x) => x.id === picked) ?? null) : null);

  /* a long press on a tile (finger or pen) opens edit mode; the tap that follows is swallowed */
  let holdTimer = null;
  let hold = null;
  let swallow = 0;
  function holdDown(e) {
    if (editing || e.button || (e.pointerType !== 'touch' && e.pointerType !== 'pen')) return;
    hold = { x: e.clientX, y: e.clientY };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      hold = null;
      swallow = Date.now();
      try {
        navigator.vibrate?.(12);
      } catch {
        /* no vibration */
      }
      onedit?.();
    }, 600);
  }
  function holdMove(e) {
    if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 10) (clearTimeout(holdTimer), (hold = null));
  }
  const holdStop = () => (clearTimeout(holdTimer), (hold = null));
  function holdClick(e) {
    if (Date.now() - swallow < 900) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  $effect(() => () => clearTimeout(holdTimer));
</script>

<div class="wall" class:editing bind:this={wallEl} role="list" aria-label={t('Your start page')} onpointermove={dragMove} onpointerup={dragEnd} onpointercancel={dragEnd}>
  {#each shown as x, i (x.id)}
    <div class="ti {x.size}" class:moving={drag?.id === x.id} class:picked={picked === x.id} data-tile={x.id} data-size={x.size} role="listitem" onpointerdowncapture={holdDown} onpointermovecapture={holdMove} onpointerupcapture={holdStop} onpointercancelcapture={holdStop} onclickcapture={holdClick}>
      <div class="body" inert={editing}>{@render body(x)}</div>
      {#if editing}
        <button type="button" class="pick" aria-pressed={picked === x.id} aria-label={t('{name}: move or change the size', { name: name(x.id) })} onclick={() => (picked = picked === x.id ? null : x.id)}></button>
        <button type="button" class="grip" aria-label={t('Drag {name}', { name: name(x.id) })} onpointerdown={(e) => dragStart(e, x.id)}><GripVertical size={16} aria-hidden="true" /></button>
        <button type="button" class="rm" aria-label={t('Take {name} off the start page', { name: name(x.id) })} onclick={() => onchange?.(removeTile(tiles, x.id))}><X size={16} aria-hidden="true" /></button>
      {/if}
    </div>
  {/each}
  <div class="ti s plusw" role="listitem">
    <button type="button" class="plus" onclick={onadd} aria-haspopup="dialog"><Plus size={20} aria-hidden="true" /><span>{t('Add a tile')}</span></button>
  </div>
</div>
{#if editing && pickedTile}
  {@const i = tiles.findIndex((x) => x.id === pickedTile.id)}
  <div class="tools" role="group" aria-label={name(pickedTile.id)} data-tools={pickedTile.id}>
    <b class="tn">{name(pickedTile.id)}</b>
    <button type="button" class="tb" disabled={i === 0} aria-label={t('One place earlier')} onclick={() => onchange?.(stepTile(tiles, pickedTile.id, -1))}><ChevronLeft size={18} aria-hidden="true" /></button>
    {#each TILE[pickedTile.id].sizes as s (s)}
      <button type="button" class="tb sz" aria-pressed={pickedTile.size === s} onclick={() => onchange?.(resizeTile(tiles, pickedTile.id, s))}>{t(SIZE_NAME[s])}</button>
    {/each}
    <button type="button" class="tb" disabled={i === tiles.length - 1} aria-label={t('One place later')} onclick={() => onchange?.(stepTile(tiles, pickedTile.id, 1))}><ChevronRight size={18} aria-hidden="true" /></button>
  </div>
{/if}

<style>
  .wall {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: minmax(84px, auto);
    grid-auto-flow: row dense;
    gap: 8px;
  }
  /* a very narrow phone (320 px): 3 columns, so a word like «Kleiderschrank» fits on a small tile */
  @media (max-width: 359px) {
    .wall {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 720px) {
    .wall {
      grid-template-columns: repeat(8, minmax(0, 1fr));
      grid-auto-rows: minmax(104px, auto);
      gap: 12px;
    }
  }
  .ti {
    position: relative;
    min-width: 0;
    grid-column: span 1;
  }
  .ti.w {
    grid-column: span 2;
  }
  .ti.l,
  .ti.long {
    grid-column: 1 / -1;
  }
  @media (min-width: 720px) {
    .ti.l {
      grid-column: span 4;
      grid-row: span 2;
    }
  }
  .body {
    height: 100%;
    min-width: 0;
  }
  /* the content of a large tile fills it (cards keep their own frame) */
  .body > :global(*) {
    height: 100%;
    box-sizing: border-box;
  }
  .body > :global(* + *) {
    height: auto;
  }
  .editing .ti {
    border-radius: 16px;
    outline: 2px dashed var(--line-strong);
    outline-offset: 2px;
    animation: wob 0.35s ease-in-out 1;
  }
  .editing .ti.plusw {
    outline: 0;
    animation: none;
  }
  @keyframes wob {
    50% {
      transform: scale(0.985);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .editing .ti {
      animation: none;
    }
  }
  .editing .body {
    opacity: 0.88;
  }
  .ti.moving {
    opacity: 0.55;
    outline-color: var(--accent);
  }
  .ti.picked {
    outline: 2px solid var(--accent);
    z-index: 3;
  }
  .pick {
    position: absolute;
    inset: 0;
    width: 100%;
    border: 0;
    border-radius: 14px;
    background: transparent;
    cursor: pointer;
  }
  .grip,
  .rm {
    position: absolute;
    top: -10px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--ink);
    color: var(--paper);
    cursor: pointer;
    z-index: 2;
  }
  /* handle and × side by side at the top right, so they never meet the next tile's */
  .grip {
    right: 26px;
    cursor: grab;
    touch-action: none;
  }
  .rm {
    right: -8px;
  }
  /* the tools of the tile tapped: one bar at the bottom of the screen, never off the side */
  .tools {
    position: fixed;
    left: 50%;
    bottom: calc(84px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 2px;
    max-width: calc(100vw - 32px);
    padding: 6px;
    border-radius: 14px;
    background: var(--ink);
    color: var(--paper);
    box-shadow: 0 6px 24px var(--shadow);
    z-index: 40;
  }
  @media (min-width: 720px) {
    .tools {
      bottom: 24px;
    }
  }
  .tn {
    padding: 0 8px;
    font: 600 var(--fs-small) var(--font-body);
  }
  .tb {
    min-width: 40px;
    min-height: 40px;
    padding: 0 10px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--paper);
    font: 600 var(--fs-small) var(--font-body);
    cursor: pointer;
  }
  .tb[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
  }
  .tb:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .plus {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    min-height: 84px;
    padding: 6px;
    border: 2px dashed var(--line-strong);
    border-radius: 14px;
    background: transparent;
    color: var(--ink-2);
    font: 600 var(--fs-small)/1.2 var(--font-body);
    text-align: center;
    cursor: pointer;
  }
  .plus:hover {
    color: var(--ink);
    border-color: var(--ink-3);
  }
</style>
