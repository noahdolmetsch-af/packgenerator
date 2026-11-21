<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, O1.1a): on a computer the places live in a sidebar on the
   * left, each with its pages (nav.js PLACE_TABS).
   * v0.98.0 Design-Refresh R2 (G4/G5 A★, Noah 11.10 23:10): the sidebar is light: the logo with its
   * mark, «+ Neu», the search, the five places with plain icons (the chosen one on a soft row, its pages
   * under it with a line), and «Ich» as a card at the bottom.
   * «Ganze App neu denken» Schritt 10 (Noah 18.11.2026): seven places and «Ich»; Ausrüstung is the tab «Sets» of Material,
   * Quick Links stands under Heute, Inspiration is a tab of Touren (nav.js SIDE_PLACES, sidePlaceOf).
   */
  import { menuSide, shownTabs, tabOf, placeHref, sidePlaceOf } from '../nav.js';
  import { anp, placeLabel, tabLabel } from '../anpassen.svelte.js'; // «Anpassen» 2a + 3a: your menu, tabs and names
  import { t } from '../i18n.svelte.js';
  import LogoMark from '../logo/LogoMark.svelte'; // «Jahreszeit» (Idee 30)
  import Search from './Search.svelte';
  import HelpButton from './HelpButton.svelte';
  import MeButton from './MeButton.svelte';
  import PlaceIcon from './PlaceIcon.svelte';
  import { Plus, MessageCircle, ChevronDown } from '@lucide/svelte';
  import { countClick, readHint, writeHint, keysOf } from './keyhint.js'; // Einzelidee 31: one shortcut at a time

  let { place = null, hash = '#/', due = 0, inbox = 0, onnew, shownew = true } = $props();
  const sidePlaces = $derived((void anp.v, menuSide()));
  // «Ganze App neu denken» Schritt 10: the row that is lit for the page (Ausrüstung → Material, Quick Links → Heute)
  const lit = $derived(sidePlaceOf(place));
  const QUICK_TAB = { key: 'quick', label: 'Quick Links|place', href: '#/quick' };
  // Einzelidee 31 «Tastenkürzel nach und nach»: after a few mouse clicks on the same place, its shortcut once
  let hint = $state(null); // { key, name }
  // UI-Test T11 (G4-11): the list of places scrolls above «Ich». A soft edge says there is more, and the
  // place of the page scrolls into view, so «Material» is never hidden behind the open «Velos»
  let placesEl = $state(null);
  let more = $state({ up: false, down: false });
  const edges = () => {
    const el = placesEl;
    if (!el) return;
    more = { up: el.scrollTop > 2, down: el.scrollTop + el.clientHeight < el.scrollHeight - 2 };
  };
  $effect(() => {
    void place, hash;
    const el = placesEl;
    if (!el) return;
    queueMicrotask(() => {
      const cur = el.querySelector('.tabs [aria-current="page"]') ?? el.querySelector('.pl.on');
      if (cur && typeof cur.scrollIntoView === 'function') cur.scrollIntoView({ block: 'nearest' });
      edges();
    });
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(edges) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  });
  function clicked(e, key, name) {
    if (!e.detail) return; // a keyboard «Enter» has detail 0: only mouse clicks count
    const r = countClick(readHint(), key);
    writeHint(r.state);
    if (r.hint) hint = { key: r.hint, name };
  }
  function noTips() {
    writeHint({ ...readHint(), off: true });
    hint = null;
  }
</script>

<aside class="side" aria-label={t('Places')}>
  <div class="in">
    <a class="logo" href="#/" aria-label={t('Pack Generator, start page')}><span class="mark" aria-hidden="true"><LogoMark /></span><span>Pack Generator</span></a>
    {#if shownew}
      <button type="button" class="newbtn" onclick={(e) => (clicked(e, 'new', t('New')), onnew?.(e))} aria-haspopup="dialog" aria-keyshortcuts="n">
        <Plus size={20} strokeWidth={2.4} aria-hidden="true" /><span>{t('New')}</span><kbd aria-hidden="true">N</kbd>
      </button>
    {/if}
    <div class="srow">
      <Search short />
    </div>
    <!-- «Assistent» (Noah 15.10.2026 «3 a und b»): its own button, under the search -->
    <!-- Durchklick 08.11.2026 (Fund 2): «Assistant» and «Help» share one row, so the places keep one more row on a laptop -->
    <div class="pair">
      <a class="asst" href="#/assistent" aria-current={hash.startsWith('#/assistent') ? 'page' : undefined}><MessageCircle size={18} aria-hidden="true" /><span>{t('Assistant')}</span></a>
      <!-- «Alles finden 2» (Noah 22.10.2026 «3a»): the help of this page, next to the assistant -->
      <HelpButton wide />
    </div>
    <nav class="places" class:more-up={more.up} class:more-down={more.down} aria-label={t('Sections')} bind:this={placesEl} onscroll={edges}>
      <ul>
        {#each sidePlaces as p (p.key)}
          {@const on = lit === p.key}
          <!-- Schritt 10 (Z1): Quick Links is no row of its own; under Heute it is one line, while you are on Heute or in Quick Links -->
          {@const tabs = p.key === 'today' ? (on ? [QUICK_TAB] : []) : (void anp.v, shownTabs(p.key, place === p.key ? hash : ''))}
          {@const tab = on ? (p.key === 'today' ? (place === 'quick' ? QUICK_TAB.key : null) : tabOf(p.key, hash)) : null}
          <li class="pl" class:on data-place={p.key}>
            <!-- the place of the page: «page» when none of its pages is lit (a trip), else «true» -->
            <a class="pa" href={(void anp.v, placeHref(p, lit, hash))} onclick={(e) => p.letter && clicked(e, p.letter, placeLabel(p))} aria-current={on ? (tab && (tabs.length > 1 || p.key === 'today') ? 'true' : 'page') : undefined}>
              <span class="pi"><PlaceIcon place={p.key} size={20} /></span>
              <span class="pn">{placeLabel(p)}</span>
              {#if p.key === 'bikes' && due}<span class="cnt due num"><span class="sr">, {t('{n} due', { n: due })}</span><span aria-hidden="true">{due}</span></span>{/if}
            </a>
            {#if on && (tabs.length > 1 || p.key === 'today') && tabs.length}
              <ul class="tabs">
                {#each tabs as x (x.key)}
                  <li><a href={x.href} class:cur={tab === x.key} aria-current={tab === x.key ? 'page' : undefined}>{tabLabel(p.key, x)}</a></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>
    <!-- Durchklick 08.11.2026 (Fund 2): the soft edge alone was easy to miss; a visible «More places» says the list goes on.
         UI-Test Training 17.11.2026 (Fund 10): its own row under the list, so it no longer covers the last place on a laptop -->
    {#if more.down}
      <button type="button" class="moredn" onclick={() => placesEl?.scrollBy({ top: Math.max(120, placesEl.clientHeight * 0.7), behavior: 'smooth' })} data-menu-more>
        <ChevronDown size={16} aria-hidden="true" /><span>{t('Show more places')}</span>
      </button>
    {/if}
    {#if hint}
      <div class="khint" role="status" data-key-hint={hint.key}>
        <p>{t('Faster with the keyboard:')} {#each keysOf(hint.key) as k, i (i)}{#if i}{' '}{t('then|keys')}{' '}{/if}<kbd>{k}</kbd>{/each} {t('opens {name}.', { name: hint.name })} {t('«?» shows all shortcuts.')}</p>
        <div class="kh-b">
          <button type="button" class="btn sm" onclick={() => (hint = null)}>{t('OK')}</button>
          <button type="button" class="btn sm btn-link" onclick={noTips}>{t('No more shortcut tips')}</button>
        </div>
      </div>
    {/if}
    <MeButton {inbox} current={place === 'me'} card />
  </div>
</aside>

<style>
  .side {
    border-right: 1px solid var(--line);
    background: var(--paper);
    color: var(--ink);
  }
  .in {
    position: sticky;
    top: 0;
    /* v0.101.0: above the tiles of the page, so the search results open over them */
    z-index: 6;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    height: 100vh;
    padding: var(--sp-4) var(--sp-3) var(--sp-3);
    box-sizing: border-box;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 6px;
    color: var(--ink);
    font: 600 var(--fs-body) / 1 var(--font-brand);
    text-decoration: none;
  }
  .mark {
    position: relative; /* the season drawing of «PG» (Idee 30) sits in its corner */
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--brand);
    color: var(--brand-ink);
    font: 700 var(--fs-small) / 1 var(--font-brand);
    letter-spacing: 0.02em;
  }
  .srow :global(.search) {
    width: 100%;
  }
  .srow :global(.search .field) {
    width: 100%;
  }
  .newbtn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    width: 100%;
    min-height: 44px;
    padding: 0 var(--sp-3);
    border: 0;
    border-radius: 10px;
    background: var(--hi);
    color: var(--hi-ink);
    font: 600 var(--fs-body) var(--font-body);
    cursor: pointer;
  }
  .newbtn:hover {
    background: var(--hi-hover);
  }
  kbd {
    padding: 0 5px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font: 500 var(--fs-tiny) / 1.4 var(--font-body);
    opacity: 0.7;
  }
  .khint {
    margin-top: auto;
    padding: 10px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 12px;
    background: var(--accent-soft, var(--paper));
    font-size: var(--fs-small);
  }
  .khint p {
    margin: 0 0 6px;
  }
  .kh-b {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .pair {
    display: flex;
    gap: var(--sp-1);
    margin-top: var(--sp-1);
  }
  .pair :global(.hrow) {
    width: auto;
    flex: 1 1 0;
    min-width: 0;
  }
  .asst {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    padding: 8px 12px;
    border-radius: 10px;
    color: var(--ink-2);
    font: 500 var(--fs-body) var(--font-body);
    text-decoration: none;
  }
  .asst:hover,
  .asst[aria-current='page'] {
    background: var(--paper-2);
    color: var(--ink);
  }
  .places {
    flex: 1;
    min-height: 0;
    margin: var(--sp-1) calc(-1 * var(--sp-3)) 0;
    padding: 0 var(--sp-3);
    overflow-y: auto;
  }
  /* a soft edge where the list goes on */
  .places.more-down {
    mask-image: linear-gradient(to bottom, var(--ink) calc(100% - 28px), transparent);
  }
  .places.more-up {
    mask-image: linear-gradient(to top, var(--ink) calc(100% - 28px), transparent);
  }
  .places.more-up.more-down {
    mask-image: linear-gradient(to bottom, transparent, var(--ink) 28px, var(--ink) calc(100% - 28px), transparent);
  }
  .moredn {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
    margin: -4px auto 0;
    padding: 4px 12px 4px 8px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink-2);
    font: 600 var(--fs-small, 13px) var(--font-body);
    cursor: pointer;
  }
  .moredn:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pl {
    margin-bottom: 2px;
  }
  .pa {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-height: 44px;
    padding: 0 var(--sp-3);
    border-radius: 10px;
    color: var(--ink-2);
    font: 500 var(--fs-body) var(--font-body);
    text-decoration: none;
  }
  .pa:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
  .pi {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
  }
  .pn {
    flex: 1;
  }
  .on > .pa {
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
  }
  .cnt {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1.67 var(--font-body);
    text-align: center;
  }
  .tabs {
    margin: 2px 0 6px 44px;
    border-left: 1px solid var(--line);
  }
  .tabs a {
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 0 var(--sp-3);
    color: var(--ink-3);
    font: 400 var(--fs-small) var(--font-body);
    text-decoration: none;
  }
  .tabs a:hover {
    color: var(--ink);
  }
  .tabs a.cur {
    margin-left: -1px;
    box-shadow: inset 2px 0 0 var(--ink);
    color: var(--ink);
    font-weight: 600;
  }
</style>
