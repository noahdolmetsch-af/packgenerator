<script>
  /**
   * «Licht in der Nacht» (Noah 03.11.2026 «b», Paket D, Idee 20): over the live map, after sunset, the edge gets darker
   * and a warm cone of light lies ahead of you, like from a front lamp. It grows over half an hour after sunset
   * (nightlight.js) and does not touch the map: no tap goes into it. Own switch in the ride's settings («Night
   * light»), off with the battery saver. The cone sits on your position (the middle of the map) and points where you
   * ride (up when the map turns with you).
   * strength: 0..1; deg: where the cone points in degrees (0 = up).
   */
  let { strength = 1, deg = 0 } = $props();
</script>

<div class="nl" style="--s:{strength}" aria-hidden="true" data-live-night-light data-night-strength={strength.toFixed(2)}>
  <div class="edge"></div>
  <div class="spot" style="--a:{deg}deg"><span class="cone"></span></div>
</div>

<style>
  .nl {
    position: absolute;
    inset: 0;
    z-index: 1; /* under the warnings of the map (z-index 2) */
    overflow: hidden;
    opacity: var(--s);
    pointer-events: none;
  }
  .edge {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 50%, transparent 18%, var(--scrim) 90%),
      radial-gradient(ellipse at 50% 50%, transparent 26%, var(--scrim) 100%),
      radial-gradient(ellipse at 50% 50%, transparent 40%, var(--scrim) 100%);
  }
  /* the cone: its tip is your position, it widens along your way */
  .spot {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 0;
    height: 0;
    rotate: var(--a);
  }
  .cone {
    position: absolute;
    left: -110px;
    bottom: 0;
    width: 220px;
    height: min(46vh, 340px);
    background: linear-gradient(to top, color-mix(in srgb, white 82%, var(--warn)) 0%, transparent 100%);
    opacity: 0.75;
    clip-path: polygon(46% 100%, 54% 100%, 100% 0, 0 0);
  }
  @media (prefers-reduced-motion: no-preference) {
    .nl {
      transition: opacity 1.5s ease-in-out;
    }
    .spot {
      transition: rotate 600ms var(--ease-out);
    }
  }
</style>
