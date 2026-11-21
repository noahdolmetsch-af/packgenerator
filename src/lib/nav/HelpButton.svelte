<script>
  /**
   * «Alles finden 2» (Noah 22.10.2026 «3a»): one «?» at the top of every page. It opens the help of the page you
   * are on (what it is for, typical situations, how to use it, what the app can do here) and leads to the one
   * help place «Help and functions» (#/features). The page says which page it is through pageinfo/here.svelte.js.
   * Since 09.11.2026 (Noah «ja, 1-3», Durchklick-Fund 1) the content of the old card «What you can do here» (each function of the page
   * with what for, «Good to know», «How it works») stands here too, so the «?» is full on every page; on Heute it has a text of its
   * own. The one line behind the page's title (ui/SeitenInhalt.svelte) opens this window (event pg:help).
   * wide: the row in the sidebar on a computer (with its word); else the round icon in the phone's top bar.
   */
  import { CircleQuestionMark, X, ChevronRight, BookOpen, Search as SearchIcon } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { helpHere } from '../pageinfo/here.svelte.js';
  import { canRows } from '../pageinfo.js';
  import { backClose } from '../ui/backclose.js';
  import HintCard from '../pageinfo/HintCard.svelte';
  import SeitenInhaltListe from '../ui/SeitenInhaltListe.svelte';
  import { helpRows, pagePattern } from '../seiteninhalt.js';
  import { loadWissen } from '../wissen/load.js';
  import { loadHandbook } from '../handbook/load.js';
  import { onMount } from 'svelte';

  let { wide = false } = $props();
  let dlg = $state();
  let btn = $state();
  let open = $state(false);
  const hash = $derived(helpHere.route);
  // the tips and the steps load with the first opening, not at the start (scripts/size-guard.mjs)
  let know = $state({});
  let handbook = $state({});
  let loaded = false;
  const here = $derived(helpRows(hash, know, handbook));
  const key = $derived(pagePattern(hash) || '#/');
  const isHome = $derived(hash === '' || hash === '#/' || hash === '#');
  // what the page's own list adds beyond the functions of the card
  const own = $derived(helpHere.can ? canRows(helpHere.can, helpHere.base).filter((r) => !here.some((x) => x.id === r.id)) : []);
  const rows = $derived(own);
  function show() {
    if (!loaded) {
      loaded = true;
      loadWissen().then((w) => (know = w));
      loadHandbook().then((h) => (handbook = h.HANDBOOK));
    }
    open = true;
    dlg?.showModal();
  }
  onMount(() => {
    // the line behind a page's title opens the window; the phone's «?» and the computer's sidebar row both listen: only the visible one answers
    const onHelp = () => {
      if (btn?.getClientRects().length && !dlg?.open) show();
    };
    window.addEventListener('pg:help', onHelp);
    return () => {
      window.removeEventListener('pg:help', onHelp);
    };
  });
  function close() {
    dlg?.close();
  }
  function search() {
    close();
    window.dispatchEvent(new Event('pg:search'));
  }
</script>

{#if wide}
  <button type="button" class="hrow" aria-haspopup="dialog" onclick={show} bind:this={btn} data-help-open><CircleQuestionMark size={18} aria-hidden="true" /><span>{t('Help|nav')}</span></button>
{:else}
  <button type="button" class="hic" aria-label={t('Help for this page')} aria-haspopup="dialog" onclick={show} bind:this={btn} data-help-open><CircleQuestionMark size={22} aria-hidden="true" /></button>
{/if}

<dialog class="sheet from-below hsheet" bind:this={dlg} use:backClose onclose={() => (open = false)} aria-labelledby="help-h" data-help>
  <div class="hhead">
    <h2 id="help-h">{t('Help for this page')}</h2>
    <button type="button" class="hx" aria-label={t('Close')} onclick={close}><X size={20} aria-hidden="true" /></button>
  </div>
  {#if open}
    {#if helpHere.hint}<HintCard page={helpHere.hint} intro={helpHere.intro} only="sheet" />{/if}
    {#if isHome}<p class="lead" data-help-home>{t('Today shows what counts now: your next trip, the weather, what is due and what to pack. Everything else is one tap away in the menu. Hide what you do not need with «Customise this page» at the end of the page.')}</p>{/if}
    {#if here.length}
      <SeitenInhaltListe rows={here} {key} />
    {/if}
    {#if rows.length}
      <p class="jl">{t('What the app can do here')}</p>
      <ul class="can" data-section="can">
        {#each rows as r (r.id)}
          <li><a href={r.href} data-can={r.id} onclick={close}><span><b>{t(r.title)}</b><small>{t(r.sub)}</small></span><ChevronRight size={16} aria-hidden="true" /></a></li>
        {/each}
      </ul>
    {/if}
    {#if !helpHere.hint && !rows.length && !here.length && !isHome}<p class="none">{t('This page has no own help yet. Everything else is in «Help and functions».')}</p>{/if}
    <div class="more">
      <a class="go" href="#/features" onclick={close} data-help-all><b>{t('Help and functions')}</b><small>{t('Everything the app can do, the handbook and how it decides')}</small><ChevronRight size={18} aria-hidden="true" /></a>
      <div class="lks">
        <a href="#/me/handbook" onclick={close}><BookOpen size={16} aria-hidden="true" />{t('Handbook')}</a>
        <button type="button" onclick={search}><SearchIcon size={16} aria-hidden="true" />{t('Search|page')}</button>
      </div>
    </div>
  {/if}
</dialog>

<style>
  .hic {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--ink);
    cursor: pointer;
  }
  .hrow {
    display: flex;
    align-items: center;
    width: 100%;
    gap: var(--sp-2);
    padding: 8px 12px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    font: 500 var(--fs-body) var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .hrow:hover {
    background: var(--paper-2);
    color: var(--ink);
  }
  .hsheet > :global(* + *) {
    margin-top: 12px;
  }
  .hhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .hhead h2 {
    margin: 0;
    font-size: var(--fs-section);
  }
  .hx {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .lead {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .jl {
    margin: 4px 0 0;
    font-size: var(--fs-small);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .can {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .can a {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
    color: var(--ink);
    text-decoration: none;
  }
  .can a span {
    flex: 1;
    display: grid;
    gap: 2px;
  }
  .can small,
  .go small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .none {
    margin: 0;
    color: var(--ink-2);
  }
  .more {
    display: grid;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .go {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 2px 8px;
    min-height: 56px;
    padding: 10px 14px;
    border-radius: 12px;
    background: var(--hi-soft);
    color: var(--ink);
    text-decoration: none;
  }
  .go small {
    grid-column: 1;
  }
  .go :global(svg) {
    grid-row: 1 / span 2;
    grid-column: 2;
  }
  .lks {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
  }
  .lks a,
  .lks button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--hi);
    font: inherit;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }
</style>
