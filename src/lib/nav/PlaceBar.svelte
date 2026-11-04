<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, all a): on a phone (and a narrow window) the five places
   * sit at the bottom, in reach of the thumb: Heute, Touren, Material, Velos, Aktiv. The chosen place
   * shows its colour as a pill behind the icon and in bold, not by colour alone. «+ Neu» is a round
   * button bottom right, above the bar (O1.3a); on the trip pages it sits higher, above their own main
   * button at the bottom (rule U1), never on it. Before: four places with the + in the middle (v0.23.0).
   * v0.98.0 Design-Refresh R2 (G4/G5 A★): the round + is gone, «Neu» sits in the top bar next to the
   * search; the chosen place is a soft pill behind the icon, the label in bold.
   * «Woche planen» (Noah 15.10.2026 «1a»): Heute, Woche, Touren, Velos, Aktiv; Material under Ich.
   */
  import { menuBar, placeHref, barPlace } from '../nav.js';
  import { anp, placeLabel } from '../anpassen.svelte.js'; // «Anpassen» 2a + 3a: your menu, your names
  import { t } from '../i18n.svelte.js';
  import PlaceIcon from './PlaceIcon.svelte';
  import { untrack } from 'svelte';

  let { place = null, hash = '#/', due = 0 } = $props();
  // AU1 «1b»: Velos and Ausrüstung share one slot; the switch on top of both pages changes between them
  const slot = $derived(barPlace(place));
  const places = $derived((void anp.v, menuBar()));

  // «Markierung gleitet» (Paket A Seitenwechsel 3, Noah 03.11.2026 «b»): the soft pill behind the chosen icon is one
  // piece that glides from place to place (about 0.2 s) instead of jumping. It takes its place and size from the chosen
  // icon's box; the first time it just stands there, only a later change glides. «Reduce motion» and the switch
  // «Bewegung: Aus» (app.css, theme.svelte.js) take the glide away; the pill still stands in the right place.
  let nav = $state(null);
  let mark = $state(null); // { x, y, w, h } of the chosen icon's box inside the bar, or null (no place chosen)
  let glide = $state(false);
  const measure = () => {
    const box = nav?.querySelector("a[aria-current='page'] .pi");
    if (!box) {
      mark = null;
      return;
    }
    const n = nav.getBoundingClientRect();
    const r = box.getBoundingClientRect();
    mark = { x: r.left - n.left - nav.clientLeft, y: r.top - n.top - nav.clientTop, w: r.width, h: r.height };
  };
  $effect(() => {
    void slot;
    void places;
    void anp.v;
    untrack(measure);
    if (untrack(() => glide || !mark)) return;
    const f = requestAnimationFrame(() => (glide = true));
    return () => cancelAnimationFrame(f);
  });
  // a turned phone, a changed text size or a late font moves the icons: the pill follows without gliding
  $effect(() => {
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => untrack(measure));
    ro.observe(nav);
    return () => ro.disconnect();
  });
</script>

<nav class="bottom" class:has-mark={!!mark} class:glide aria-label={t('Sections')} bind:this={nav}>
  {#if mark}<span class="mark" aria-hidden="true" data-place-mark style="--mx:{mark.x}px;--my:{mark.y}px;--mw:{mark.w}px;--mh:{mark.h}px"></span>{/if}
  {#each places as p (p.key)}
    <a href={(void anp.v, placeHref(p, slot, hash))} data-place={p.key} aria-current={slot === p.key ? 'page' : undefined}>
      <span class="pi"><PlaceIcon place={p.key} />{#if p.key === 'bikes' && due}<span class="due num" aria-hidden="true">{due}</span>{/if}</span>
      <span class="pn" class:two={!!p.bar}>{placeLabel(p, true)}</span>{#if p.key === 'bikes' && due}<span class="sr">, {t('{n} due', { n: due })}</span>{/if}
    </a>
  {/each}
</nav>

<style>
  .bottom {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 6;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    padding: var(--sp-1) var(--sp-1) calc(6px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    min-height: 52px;
    color: var(--ink-2);
    font: 500 var(--fs-small) / 1.2 var(--font-body);
    text-decoration: none;
  }
  .pn {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* «Velos und Material» may take two short lines */
  .pn.two {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    font-size: var(--fs-tiny);
    line-height: 1.1;
    text-align: center;
    white-space: normal;
  }
  /* the two lines fit the 52 px of one: the bar keeps its height, so bars above it (MainBar) stay clear */
  a:has(.pn.two) {
    gap: 0;
  }
  a:has(.pn.two) .pi {
    height: 25px;
  }
  .pi {
    position: relative;
    display: grid;
    place-items: center;
    width: 52px;
    height: 30px;
    border-radius: 15px;
  }
  a[aria-current='page'] {
    color: var(--ink);
    font-weight: 700;
  }
  a[aria-current='page'] .pi {
    color: var(--ink);
  }
  /* before the pill is measured (the first frame) the icon box carries the colour itself */
  .bottom:not(.has-mark) a[aria-current='page'] .pi {
    background: var(--paper-2);
  }
  .mark {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--mw);
    height: var(--mh);
    transform: translate(var(--mx), var(--my));
    border-radius: 15px;
    background: var(--paper-2);
    pointer-events: none;
  }
  @media (prefers-reduced-motion: no-preference) {
    .glide .mark {
      transition: transform 200ms var(--ease-out), width 200ms var(--ease-out), height 200ms var(--ease-out);
    }
  }
  .due {
    position: absolute;
    top: -4px;
    left: calc(50% + 6px);
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    box-shadow: 0 0 0 2px var(--paper);
    background: var(--hi);
    color: var(--hi-ink);
    font: 700 var(--fs-tiny) / 1.5 var(--font-body);
    text-align: center;
  }
  /* A very narrow phone (320 px): five slots of about 63 px; the small type keeps «Auswerten» whole */
  @media (max-width: 359px) {
    .bottom {
      padding-inline: 2px;
    }
    a {
      font-size: var(--fs-tiny);
      letter-spacing: -0.01em;
    }
  }
  /* A phone turned sideways: one 44 px row, icon next to the label. */
  @media (max-height: 500px) {
    .bottom {
      padding: 2px max(6px, env(safe-area-inset-right)) calc(2px + env(safe-area-inset-bottom)) max(6px, env(safe-area-inset-left));
    }
    a {
      flex-direction: row;
      gap: 6px;
      min-height: 44px;
    }
    .pi {
      width: 40px;
      height: 28px;
    }
  }
  @media print {
    .bottom {
      display: none;
    }
  }
</style>
