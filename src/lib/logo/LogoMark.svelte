<script>
  /**
   * The inside of the «PG» logo (top bar on a phone, side bar on a computer). Plain: the letters «PG». After the secret
   * of the logo (five quick taps) the bike sign with a bit of the season (C) or «PG» with a seasonal extra (D):
   * a woolly hat in winter, a flower in spring, a straw hat in summer, an umbrella in autumn. Hidden from screen
   * readers (the link has its own name), never in the way. Chosen in Ich › Darstellung › Logo.
   */
  import { logo } from './logo.svelte.js';
  import { localDay } from '../localday.js';
  import { seasonOf } from '../season/season.js';

  const season = seasonOf(localDay());
</script>

{#if logo.pick === 'bike'}
  <svg class="lg bike" data-logo="bike" data-season={season} viewBox="0 0 32 32" aria-hidden="true">
    <g class="line"><circle cx="8.5" cy="20" r="5" /><circle cx="23.5" cy="20" r="5" /><path d="M8.5 20H14L12 12H20L23.5 20M14 20L20 12M12 12L11 10M9.5 10H13M20 12L21 9H24" /></g>
    {#if season === 'winter'}
      <path d="M3 7C3 2 9 1 16 1s13 1 13 6c-3-1.6-8-2-13-2S6 5.400 3 7z" fill="currentColor" />
    {:else if season === 'spring'}
      <g fill="#e9b4c4"><circle cx="25" cy="8" r="2.2" /><circle cx="28" cy="10.2" r="2.2" /><circle cx="26.8" cy="13.6" r="2.2" /><circle cx="23.2" cy="13.6" r="2.2" /><circle cx="22" cy="10.2" r="2.2" /></g>
      <circle cx="25" cy="11" r="1.4" fill="#f2c94c" />
    {:else if season === 'summer'}
      <g stroke="#f2c94c" stroke-width="1.6" stroke-linecap="round"><circle cx="8" cy="8" r="2.6" fill="#f2c94c" /><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l-1-1M12.2 3.8l-1 1M4.8 11.2l-1 1" /></g>
    {:else}
      <path d="M3 12C3 5 8 2 15 2c0 6-4 10-12 10zM3 12l7-6" fill="#e8d9bd" stroke="#b8741a" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" />
    {/if}
  </svg>
{:else}
  PG
  {#if logo.pick === 'hat'}
    <svg class="lg hat" data-logo="hat" data-season={season} viewBox="0 0 32 32" aria-hidden="true">
      {#if season === 'winter'}
        <path d="M5 3C7-9 16-11 25-2L28 3z" fill="#c2441b" /><rect x="3" y="1" width="26" height="5" rx="2.5" fill="#fff" /><circle cx="25" cy="-5" r="3" fill="#fff" />
      {:else if season === 'spring'}
        <g transform="translate(23 -1)"><g fill="#e9b4c4"><circle cx="0" cy="-4" r="3" /><circle cx="4" cy="-1" r="3" /><circle cx="2.5" cy="3.5" r="3" /><circle cx="-2.5" cy="3.5" r="3" /><circle cx="-4" cy="-1" r="3" /></g><circle r="2.2" fill="#f2c94c" /></g>
      {:else if season === 'summer'}
        <ellipse cx="16" cy="3" rx="19" ry="3.6" fill="#e5c07b" /><path d="M7 3C7-7 25-7 25 3z" fill="#e5c07b" /><rect x="7" y="0" width="18" height="2.6" fill="#c2441b" />
      {:else}
        <path d="M-4 5C-4-9 36-9 36 5C32 2 28 2 26 5C24 2 20 2 16 5C12 2 8 2 6 5C4 2 0 2-4 5z" fill="#b8501c" /><path d="M16 5V13" stroke="#e8d9bd" stroke-width="1.6" stroke-linecap="round" fill="none" />
      {/if}
    </svg>
  {/if}
{/if}

<style>
  .lg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .bike .line {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
