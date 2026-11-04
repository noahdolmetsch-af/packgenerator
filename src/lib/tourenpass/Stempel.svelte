<script>
  /**
   * «Tourenpass mit Stempel» (Paket E, Idee 18): one round stamp with place, day and km, pressed a little crooked
   * as if by hand. With `press` it comes down once (a short, quiet press); «Reduce motion» and «Motion off» keep it still.
   */
  import { t, num } from '../i18n.svelte.js';
  import { turnOf } from './pass.js';

  let { id = '', place, date = '', km = null, press = false } = $props();
</script>

<span class="stamp" class:press data-stamp style:--turn="{turnOf(id || place)}deg">
  <span class="ring">
    <b class="pl">{place}</b>
    {#if date}<span class="dt num">{date}</span>{/if}
    {#if km}<small class="km num">{t('{km} km', { km: num(km) })}</small>{/if}
  </span>
</span>

<style>
  .stamp {
    display: inline-grid;
    place-items: center;
    max-width: 100%;
    color: var(--accent);
    transform: rotate(var(--turn, 0deg));
  }
  .ring {
    display: grid;
    gap: 2px;
    justify-items: center;
    align-content: center;
    box-sizing: border-box;
    width: 160px;
    aspect-ratio: 1;
    max-width: 100%;
    padding: 18px 14px;
    border: 3px solid currentcolor;
    border-radius: 50%;
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 5px var(--accent-soft), inset 0 0 0 7px currentcolor;
    text-align: center;
    overflow: hidden;
  }
  .pl {
    max-width: 100%;
    font: 700 var(--fs-small) / 1.15 var(--font-body);
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .dt {
    font: 600 var(--fs-small) / 1.2 var(--font-body);
  }
  .km {
    font-size: var(--fs-tiny);
  }
  @keyframes stamp-down {
    from {
      opacity: 0;
      transform: rotate(var(--turn, 0deg)) scale(1.35);
    }
    60% {
      opacity: 1;
      transform: rotate(var(--turn, 0deg)) scale(0.96);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    .press {
      animation: stamp-down 420ms var(--ease-out) backwards;
    }
  }
</style>
