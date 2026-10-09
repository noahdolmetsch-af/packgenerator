<script>
  /**
   * v0.31.0 (Noah 9a, variant A "Ruhig und klar"): the big light drawing of Bikes → Setup.
   * The bags sit as soft shapes on the bike; their names are not written into the small shapes
   * (they were cut off: "test_data_gtp_ Sea…") but in a row above and a row below the bike, each
   * with a thin line to its place. A name wraps when it is long, so it is never cut off.
   * The columns of a row split the width evenly, so a line ends exactly under its label.
   *
   * places: [{ key, name, box, bag: { name, sub } | null, on }]: the places to draw.
   * mounts: true while the mounts are edited (every place, no labels, a tap switches it).
   * onpick(key): a place or its label was tapped.
   */
  import { t } from '../i18n.svelte.js';
  import { tapAreas } from './tap.js';

  let { places, mounts = false, active = null, label = '', onpick } = $props();

  const W = 720;
  const H = 420;
  const cx = (b) => b.x + b.w / 2;
  const cy = (b) => b.y + b.h / 2;

  // Labels only for places with a bag. Upper half of the bike above, the rest below;
  // when one row would get more than half, the lowest of it moves down (and the other way round).
  const rows = $derived.by(() => {
    if (mounts) return { top: [], bottom: [] };
    const filled = places.filter((p) => p.bag).sort((a, b) => cy(a.box) - cy(b.box));
    let top = filled.filter((p) => cy(p.box) < 200);
    let bottom = filled.filter((p) => cy(p.box) >= 200);
    const max = Math.max(2, Math.ceil(filled.length / 2));
    while (top.length > max) bottom = [top.pop(), ...bottom];
    while (bottom.length > max) top = [...top, bottom.shift()];
    const byX = (a, b) => cx(a.box) - cx(b.box);
    return { top: top.sort(byX), bottom: bottom.sort(byX) };
  });
  const colX = (i, n) => ((i + 0.5) / n) * W;
  const pos = (b) => `left:${(b.x / W) * 100}%;top:${(b.y / H) * 100}%;width:${(b.w / W) * 100}%;height:${(b.h / H) * 100}%`;
  // v0.45.0 (acceptance follow-up 4): an invisible tap area of 44 px around each place on a touch
  // screen, never over the next one (tap.js). Measured from the drawing's width on screen.
  let bw = $state(0);
  const areas = $derived(bw ? tapAreas(places.map((p) => p.box), bw / W) : []);
  const tap = (i) => (areas[i] ? `;--tl:${areas[i].l}px;--tt:${areas[i].t}px;--tr:${areas[i].r}px;--tb:${areas[i].b}px` : '');
</script>

{#snippet labels(list, where)}
  {#if list.length}
    <div class="labels {where}" style:--n={list.length}>
      {#each list as p (p.key)}
        <button type="button" class="lab" class:active={active === p.key} onclick={() => onpick?.(p.key)} aria-label={t('{place}: {bag}, choose a bag', { place: p.name, bag: p.bag.name })}>
          <small>{p.name}</small>
          <b>{p.bag.name}</b>
          {#if p.bag.sub}<span class="num">{p.bag.sub}</span>{/if}
        </button>
      {/each}
    </div>
  {/if}
{/snippet}

<div class="drawing" role="group" aria-label={label}>
  {@render labels(rows.top, 'top')}
  <div class="bike" bind:clientWidth={bw}>
    <svg viewBox="0 0 {W} {H}" aria-hidden="true">
      <g class="frame">
        <path class="ground" d="M20 404 L700 404" />
        <circle cx="150" cy="300" r="104" /><circle cx="590" cy="300" r="104" />
        <circle class="hub" cx="150" cy="300" r="9" /><circle class="hub" cx="590" cy="300" r="9" />
        <path d="M150 300 L330 300 L300 140 Z" /><path d="M300 145 L545 128 L560 178 L330 300" /><path d="M560 178 L590 300" />
        <path d="M300 140 L294 112" /><path d="M255 108 L330 108" stroke-width="10" />
        <path d="M545 128 L540 108 L575 102" /><path d="M575 102 L590 92" stroke-width="9" />
        <circle cx="330" cy="300" r="22" stroke-width="5" />
      </g>
      <g class="leaders">
        {#each rows.top as p, i (p.key)}<line x1={cx(p.box)} y1={p.box.y} x2={colX(i, rows.top.length)} y2="0" />{/each}
        {#each rows.bottom as p, i (p.key)}<line x1={cx(p.box)} y1={p.box.y + p.box.h} x2={colX(i, rows.bottom.length)} y2={H} />{/each}
      </g>
    </svg>
    {#each places as p, i (p.key)}
      <button
        type="button"
        class="spot"
        class:empty={!p.bag}
        class:off={mounts && !p.on}
        class:active={active === p.key}
        style={pos(p.box) + tap(i)}
        aria-label={mounts ? (p.on ? t('{place}: mount on, tap to switch off', { place: p.name }) : t('{place}: no mount, tap to switch on', { place: p.name })) : p.bag ? t('{place}: {bag}, choose a bag', { place: p.name, bag: p.bag.name }) : t('{place}: empty, choose a bag', { place: p.name })}
        title={p.name}
        onclick={() => onpick?.(p.key)}
      >{#if !p.bag && !mounts}<span aria-hidden="true">+</span>{/if}</button>
    {/each}
  </div>
  {@render labels(rows.bottom, 'bottom')}
</div>

<style>
  .drawing {
    min-width: 0;
    max-width: 640px;
    margin: 0 auto;
    container-type: inline-size;
  }
  .bike {
    position: relative;
    width: 100%;
    aspect-ratio: 720 / 420;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .frame {
    stroke: var(--line-strong);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  .ground {
    stroke: var(--line);
    stroke-width: 1.5;
    stroke-dasharray: 2 6;
  }
  .hub {
    fill: var(--line-strong);
  }
  .leaders line {
    stroke: var(--ink-3);
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  .spot {
    position: absolute;
    display: grid;
    place-items: center;
    padding: 0;
    border: 2px solid var(--accent);
    border-radius: 6px;
    background: color-mix(in srgb, var(--accent) 18%, transparent);
    color: var(--ink-3);
    font: 600 14px/1 var(--font-body);
    cursor: pointer;
  }
  /* v0.45.0: the tap area (only on touch; a mouse keeps the exact shape). */
  @media (pointer: coarse) {
    .spot::after {
      content: '';
      position: absolute;
      left: calc(-2px - var(--tl, 0px));
      top: calc(-2px - var(--tt, 0px));
      right: calc(-2px - var(--tr, 0px));
      bottom: calc(-2px - var(--tb, 0px));
    }
  }
  .spot.empty {
    border-style: dashed;
    border-color: var(--ink-3);
    background: color-mix(in srgb, var(--paper) 60%, transparent);
  }
  .spot.off {
    border: 1.5px dashed var(--line);
    background: transparent;
  }
  .spot.active {
    border: 2.5px solid var(--hi);
    background: var(--hi-soft);
  }
  @media (hover: hover) {
    .spot:hover,
    .lab:hover {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--hi) 25%, transparent);
    }
  }
  .labels {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    column-gap: 6px;
  }
  .labels.top {
    align-items: end;
  }
  .labels.bottom {
    align-items: start;
  }
  .lab {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    min-height: 44px;
    padding: 4px 4px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: center;
    cursor: pointer;
    overflow-wrap: break-word;
  }
  /* A word longer than the column ("test_data_gtp_…") breaks instead of sticking out. */
  .lab > * {
    max-width: 100%;
  }
  .lab.active {
    background: var(--hi-soft);
  }
  .lab small {
    font-size: 12px;
    line-height: 1.2;
    color: var(--ink-3);
  }
  .lab b {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
  }
  .lab span {
    font-size: 12px;
    color: var(--ink-3);
  }
  @media (min-width: 560px) {
    .lab b {
      font-size: 14px;
    }
  }
  /* A narrow drawing: the bag's name and numbers only, the place is in the list below. */
  @container (max-width: 360px) {
    .lab small {
      display: none;
    }
    .lab b {
      font-size: 12px;
    }
  }
</style>
