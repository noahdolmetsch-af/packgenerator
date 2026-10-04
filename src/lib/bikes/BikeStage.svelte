<script>
  /**
   * The bike drawing with a box per place (same drawing for every bike, decision 4a).
   * zones: [{ key, title, sub, box: {x, y, w, h}, empty, active, full }]
   * onpick(key) is called when a box is tapped.
   * ondropitem(key, itemId): an item from "Not packed" was dragged onto a box (Pack page only).
   */
  let { zones, onpick, ondropitem = null, label = 'Bike' } = $props();
  let over = $state(null); // the box an item is dragged over

  function dragover(event, key) {
    if (!ondropitem) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = event.dataTransfer.effectAllowed === 'copyMove' ? 'move' : 'copy';
    over = key;
  }
  function drop(event, key) {
    if (!ondropitem) return;
    event.preventDefault();
    over = null;
    const id = event.dataTransfer.getData('text/plain');
    if (id) ondropitem(key, id);
  }

  // Positions are in a 720 × 420 picture; as % they scale with the screen width.
  const pos = (b) => `left:${(b.x / 720) * 100}%;top:${(b.y / 420) * 100}%;width:${(b.w / 720) * 100}%;height:${(b.h / 420) * 100}%`;
</script>

<div class="stage" role="group" aria-label={label}>
  <div class="bike">
    <svg viewBox="0 0 720 420" preserveAspectRatio="none" aria-hidden="true">
      <path class="ground" d="M20 404 L700 404" />
      <circle cx="150" cy="300" r="104" /><circle cx="590" cy="300" r="104" />
      <circle class="hub" cx="150" cy="300" r="10" /><circle class="hub" cx="590" cy="300" r="10" />
      <path d="M150 300 L330 300 L300 140 Z" /><path d="M300 145 L545 128 L560 178 L330 300" /><path d="M560 178 L590 300" />
      <path d="M300 140 L294 112" /><path d="M255 108 L330 108" stroke-width="10" />
      <path d="M545 128 L540 108 L575 102" /><path d="M575 102 L590 92" stroke-width="9" />
      <circle cx="330" cy="300" r="22" stroke-width="5" />
    </svg>
    {#each zones as z (z.key)}
      <button
        type="button"
        class="zone"
        class:empty={z.empty}
        class:active={z.active}
        class:full={z.full}
        class:over={over === z.key}
        style={pos(z.box)}
        aria-label="{z.name ?? z.title}{z.sub ? `, ${z.sub}` : ''}"
        title={z.name ?? z.title}
        aria-pressed={z.active ? 'true' : undefined}
        onclick={() => onpick?.(z.key)}
        ondragover={(e) => dragover(e, z.key)}
        ondragleave={() => over === z.key && (over = null)}
        ondrop={(e) => drop(e, z.key)}
      >
        <span class="zt">{z.title}</span>
        {#if z.sub}<span class="zm num">{z.sub}</span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .stage {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 6px 8px;
  }
  .bike {
    position: relative;
    width: 100%;
    aspect-ratio: 720 / 420;
    container-type: inline-size;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    stroke: #97a69b;
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  .ground {
    stroke: var(--ink);
    stroke-width: 1.5;
    stroke-dasharray: 2 6;
  }
  .hub {
    fill: #97a69b;
  }
  .zone {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
    padding: 1px 5px;
    border: 1.5px solid var(--ink-3);
    border-radius: 3px;
    background: rgba(245, 246, 241, 0.94);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .zone.empty {
    border-style: dashed;
    background: rgba(232, 239, 233, 0.8);
    color: var(--ink-3);
  }
  .zone.active {
    border: 2px solid var(--hi);
    background: var(--hi-soft);
    color: var(--ink);
  }
  .zone.over {
    border: 2px solid var(--hi);
    background: var(--hi);
    color: var(--ink);
  }
  .zone.full {
    border: 2px solid #c0392b;
  }
  @media (hover: hover) {
    .zone:hover {
      box-shadow: 0 0 0 3px rgba(255, 91, 20, 0.35);
    }
  }
  .zt {
    font-weight: 700;
    font-size: clamp(8px, 1.8cqw, 13px);
    line-height: 1.1;
    white-space: nowrap;
  }
  .zm {
    font-size: clamp(7px, 1.5cqw, 11px);
    line-height: 1.2;
    white-space: nowrap;
    color: var(--ink-2);
  }
</style>
