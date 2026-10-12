<script>
  /**
   * v0.67.0 «Übergänge 1» (kit, rule U6): a finished step celebrates quietly: a tick and one
   * sentence. No confetti, no pop-up. title: the short word («Gepackt»); text: the one sentence.
   * size 'big': the head of an interstitial (an h1); 'small': a line inside a card.
   * v0.99.0 Design-Refresh R3 (G3 «Erledigt», Noah 12.10 «3b»): the big moment gets a short burst of
   * confetti in the colours of the app, once, about 1.5 s, behind nothing and never in the way. With
   * «reduce motion» it stays the quiet tick.
   */
  import { Check } from '@lucide/svelte';

  let { title, text = '', size = 'small' } = $props();

  // 28 pieces, spread evenly from the middle; the same every time (no chance, calm and testable)
  const COLOURS = ['var(--hi)', 'var(--warn)', 'var(--ok)', 'var(--l3, var(--hi))', 'var(--bad)'];
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    x: Math.round(Math.sin(i * 2.4) * 38 + (i % 2 ? 4 : -4)),
    y: -Math.round(18 + ((i * 37) % 30)),
    r: (i * 53) % 360,
    d: ((i * 7) % 5) * 40,
    c: COLOURS[i % COLOURS.length],
  }));
</script>

<div class="celebrate {size}" role={size === 'small' ? 'status' : undefined}>
  {#if size === 'big'}
    <span class="confetti" aria-hidden="true">
      {#each pieces as p, i (i)}<i style="--x:{p.x}vw;--y:{p.y}vh;--r:{p.r}deg;--d:{p.d}ms;background:{p.c}"></i>{/each}
    </span>
  {/if}
  <span class="tick" aria-hidden="true"><Check size={size === 'big' ? 30 : 18} strokeWidth={2.5} /></span>
  {#if size === 'big'}<h1 tabindex="-1" data-page-title>{title}</h1>{:else}<b>{title}</b>{/if}
  {#if text}<p>{text}</p>{/if}
</div>

<style>
  .celebrate {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
  }
  .tick {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
  }
  h1 {
    margin: 4px 0 0;
    font: 800 var(--fs-page)/1.05 var(--font-brand);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  p {
    margin: 0;
    max-width: 30em;
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .small {
    grid-template-columns: auto minmax(0, 1fr);
    justify-items: start;
    align-items: center;
    gap: 2px 10px;
    text-align: left;
  }
  .small .tick {
    grid-row: span 2;
    width: 34px;
    height: 34px;
  }
  .small p {
    font-size: var(--fs-small);
  }
  /* the burst starts above the middle and falls away; one still layer over the page, it never takes clicks or scrolls */
  .confetti {
    position: fixed;
    inset: 0;
    z-index: 40;
    overflow: hidden;
    pointer-events: none;
  }
  .confetti i {
    position: absolute;
    top: 30vh;
    left: 50%;
    width: 8px;
    height: 12px;
    border-radius: 2px;
    opacity: 0;
    animation: burst 1.5s cubic-bezier(0.2, 0.7, 0.4, 1) var(--d) forwards;
  }
  @keyframes burst {
    0% {
      opacity: 1;
      transform: translate(0, 0) rotate(0);
    }
    55% {
      opacity: 1;
      transform: translate(calc(var(--x) * 0.8), var(--y)) rotate(var(--r));
    }
    100% {
      opacity: 0;
      transform: translate(var(--x), calc(var(--y) * -0.6)) rotate(calc(var(--r) * 2));
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .confetti {
      display: none;
    }
  }
</style>
