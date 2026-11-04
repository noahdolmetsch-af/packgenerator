<script>
  /**
   * «Rollverschluss» (Noah 03.11.2026 «a», Paket B Idee 11): a small drawn dry bag next to the title of the open
   * bag. While things are missing its mouth stands open; when the last one goes in, the top rolls shut like on a
   * real bikepacking bag, and the buckle clicks into place (a short double buzz, only where the phone can and the
   * «Short vibration» switch is on). A bag that is already full when the page opens just shows as closed. With
   * «Reduce motion» it only changes, nothing rolls and nothing clicks. closed: the bag is full.
   */
  import { untrack } from 'svelte';
  import { clickBuzz } from '../bedienung.svelte.js';

  let { closed = false } = $props();
  let was = untrack(() => closed);
  $effect(() => {
    const c = closed;
    let tm = null;
    if (c && !was && !matchMedia('(prefers-reduced-motion: reduce)').matches) tm = setTimeout(clickBuzz, 420);
    was = c;
    return () => clearTimeout(tm);
  });
</script>

<svg class="roll" class:closed viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" data-bag-roll>
  <path class="body" d="M9 17 H35 V35 a5 5 0 0 1 -5 5 H14 a5 5 0 0 1 -5 -5 Z" />
  <path class="rim" d="M6 8 L9 17 M38 8 L35 17" />
  <ellipse class="mouth" cx="22" cy="17" rx="13" ry="4" />
  <rect class="top" x="6" y="10" width="32" height="10" rx="5" />
  <rect class="buckle" x="18" y="7" width="8" height="19" rx="2.5" />
</svg>

<style>
  .roll { flex: none; display: block; }
  .body { fill: var(--paper-2); stroke: var(--ink-3); stroke-width: 2.2; stroke-linejoin: round; }
  .rim { fill: none; stroke: var(--ink-3); stroke-width: 2.2; stroke-linecap: round; }
  .closed .rim { opacity: 0; }
  .mouth { fill: var(--ink-3); stroke: var(--ink-3); stroke-width: 2; }
  .top { fill: var(--ok); transform-box: fill-box; transform-origin: center bottom; transform: scaleY(0.15); opacity: 0; }
  .buckle { fill: var(--ink); transform-box: fill-box; transform-origin: center; opacity: 0; }
  .closed .mouth { opacity: 0; }
  .closed .top { transform: none; opacity: 1; }
  .closed .buckle { opacity: 0.85; }
  .closed .body { stroke: var(--ok); }
  @media (prefers-reduced-motion: no-preference) {
    .mouth { transition: opacity 250ms ease-out; }
    .top { transition: transform 450ms cubic-bezier(0.3, 0.9, 0.3, 1), opacity 250ms ease-out; }
    .buckle { transition: opacity 120ms ease-out 380ms, transform 160ms ease-out 380ms; }
    .body { transition: stroke 300ms ease-out; }
    .rim { transition: opacity 250ms ease-out; }
    .buckle { transform: scale(1.5); }
    .closed .buckle { transform: none; }
  }
</style>
