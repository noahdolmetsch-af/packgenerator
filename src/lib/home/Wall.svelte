<script>
  /**
   * v0.94.0 «Kachel-Wand» (mockups A, B, Noah 1a 2a): the tiles of Today on a grid, 8 columns on a
   * computer and 4 on a phone; a tile takes 1 (small), 2 (wide), a large block or a whole row.
   * The last field is always «+» (Add a tile).
   *
   * Customising (Noah 2a): «Customise the start page» (or a long press on a tile) turns the
   * wall into edit mode. Then every tile has a handle to drag it, × to take it away, and a tap on it
   * shows ‹ › (one place earlier or later, also by keyboard) and its sizes. The tile's own buttons
   * rest meanwhile (inert). Every change goes to onchange(tiles) at once.
   *
   * tiles: [{ id, size }]; body: snippet (tile) → the tile's content; editing; onedit(); onchange; onadd.
   * A tile may hold another one (Im Flow + Balance, 0.155.0): its inner `data-tile` is the one a long press picks.
   *
   * «Heute ruhiger» (Noah 26.10.2026 «1a 2a 3a 4a 5a», mockup H3): outside edit mode the tiles stand in areas with a
   * heading (sections.js; sections = false: without headings), every small tile in one calm list «Schnell öffnen»,
   * and a card is only as tall as its content (no tile stretched by its neighbour any more).
   */
  import { GripVertical, X, ChevronLeft, ChevronRight, Plus } from '@lucide/svelte';
  import { TILE, SIZE_NAME, stepTile, moveTile, removeTile, resizeTile } from './tiles.js';
  import { sectionsOf, fillers } from './sections.js';
  import { runsOf } from './quick.js';
  import { t } from '../i18n.svelte.js';

  let { tiles = [], body, editing = false, sections = true, onedit, onchange, onadd } = $props();

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
  // «Neuer Schwung» Teil 2: the tiles appear in the order they stand on the page (in areas: area by area)
  const seen = $derived(sections ? sectionsOf(shown).flatMap((g) => g.tiles) : shown);
  const pickedTile = $derived(picked ? (tiles.find((x) => x.id === picked) ?? null) : null);

  /* a long press on a tile opens edit mode; the tap that follows is swallowed.
     v0.127.0 «Tages-Check» 2 (mockup T3 «Eine Kachel lange drücken, um ihre Grösse zu ändern»): after
     500 ms, with a finger, a pen or the mouse, and the tile pressed shows its sizes at once. Moving
     more than 10 px (scrolling) or letting go earlier is an ordinary tap. */
  let holdTimer = null;
  let hold = null;
  let swallow = 0;
  function holdDown(e, id) {
    if (editing || e.button) return;
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
      picked = id;
    }, 500);
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

{#snippet tileEl(x, cls = '', fill = undefined, i = 0)}
  <div class="ti {x.size} {cls}" style:--fill={fill} style:--i={i} class:moving={drag?.id === x.id} class:picked={picked === x.id} data-tile={x.id} data-size={x.size} role="listitem" onpointerdowncapture={(e) => holdDown(e, e.target.closest?.('[data-tile]')?.dataset.tile ?? x.id)} onpointermovecapture={holdMove} onpointerupcapture={holdStop} onpointercancelcapture={holdStop} onclickcapture={holdClick}>
    <!-- «Heute lädt nicht» (19.10.2026): an error in one tile stays in that tile; the rest of Heute works -->
    <div class="body" inert={editing}><svelte:boundary onerror={(e) => console.error(`Tile ${x.id}:`, e)}>{@render body(x)}{#snippet failed(_, reset)}<p class="tile-err" data-tile-error={x.id}>{t('This tile could not load.')} <button type="button" class="link" onclick={reset}>{t('Try again')}</button></p>{/snippet}</svelte:boundary></div>
    {#if editing}
      <button type="button" class="pick" aria-pressed={picked === x.id} aria-label={t('{name}: move or change the size', { name: name(x.id) })} onclick={() => (picked = picked === x.id ? null : x.id)}></button>
      <button type="button" class="grip" aria-label={t('Drag {name}', { name: name(x.id) })} onpointerdown={(e) => dragStart(e, x.id)}><GripVertical size={16} aria-hidden="true" /></button>
      <button type="button" class="rm" aria-label={t('Take {name} off the start page', { name: name(x.id) })} onclick={() => onchange?.(removeTile(tiles, x.id))}><X size={16} aria-hidden="true" /></button>
    {/if}
  </div>
{/snippet}
{#snippet quickS(list, head = true)}
  <!-- «Heute ruhiger» 1a: every small tile in one calm list; a long press on a row customises it, as on a tile -->
  <div class="ti long quick" style:--i={seen.indexOf(list[0])} data-quick role="listitem">
    <div class="qcard">
      {#if head && !sections}<h2 class="qh">{t('Open quickly')}</h2>{/if}
      <div class="qgrid" role="list" aria-label={t('Open quickly')}>
        {#each list as x (x.id)}{@render tileEl(x, 'qi')}{/each}
      </div>
    </div>
  </div>
{/snippet}

{#if editing}
  <div class="wall editing" bind:this={wallEl} role="list" aria-label={t('Your start page')} onpointermove={dragMove} onpointerup={dragEnd} onpointercancel={dragEnd}>
    {#each shown as x, i (x.id)}{@render tileEl(x, '', undefined, i)}{/each}
    <div class="ti s plusw" role="listitem">
      <button type="button" class="plus" onclick={onadd} aria-haspopup="dialog"><Plus size={20} aria-hidden="true" /><span>{t('Add a tile')}</span></button>
    </div>
  </div>
  <!-- «Heute ruhiger» 3a: while customising the wall shows in its own order; Heute groups it into areas -->
  {#if sections}<p class="ehint" data-sections-hint>{t('Today shows the tiles in areas with a heading. Here you set their order inside an area.')}</p>{/if}
{:else}
  <div class="wall" class:secs={sections} bind:this={wallEl} role="list" aria-label={t('Your start page')}>
    {#if sections}
      {#each sectionsOf(shown) as g (g.key)}
        <div class="ti long sech" data-home-sec={g.key} role="listitem"><h2>{t(g.name)}</h2>{#if g.sub}<p>{t(g.sub)}</p>{/if}</div>
        {#if g.key === 'quick'}{@render quickS(g.tiles)}
        {:else if g.key === 'discover'}
          <!-- 4a: «Neu», «Schon probiert?» and the tip side by side -->
          <div class="ti long disc" role="listitem"><div class="dgrid" role="list">{#each g.tiles as x (x.id)}{@render tileEl(x, 'di', undefined, seen.indexOf(x))}{/each}</div></div>
        {:else}{@const fill = fillers(g.tiles)}{#each g.tiles as x (x.id)}{@render tileEl(x, fill.has(x.id) ? 'fill' : '', fill.get(x.id), seen.indexOf(x))}{/each}{/if}
      {/each}
    {:else}
      {#each runsOf(shown) as r, i (r.key === 'quick' ? 'quick' : `${i}`)}
        {#if r.key === 'quick'}{@render quickS(r.tiles)}{:else}{#each r.tiles as x (x.id)}{@render tileEl(x, '', undefined, seen.indexOf(x))}{/each}{/if}
      {/each}
    {/if}
    <div class="ti long plusw quiet" role="listitem">
      <button type="button" class="plus" onclick={onadd} aria-haspopup="dialog"><Plus size={18} aria-hidden="true" /><span>{t('Add a tile')}</span></button>
    </div>
  </div>
{/if}
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
  .tile-err {
    margin: 0;
    padding: var(--sp-3);
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
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
    }
  }
  /* «Heute ruhiger» H1: a card as tall as its content; before, a small tile beside a long card grew to its height */
  .wall:not(.editing) {
    align-items: start;
    grid-auto-rows: auto;
  }
  .wall:not(.editing) .body > :global(*) {
    height: auto;
  }
  /* 3a: inside an area the cards keep their order (no filling up from the next area); a card that would leave its
     row half empty stretches to the end of it (span set per card: «auto / -1» would put it in the last column only) */
  .wall.secs {
    grid-auto-flow: row;
  }
  @media (min-width: 720px) {
    .wall.secs > .ti.fill {
      grid-column: span var(--fill, 1);
    }
  }
  /* 3a: the heading of an area */
  .sech {
    margin: 20px 2px 0;
  }
  .sech:first-child {
    margin-top: 4px;
  }
  .sech h2 {
    margin: 0;
    font: 700 var(--fs-sub) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .sech p {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* 1a: the small tiles as one calm list, two columns on a phone, four on a computer */
  .qcard {
    padding: 8px 14px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .qh {
    margin: 6px 2px 4px;
    font: 600 var(--fs-body) / 1.25 var(--font-body);
    color: var(--ink);
  }
  .qgrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 12px;
  }
  @media (min-width: 720px) {
    .qgrid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0 20px;
    }
  }
  .qi {
    position: relative;
    min-width: 0;
  }
  .qi :global(.st) {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    min-height: 48px;
    height: auto;
    padding: 4px 2px;
    border: 0;
    border-radius: 10px;
    background: none;
    box-shadow: none;
    font-size: var(--fs-small);
  }
  .qi :global(.st:hover) {
    background: var(--paper-2);
    transform: none;
  }
  .qi :global(.st .ic) {
    flex: none;
  }
  .qi :global(.st .lb) {
    display: block;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
    font-weight: 600;
  }
  .qi :global(.st .lb > span) {
    display: inline;
  }
  .qi :global(.st .su),
  .qi :global(.st .op) {
    display: none;
  }
  .qi :global(.st .bd),
  .qi :global(.st .nw) {
    position: static;
    flex: none;
  }
  /* 4a: «Neu», «Schon probiert?» and the tip side by side, as tall as the tallest */
  .dgrid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  @media (min-width: 720px) {
    .dgrid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
  }
  .di {
    min-width: 0;
  }
  .dgrid > .ti,
  .qgrid > .ti {
    grid-column: auto;
  }
  .wall .dgrid .di .body > :global(*) {
    height: 100%;
  }
  .ehint {
    margin: 8px 2px 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* «Add a tile» outside edit mode: one quiet line at the end, no big dashed square */
  .plusw.quiet .plus {
    flex-direction: row;
    min-height: 44px;
    height: auto;
    border: 0;
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 3px;
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
