<script>
  /**
   * UC3-1: the drawn picture of a race-rig card (hills and a loaded bike in the app's colours), never
   * a photo from the linked page. n varies the hills and the sky from card to card.
   */
  let { n = 0 } = $props();
  const HILLS = ['M0 110 L60 60 L110 95 L170 40 L240 100 L300 55 L360 105 L400 80 V132 H0Z', 'M0 105 L80 70 L140 90 L220 50 L290 85 L360 60 L400 75 V132 H0Z', 'M0 100 Q100 70 180 95 T400 85 V132 H0Z'];
  const k = $derived(n % 3);
</script>

<svg class="art" viewBox="0 0 400 132" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="400" height="132" class="sky s{k}" />
  <path d={HILLS[k]} class="hill h{k}" />
  <g transform="translate(150 50)" class="bike">
    <circle cx="18" cy="52" r="22" /><circle cx="102" cy="52" r="22" />
    <path d="M18 52 38 18h44l20 34M38 18l22 34H18M82 18l-6-12h-10M60 52l-8-38" />
    <rect x="30" y="20" width="40" height="16" rx="5" class="bag" />
    <rect x="88" y="0" width="22" height="12" rx="6" class="roll" />
    <rect x="40" y="2" width="20" height="10" rx="5" class="roll" />
  </g>
</svg>

<style>
  .art {
    display: block;
    width: 100%;
    height: 132px;
  }
  .sky {
    fill: var(--paper-2);
  }
  .sky.s1 {
    fill: var(--warn-soft);
  }
  .hill {
    fill: var(--line);
  }
  .hill.h1 {
    fill: var(--ok-soft);
  }
  .bike {
    fill: none;
    stroke: var(--ink-2);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bag {
    fill: var(--warn);
    stroke: var(--warn);
  }
  .roll {
    fill: var(--ink-3);
    stroke: var(--ink-3);
  }
</style>
