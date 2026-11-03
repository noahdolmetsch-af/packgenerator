<script>
  /**
   * «Das Velo zeigt seine Pflege» (Noah 03.11.2026 «b», Paket C idea 22): a small drawn bike in the app's colours.
   * look: 'clean' (sparkles), 'normal' (nothing added), 'dusty' (specks of dust), 'web' (dust and a cobweb at the wheel).
   * The picture is decoration with a text next to it, so it is hidden from screen readers (aria-hidden).
   * The change fades in over half a second; «Reduce motion» on the device switches that off.
   */
  let { look = 'normal' } = $props();
</script>

<svg class="velo" data-look={look} viewBox="0 0 300 150" aria-hidden="true" focusable="false">
  <g class="frame" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="62" cy="98" r="40" /><circle cx="238" cy="98" r="40" />
    <path d="M62 98 L112 98 L150 52 L214 52 L238 98 M112 98 L150 52 M150 52 L170 98 L112 98 M170 98 L238 98 M142 38 L162 38 M214 52 L206 32 L226 32" />
  </g>
  <g class="dust" fill="currentColor"><circle cx="30" cy="132" r="5" /><circle cx="86" cy="142" r="4" /><circle cx="128" cy="118" r="5" /><circle cx="206" cy="136" r="5" /><circle cx="262" cy="140" r="4" /><circle cx="176" cy="74" r="3.5" /><circle cx="52" cy="84" r="3" /><circle cx="250" cy="70" r="3.5" /></g>
  <g class="web" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M112 98 L128 56 M112 98 L150 70 M112 98 L100 56 M121 78 Q136 84 142 72 M116 88 Q132 94 144 84" /></g>
  <g class="shine" fill="var(--accent)"><path d="M40 40 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" /><path d="M262 44 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" /><path d="M150 14 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" /></g>
</svg>

<style>
  .velo {
    display: block;
    width: 100%;
    max-width: 180px;
    height: auto;
    color: var(--ink);
  }
  .dust,
  .web,
  .shine {
    opacity: 0;
  }
  .dust,
  .web {
    color: var(--ink-2);
  }
  .velo[data-look='dusty'] .dust,
  .velo[data-look='web'] .dust,
  .velo[data-look='web'] .web,
  .velo[data-look='clean'] .shine {
    opacity: 1;
  }
  @media (prefers-reduced-motion: no-preference) {
    .dust,
    .web,
    .shine {
      transition: opacity 500ms var(--ease-out);
    }
  }
</style>
