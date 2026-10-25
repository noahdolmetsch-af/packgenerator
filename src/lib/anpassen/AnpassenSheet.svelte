<script>
  /**
   * «Anpassen» (Noah 20.10.2026 «1a 2a 3a 4a 5a»): the window «Diese Seite anpassen», opened from the
   * line at the end of every page (PageFoot.svelte). Three parts, each only when there is something:
   *   1. the parts of this page (headings): show, hide, rename, sort
   *   2. the tabs of this place: show, hide, rename, sort, and the tab it opens with
   *   3. the menu: show, hide, rename, sort the places
   * «Wie am Anfang» puts this page (and its place's tabs) back, with Undo. Only on this device.
   */
  import { tick } from 'svelte';
  import { X, RotateCcw } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { backClose } from '../ui/backclose.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { ALL_PLACES, PLACE_TABS, setTabOrder, orderedTabs } from '../nav.js';
  import { byOrder, moved, pageCfg, isEmptyPage, setPartHidden, setPartName, setPartOrder, resetPage, resetTabs, withTitle } from '../anpassen.js';
  import { anp, change, restore, placeLabel } from '../anpassen.svelte.js';
  import EditRows from './EditRows.svelte';
  import TabsEdit from './TabsEdit.svelte';
  import MenuEdit from './MenuEdit.svelte';

  let { page, title = '', place = null, getParts, onclose } = $props();

  let dialog;
  let parts = $state.raw([]);
  let menuOpen = $state(false);

  const cfg = $derived((void anp.v, pageCfg(anp.cfg, page)));
  const sorted = $derived(byOrder(parts, cfg.order, (p) => p.key));
  const rows = $derived(sorted.map((p) => ({ key: p.key, label: cfg.names[p.key] ?? p.label, orig: p.label, hidden: cfg.hide.includes(p.key) })));
  const hasTabs = $derived(!!place && (PLACE_TABS[place]?.length ?? 0) > 1);
  const placeObj = $derived(ALL_PLACES.find((p) => p.key === place));
  const changed = $derived((void anp.v, !isEmptyPage(cfg) || (hasTabs && !!anp.cfg.tabs[place])));

  $effect(() => {
    parts = getParts?.() ?? [];
    dialog.showModal();
  });

  /** Change this page, keep its name for the list under Darstellung, then read the parts again. */
  async function edit(fn) {
    change((c) => withTitle(fn(c), page, title));
    await tick();
    requestAnimationFrame(() => (parts = getParts?.() ?? parts));
  }

  function reset() {
    const before = anp.cfg;
    const tabOrder = hasTabs ? orderedTabs(place).map((x) => x.key) : null;
    change((c) => {
      let n = resetPage(c, page);
      if (hasTabs) n = resetTabs(n, place);
      return n;
    });
    if (hasTabs) setTabOrder(place, null);
    requestAnimationFrame(() => (parts = getParts?.() ?? parts));
    offerDone(t('This page is back as at the start.'), () => {
      if (tabOrder) setTabOrder(place, tabOrder);
      restore(before);
      requestAnimationFrame(() => (parts = getParts?.() ?? parts));
    });
  }
</script>

<dialog class="sheet from-below anp" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="anp-h" data-anp-sheet>
  <div class="head">
    <h2 id="anp-h">{t('Customise this page')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="hint">{t('Show, hide, rename and sort. Only on this device; nothing is deleted. «As at the start» puts everything back.')}</p>

  <section aria-labelledby="anp-parts">
    <h3 id="anp-parts">{t('Parts of this page')}</h3>
    {#if rows.length}
      <EditRows
        {rows}
        label={t('Parts of this page')}
        onmove={(from, to) => edit((c) => setPartOrder(c, page, moved(sorted.map((p) => p.key), from, to)))}
        onhide={(key, hidden) => edit((c) => setPartHidden(c, page, key, hidden))}
        onrename={(key, name, orig) => edit((c) => setPartName(c, page, key, name, orig))}
      />
    {:else}
      <p class="none">{t('This page has no parts with a heading to sort. Its tabs and the menu can still be changed below.')}</p>
    {/if}
  </section>

  {#if hasTabs}
    <section aria-labelledby="anp-tabs">
      <h3 id="anp-tabs">{t('Tabs of {place}', { place: placeObj ? placeLabel(placeObj) : '' })}</h3>
      <p class="sub">{t('A hidden tab stays reachable through the search.')}</p>
      <TabsEdit {place} />
    </section>
  {/if}

  <section aria-labelledby="anp-menu">
    <h3 id="anp-menu">
      <button type="button" class="fold" aria-expanded={menuOpen} onclick={() => (menuOpen = !menuOpen)}>{t('Menu')}</button>
    </h3>
    {#if menuOpen}
      <p class="sub">{t('The places at the bottom of a phone and on the left of a computer. Today always stays.')}</p>
      <MenuEdit />
    {/if}
  </section>

  <div class="foot">
    {#if changed}
      <button type="button" class="btn" onclick={reset} data-anp-reset><RotateCcw size={16} aria-hidden="true" />{t('As at the start')}</button>
    {/if}
    <a class="btn btn-link" href="#/me/look" onclick={() => dialog.close()}>{t('All changes: Me › Appearance')}</a>
  </div>
</dialog>

<style>
  .anp {
    width: min(520px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-3);
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  h3 {
    margin: var(--sp-4) 0 var(--sp-2);
    font-size: var(--fs-body);
  }
  .x {
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
  .hint,
  .sub,
  .none {
    margin: var(--sp-1) 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .fold {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }
  .fold::after {
    content: '›';
    margin-left: auto;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .fold[aria-expanded='true']::after {
    transform: rotate(90deg);
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    margin-top: var(--sp-4);
  }
  .foot .btn {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-1);
  }
</style>
