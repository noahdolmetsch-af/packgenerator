<script>
  /**
   * UC3-2 «Taschen-Plan»: the bike from the side (the same shape as the Setup drawing) with every bag
   * of the plan as a soft shape and its number, so the list next to it can say «1 Front roll».
   * bags: bagPlan(...).bags ({ n, key, full }). label: what a screen reader hears for the picture.
   */
  import { SLOT } from '../bikes.js';

  let { bags = [], label = '' } = $props();
</script>

<svg class="rigbike" viewBox="0 0 720 420" role="img" aria-label={label}>
  <rect width="720" height="420" rx="24" class="bg" />
  <g class="frame">
    <circle cx="150" cy="300" r="104" /><circle cx="590" cy="300" r="104" />
    <path d="M150 300 L330 300 L300 140 Z" /><path d="M300 145 L545 128 L560 178 L330 300" /><path d="M560 178 L590 300" />
    <path d="M300 140 L294 112" /><path d="M255 108 L330 108" stroke-width="10" />
    <path d="M545 128 L540 108 L575 102" /><path d="M575 102 L590 92" stroke-width="9" />
    <circle cx="330" cy="300" r="22" />
  </g>
  {#each bags as b (b.key)}
    {@const box = SLOT[b.key]?.box}
    {#if box}
      <rect class="bag" class:full={b.full} x={box.x} y={box.y} width={box.w} height={box.h} rx="14" />
      <circle class="dot" cx={box.x + box.w / 2} cy={box.y + box.h / 2} r="17" />
      <text class="no" x={box.x + box.w / 2} y={box.y + box.h / 2 + 6} text-anchor="middle">{b.n}</text>
    {/if}
  {/each}
</svg>

<style>
  .rigbike {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
  }
  .bg {
    fill: var(--paper-2);
  }
  .frame {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bag {
    fill: var(--warn-soft);
    stroke: var(--warn);
    stroke-width: 3;
  }
  .bag.full {
    fill: var(--hi-soft);
    stroke: var(--hi);
  }
  .dot {
    fill: var(--ink);
  }
  .no {
    fill: var(--paper);
    font: 700 var(--fs-sub) var(--font-body);
  }
</style>
