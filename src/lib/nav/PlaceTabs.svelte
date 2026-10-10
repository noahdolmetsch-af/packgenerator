<script>
  /**
   * v0.78.0 «Fünf Orte» 2 (Noah 10.10.2026, O2.1a–O2.6a): the pages of a place as tabs on top (at
   * most four; tabs whose function is missing stay hidden). On a phone a swipe sideways on the page
   * opens the next or the previous tab; dots show where you are, with a hint until the first swipe.
   * The tab opened last is remembered per place (nav.js keepTab / placeHref). An old address that
   * leads here (#/care, #/review …) says so once, in a small note you can close.
   */
  import { PLACES, PLACE_TABS, tabOf, tabStep } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import { phone, wide } from '../media.svelte.js';
  import { MapPin, X } from '@lucide/svelte';

  let { place, hash = '#/', moved = null, onclosemoved } = $props();

  const tabs = $derived(PLACE_TABS[place] ?? []);
  const cur = $derived(tabOf(place, hash));
  const placeName = $derived(t(PLACES.find((p) => p.key === place)?.label ?? ''));
  const curName = $derived(t(tabs.find((x) => x.key === cur)?.label ?? ''));

  /** Bikes: the chosen bike stays chosen in the other tab (#/bikes?tab=care&bike=<id>). */
  function hrefOf(x, h = hash) {
    if (place !== 'bikes') return x.href;
    const bike = new URLSearchParams(h.split('?')[1] ?? '').get('bike');
    return bike ? `${x.href}${x.href.includes('?') ? '&' : '?'}bike=${encodeURIComponent(bike)}` : x.href;
  }

  // On a computer the pages have widths of their own (880 px, 1040 px …): the tabs line up with the page below.
  let wrap = $state();
  let fit = $state('');
  $effect(() => {
    void hash;
    if (!wrap || !wide.matches) {
      fit = '';
      return;
    }
    const measure = () => {
      const pg = wrap?.nextElementSibling;
      const box = wrap?.parentElement;
      if (!pg || !box) return;
      const a = pg.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(box).paddingLeft) || 0;
      fit = a.width > 0 ? `margin-left:${Math.max(0, a.left - b.left - pad)}px;max-width:${a.width}px` : '';
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap.parentElement);
    const mo = new MutationObserver(measure);
    mo.observe(wrap.parentElement, { childList: true });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  });

  const SWIPED = 'nav.swiped';
  let swiped = $state(false);
  try {
    swiped = localStorage.getItem(SWIPED) === '1';
  } catch {
    swiped = true; // private mode: no hint that never goes away
  }

  /** A swipe started on something that scrolls sideways itself (a strip, a table) or on a field is not a tab swipe. */
  function ownSwipe(el) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (n.matches?.('input, textarea, select, [contenteditable="true"], dialog, .noswipe')) return true;
      const ox = getComputedStyle(n).overflowX;
      if ((ox === 'auto' || ox === 'scroll') && n.scrollWidth > n.clientWidth + 1) return true;
    }
    return false;
  }

  $effect(() => {
    if (!phone.matches || tabs.length < 2 || !cur) return;
    const main = document.querySelector('main');
    if (!main) return;
    let start = null;
    const down = (e) => {
      const p = e.touches?.[0];
      start = p && e.touches.length === 1 && !ownSwipe(e.target) ? { x: p.clientX, y: p.clientY, at: Date.now() } : null;
    };
    const up = (e) => {
      const p = e.changedTouches?.[0];
      if (!start || !p) return;
      const dx = p.clientX - start.x;
      const dy = p.clientY - start.y;
      const quick = Date.now() - start.at < 800;
      start = null;
      if (!quick || Math.abs(dx) < 60 || Math.abs(dx) < 2 * Math.abs(dy)) return;
      const next = tabStep(place, location.hash, dx < 0 ? 1 : -1);
      if (!next) return;
      try {
        localStorage.setItem(SWIPED, '1');
      } catch {
        /* private mode */
      }
      swiped = true;
      location.hash = hrefOf(next, location.hash);
    };
    main.addEventListener('touchstart', down, { passive: true });
    main.addEventListener('touchend', up, { passive: true });
    return () => {
      main.removeEventListener('touchstart', down);
      main.removeEventListener('touchend', up);
    };
  });
</script>

<div class="ptwrap" bind:this={wrap} style={fit}>
{#if tabs.length > 1 && cur}
  <nav class="ptabs noswipe" aria-label={t('Pages of {place}', { place: placeName })}>
    {#each tabs as x (x.key)}
      <a href={hrefOf(x)} aria-current={cur === x.key ? 'page' : undefined}>{t(x.label)}</a>
    {/each}
  </nav>
  {#if phone.matches}
    <p class="dots">
      <span class="dd" aria-hidden="true">{#each tabs as x (x.key)}<span class="d" class:on={cur === x.key}></span>{/each}</span>
      {#if !swiped}<span class="hint">{t('swipe for the next tab')}</span>{/if}
    </p>
  {/if}
{/if}
{#if moved}
  <div class="moved" role="status">
    <span class="ico" aria-hidden="true"><MapPin size={20} /></span>
    <p>{t('The old address {old} now leads here:', { old: moved })} <b>{curName ? `${placeName} › ${curName}` : placeName}</b>.</p>
    <button type="button" class="x" aria-label={t('Close note')} onclick={onclosemoved}><X size={20} aria-hidden="true" /></button>
  </div>
{/if}
</div>

<style>
  .ptabs {
    display: flex;
    gap: var(--sp-1);
    margin: 0 0 var(--sp-2);
    border-bottom: 1px solid var(--line);
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ptabs a {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    color: var(--ink-2);
    font: 500 var(--fs-body) / 1.2 var(--font-body);
    text-decoration: none;
    white-space: nowrap;
  }
  .ptabs a:visited {
    color: var(--ink-2);
  }
  .ptabs a[aria-current='page'] {
    border-bottom-color: var(--pc);
    color: var(--ink);
    font-weight: 700;
  }
  @media (max-width: 719px) {
    .ptabs {
      margin: calc(-1 * var(--gut)) calc(-1 * var(--gut)) 0;
      padding: 0 var(--sp-2);
      background: var(--paper);
    }
    .ptabs a {
      flex: 1 0 auto;
      justify-content: center;
      padding: 0 var(--sp-2);
    }
  }
  /* 320 px: four tabs («Overview · Care · Workshop · Measures») still fit side by side */
  @media (max-width: 380px) {
    .ptabs {
      gap: 0;
      padding: 0 var(--sp-1);
    }
    .ptabs a {
      padding: 0 var(--sp-1);
      font-size: var(--fs-label);
    }
  }
  .dots {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin: var(--sp-2) 0 var(--sp-3);
    color: var(--ink-2);
    font: 400 var(--fs-tiny) / 1.3 var(--font-body);
  }
  .dd {
    display: inline-flex;
    gap: var(--sp-1);
  }
  .d {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: var(--line);
  }
  .d.on {
    width: 18px;
    background: var(--pc);
  }
  .moved {
    display: flex;
    align-items: flex-start;
    gap: var(--sp-3);
    margin: 0 0 var(--sp-4);
    padding: var(--sp-3) var(--sp-2) var(--sp-3) var(--sp-4);
    border: 1px solid var(--line);
    border-left: 4px solid var(--pc);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
  }
  .ico {
    display: inline-flex;
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--ink-2);
  }
  .moved p {
    flex: 1;
    margin: 0;
    font: 400 var(--fs-label) / 1.45 var(--font-body);
  }
  .x {
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    margin: calc(-1 * var(--sp-2)) 0;
    border: 0;
    border-radius: 22px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
</style>
