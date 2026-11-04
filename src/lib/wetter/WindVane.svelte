<script>
  /**
   * «Windfahne beim Wetter» (Noah 03.11.2026 «b», Paket D, Idee 15): a small drawn wind vane instead of the plain wind
   * icon. The staff stands on the side the wind comes from, the pennant streams to where it blows, drawn like on a map
   * (north is up), so «from the south-west» can be read at a glance. The pennant gets longer and flutters harder with
   * more wind; in a calm it hangs short and still. dir: where the wind comes from in degrees (0 = north); kmh: its speed.
   * Without a direction the plain wind icon shows. Hidden from screen readers (the text beside it says the same);
   * the fluttering stands still with «Bewegung reduzieren».
   */
  import { Wind } from '@lucide/svelte';
  import { vaneOf } from './vane.js';

  let { dir = null, kmh = null, size = 26 } = $props();
  const v = $derived(vaneOf(dir, kmh));
</script>

{#if v}
  <svg class="vane" class:calm={v.calm} viewBox="-12 -12 24 24" width={size} height={size} aria-hidden="true" data-vane data-vane-wind={v.level} style="--amp:{v.amp}deg;--dur:{v.dur}s">
    <g transform="rotate({v.angle})">
      <path class="staff" d="M-8 0H0" />
      <g class="flag"><path d="M0 -4.5 Q{v.len * 0.45} -7 {v.len} -2 Q{v.len * 0.45} 0 0 4.5Z" /></g>
    </g>
    <circle class="hub" cx="0" cy="0" r="2.2" />
  </svg>
{:else}
  <Wind {size} aria-hidden="true" />
{/if}

<style>
  .vane {
    flex: none;
    overflow: visible;
    color: var(--ink-2);
  }
  .staff {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .flag path {
    fill: var(--hi);
  }
  .hub {
    fill: currentColor;
  }
  .flag {
    transform-box: view-box;
    transform-origin: 0 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .vane:not(.calm) .flag {
      animation: vane-flap var(--dur) ease-in-out infinite alternate;
    }
  }
  @keyframes vane-flap {
    from {
      transform: rotate(calc(var(--amp) * -1));
    }
    to {
      transform: rotate(var(--amp));
    }
  }
</style>
