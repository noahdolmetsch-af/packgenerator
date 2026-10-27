<script>
  /**
   * «Neuer Schwung» Packen 3 (block B23 «gezeichnetes Velo mit Taschen», Noah 27.10.2026 «1a 2a 3a» page by page
   * with motion, «danach alle anderen Vorschläge umsetzen»): on the packing day the bike from the side (the shape
   * of RigBike) with every bag of the trip at its place. Each bag fills from below as you pack, a full bag turns
   * green with a tick, the open bag is framed. A tap on a bag opens it, like its tile below.
   * Only bags on the bike: «Wear and carry», «On the bike» and worn bags stay as tiles.
   * steps: packSteps(); cur: the open step's key; onpick(key).
   */
  import { SLOT } from '../bikes.js';
  import { t } from '../i18n.svelte.js';

  let { steps = [], cur = null, onpick = () => {} } = $props();

  const bags = $derived(steps.filter((s) => SLOT[s.key]?.box && !SLOT[s.key].worn && s.entries.length));
  // the drawing starts just above the highest bag (no empty band on top)
  const top = $derived(Math.max(0, Math.min(60, ...bags.map((s) => SLOT[s.key].box.y - 12))));
  const share = (s) => (s.entries.length ? s.done / s.entries.length : 0);
  const key = (e, s) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onpick(s.key);
    }
  };
</script>

{#if bags.length}
  <svg class="pkbike" viewBox="0 {top} 720 {420 - top}" role="group" aria-label={t('Your bike with the bags of this trip')} data-pack-bike>
    <g class="frame" aria-hidden="true">
      <circle cx="150" cy="300" r="104" /><circle cx="590" cy="300" r="104" />
      <path d="M150 300 L330 300 L300 140 Z" /><path d="M300 145 L545 128 L560 178 L330 300" /><path d="M560 178 L590 300" />
      <path d="M300 140 L294 112" /><path d="M255 108 L330 108" stroke-width="10" />
      <path d="M545 128 L540 108 L575 102" /><path d="M575 102 L590 92" stroke-width="9" />
      <circle cx="330" cy="300" r="22" />
    </g>
    {#each bags as s (s.key)}
      {@const b = SLOT[s.key].box}
      {@const full = s.done === s.entries.length}
      <g
        class="bag"
        class:full
        class:open={s.key === cur}
        role="button"
        tabindex="0"
        aria-current={s.key === cur ? 'true' : undefined}
        aria-label={t('{bag}: {n} of {total} packed', { bag: s.title, n: s.done, total: s.entries.length })}
        onclick={() => onpick(s.key)}
        onkeydown={(e) => key(e, s)}
        data-bike-bag={s.key}
      >
        <rect class="shell" x={b.x} y={b.y} width={b.w} height={b.h} rx="12" />
        <rect class="fill" x={b.x} y={b.y} width={b.w} height={b.h} rx="12" style:--fill={share(s)} />
        <text class="no num" x={b.x + b.w / 2} y={b.y + b.h / 2 + 8} text-anchor="middle" font-size="26" aria-hidden="true">{full ? '✓' : `${s.done}/${s.entries.length}`}</text>
      </g>
    {/each}
  </svg>
{/if}

<style>
  .pkbike {
    display: block;
    width: 100%;
    max-width: 440px;
    height: auto;
    margin: 4px auto 12px;
  }
  .frame {
    fill: none;
    stroke: var(--ink-3);
    stroke-width: 7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bag {
    cursor: pointer;
    outline: none;
  }
  .shell {
    fill: var(--paper);
    stroke: var(--line-strong);
    stroke-width: 3;
  }
  .fill {
    fill: color-mix(in srgb, var(--hi) 35%, var(--paper));
    transform-box: fill-box;
    transform-origin: bottom;
    transform: scaleY(var(--fill, 0));
  }
  .bag.full .fill {
    fill: color-mix(in srgb, var(--ok) 45%, var(--paper));
  }
  .bag.open .shell,
  .bag:focus-visible .shell {
    stroke: var(--hi);
    stroke-width: 6;
  }
  .no {
    fill: var(--ink);
    font-family: var(--font-body);
    font-weight: 600;
  }
  @media (prefers-reduced-motion: no-preference) {
    .fill {
      transition: transform 450ms ease-out;
      animation: pk-bike 700ms ease-out 120ms backwards;
    }
  }
  @keyframes pk-bike {
    from {
      transform: scaleY(0);
    }
  }
</style>
