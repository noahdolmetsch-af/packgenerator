<script>
  /**
   * v0.78.0 «Fünf Orte» 2 (Noah 10.10.2026, O2.1a–O2.6a): the pages of a place as tabs on top (at
   * most four; tabs whose function is missing stay hidden). On a phone a swipe sideways on the page
   * opens the next or the previous tab; dots show where you are (v0.86.0 «Meditation einfach», Noah
   * «1-5 a»: no more «wischen für den nächsten Tab» hint; the swipe itself stays).
   * The tab opened last is remembered per place (nav.js keepTab / placeHref). An old address that
   * leads here (#/care, #/review …) says so once, in a small note you can close.
   */
  import { PLACES, tabOf, tabStep, shownTabs, phoneTabs, setTabOrder } from '../nav.js';
  import { anp, placeLabel, tabLabel } from '../anpassen.svelte.js'; // «Anpassen» 2a + 3a: hidden tabs and own names
  import { t } from '../i18n.svelte.js';
  import { phone, wide } from '../media.svelte.js';
  import { ChevronDown, X } from '@lucide/svelte';
  import SortGrip from '../ui/SortGrip.svelte';
  import SortArrows from '../ui/SortArrows.svelte';
  import { sortable } from '../ui/sortable.js';
  import { backClose } from '../ui/backclose.js';

  let { place, hash = '#/', moved = null, onclosemoved } = $props();

  let order = $state(0); // counts the changes of the order, so the tabs redraw
  const tabs = $derived((void anp.v, void order, shownTabs(place, hash)));
  const cur = $derived(tabOf(place, hash));
  // Impeccable 20.10.2026 P1 (Noah «alles umsetzen», 1a 2a): on a computer the pages of a place stand only in the
  // sidebar on the left (SideBar.svelte), no second row of tabs on top. On a phone at most four tabs show; the rest
  // and your own order are in «Mehr».
  const split = $derived((void order, void anp.v, phoneTabs(place, hash)));
  const all = $derived((void order, tabs));
  let moreDlg = $state();
  function openMore() {
    moreDlg?.showModal();
  }
  function move(from, to) {
    if (to < 0 || to >= all.length || from === to) return;
    const keys = all.map((x) => x.key);
    const [k] = keys.splice(from, 1);
    keys.splice(to, 0, k);
    setTabOrder(place, keys);
    order++;
  }
  function resetOrder() {
    setTabOrder(place, null);
    order++;
  }
  const placeObj = $derived(PLACES.find((p) => p.key === place));
  const placeName = $derived(placeObj ? placeLabel(placeObj) : '');
  const curTab = $derived(tabs.find((x) => x.key === cur));
  const curName = $derived(curTab ? tabLabel(place, curTab) : '');

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
{#if tabs.length > 1 && cur && !wide.matches}
  <nav class="ptabs noswipe" class:many={split.shown.length > 3} aria-label={t('Pages of {place}', { place: placeName })}>
    {#each split.shown as x (x.key)}
      <a href={hrefOf(x)} aria-current={cur === x.key ? 'page' : undefined}>{tabLabel(place, x)}</a>
    {/each}
    {#if split.more.length}
      <button type="button" class="pmore" aria-haspopup="dialog" onclick={openMore}>{t('More')}<ChevronDown size={16} aria-hidden="true" /></button>
    {/if}
  </nav>
  {#if split.more.length}
    <dialog class="sheet from-below ptsheet" bind:this={moreDlg} use:backClose aria-labelledby="pt-h">
      <div class="pt-head">
        <h2 id="pt-h">{t('More pages in {place}', { place: placeName })}</h2>
        <button type="button" class="pt-x" aria-label={t('Close')} onclick={() => moreDlg.close()}><X size={20} aria-hidden="true" /></button>
      </div>
      <p class="pt-hint">{t('Drag the pages you use often to the top. The first four stand as tabs.')}</p>
      <ul class="pt-list" use:sortable={{ onmove: (from, to) => move(from, to) }}>
        {#each all as x, i (x.key)}
          <li data-sort-id={x.key} class:shown={split.shown.includes(x)}>
            <SortGrip name={tabLabel(place, x)} onstep={(dir) => move(i, i + dir)} />
            <a href={hrefOf(x)} aria-current={cur === x.key ? 'page' : undefined} onclick={() => moreDlg.close()}>{tabLabel(place, x)}</a>
            {#if i < 4}<span class="pt-tab">{t('tab|nav')}</span>{/if}
            <SortArrows name={tabLabel(place, x)} {i} n={all.length} onstep={(dir) => move(i, i + dir)} />
          </li>
        {/each}
      </ul>
      <p class="pt-foot"><button type="button" class="btn-link btn" onclick={resetOrder}>{t('Back to the app\'s order')}</button></p>
    </dialog>
  {/if}
  {#if tabs.length <= 4}
    <p class="dots">
      <span class="dd" aria-hidden="true">{#each tabs as x (x.key)}<span class="d" class:on={cur === x.key}></span>{/each}</span>
    </p>
  {/if}
{/if}
<!-- v0.137.0 (Durchklick DK6): no note about an old address; the old address still leads here -->
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
    min-width: 44px; /* Paket T: Aktiv has six tabs; a short label («Ziele») stays a full tap target */
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
  /* UC3 (14.10.2026): Velos has five tabs; on a phone they get the smaller label size so all five stay in view */
  @media (max-width: 719px) {
    .ptabs.many {
      gap: 0;
    }
    .ptabs.many a {
      padding: 0 var(--sp-1);
      font-size: var(--fs-label);
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
    .ptabs.many a {
      padding: 0 var(--sp-1);
      font-size: var(--fs-tiny);
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
  .pmore {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex: 0 0 auto;
    min-height: 44px;
    min-width: 44px;
    margin-bottom: -1px;
    padding: 0 var(--sp-2);
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-body) / 1.2 var(--font-body);
    white-space: nowrap;
    cursor: pointer;
  }
  .ptabs.many .pmore {
    font-size: var(--fs-label);
    padding: 0 var(--sp-1);
  }
  .ptsheet {
    width: min(440px, calc(100vw - 24px));
  }
  .pt-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-3);
  }
  .pt-head h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .pt-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .pt-hint {
    margin: var(--sp-1) 0 var(--sp-3);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .pt-list {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .pt-list li {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    min-height: 48px;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .pt-list a {
    flex: 1;
    min-height: 44px;
    display: flex;
    align-items: center;
    color: var(--ink);
    font-weight: 500;
    text-decoration: none;
  }
  .pt-list a[aria-current='page'] {
    font-weight: 700;
  }
  .pt-tab {
    color: var(--ink-3);
    font-size: var(--fs-tiny);
  }
  .pt-foot {
    margin: var(--sp-3) 0 0;
  }
</style>
