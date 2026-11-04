<script>
  /**
   * «Laden als Strasse» (Noah 03.11.2026 «b», Paket D, Idee 14): the one small drawn bike of the app's little moments
   * (the loading road; the night light of Live Navigation draws the same bike). Two wheels with spokes, a frame,
   * a handlebar. `spin`: the wheels turn (the caller decides; still with «Bewegung reduzieren»).
   * Hidden from screen readers. size: width in px.
   */
  let { size = 56, spin = true } = $props();
</script>

<svg class="rb" class:spin viewBox="0 0 64 40" width={size} height={(size * 40) / 64} aria-hidden="true" data-roadbike>
  <g class="wh"><circle cx="12" cy="28" r="9" /><path class="sp" d="M12 20V36M4 28H20" /></g>
  <g class="wh"><circle cx="52" cy="28" r="9" /><path class="sp" d="M52 20V36M44 28H60" /></g>
  <path d="M12 28 L28 28 L36 14 L46 14 L52 28 M28 28 L36 14 M24 10h8" />
</svg>

<style>
  .rb {
    display: block;
    flex: none;
    overflow: visible;
    fill: none;
    stroke: var(--hi);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .sp {
    stroke-width: 1.2;
  }
  .wh {
    transform-box: fill-box;
    transform-origin: center;
  }
  @media (prefers-reduced-motion: no-preference) {
    .spin .wh {
      animation: rb-turn 0.7s linear infinite;
    }
  }
  @keyframes rb-turn {
    to {
      transform: rotate(360deg);
    }
  }
</style>
