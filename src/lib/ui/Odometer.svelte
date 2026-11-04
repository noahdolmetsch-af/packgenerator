<script>
  /**
   * «Tacho-Ziffern» (Noah 03.11.2026 «b», Paket C idea 12): the km of a bike roll up like an old bike odometer
   * when the number appears, then stand still. value: the number, shown in the app's number format.
   * The real digits stay in the text (screen readers, copy, tests); the rolling is drawn with generated content
   * on top and only runs when the device does not ask for «Reduce motion» (then the number just stands there).
   * It rolls once when it appears, never again when the number changes later.
   */
  import { num } from '../i18n.svelte.js';
  import { odoParts, odoMs } from './odometer.js';

  let { value } = $props();
  const parts = $derived(
    (() => {
      let n = -1;
      return odoParts(num(value)).map((p) => ({ ...p, ms: p.d == null ? 0 : odoMs(++n) }));
    })(),
  );
</script>

<span class="odo">{#each parts as p, i (i)}{#if p.d == null}{p.c}{:else}<span class="d" style="--d:{p.d};--ms:{p.ms}ms"><span class="r">{p.c}</span></span>{/if}{/each}</span>

<style>
  .odo {
    font-variant-numeric: tabular-nums;
  }
  .d {
    display: inline-block;
    position: relative;
    height: 1.2em;
    line-height: 1.2em;
    overflow: hidden;
    vertical-align: bottom;
  }
  @media (prefers-reduced-motion: no-preference) {
    /* the real digit waits (hidden) until its roll is over; the roll is the generated stack 0-9, 0-9 */
    .r {
      visibility: hidden;
      animation: odo-ink 1ms linear var(--ms) forwards;
    }
    .d::before {
      content: '0\A 1\A 2\A 3\A 4\A 5\A 6\A 7\A 8\A 9\A 0\A 1\A 2\A 3\A 4\A 5\A 6\A 7\A 8\A 9' / '';
      white-space: pre;
      position: absolute;
      left: 0;
      top: 0;
      line-height: 1.2em;
      animation: odo-roll var(--ms) cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    }
  }
  @keyframes odo-roll {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    99% {
      transform: translateY(calc(-1.2em * (10 + var(--d))));
      opacity: 1;
    }
    to {
      transform: translateY(calc(-1.2em * (10 + var(--d))));
      opacity: 0;
    }
  }
  @keyframes odo-ink {
    to {
      visibility: visible;
    }
  }
</style>
