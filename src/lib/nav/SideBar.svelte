<script>
  /**
   * v0.76.0 «Fünf Orte» 1 (Noah 10.10.2026, O1.1a): on a computer the places live in a sidebar on the
   * left, each with its pages (nav.js PLACE_TABS).
   * v0.98.0 Design-Refresh R2 (G4/G5 A★, Noah 11.10 23:10): the sidebar is light: the logo with its
   * mark, «+ Neu», the search, the five places with plain icons (the chosen one on a soft row, its pages
   * under it with a line), and «Ich» as a card at the bottom.
   * AU1 (Noah 15.10.2026 «5b»): «Ausrüstung» is its own row under Velos (nav.js SIDE_PLACES).
   */
  import { menuSide, shownTabs, tabOf, placeHref } from '../nav.js';
  import { anp, placeLabel, tabLabel } from '../anpassen.svelte.js'; // «Anpassen» 2a + 3a: your menu, tabs and names
  import { t } from '../i18n.svelte.js';
  import Search from './Search.svelte';
  import HelpButton from './HelpButton.svelte';
  import MeButton from './MeButton.svelte';
  import PlaceIcon from './PlaceIcon.svelte';
  import { Plus, Compass, MessageCircle } from '@lucide/svelte';
  import { localDay } from '../localday.js';

  let { place = null, hash = '#/', due = 0, inbox = 0, onnew, shownew = true } = $props();
  const sidePlaces = $derived((void anp.v, menuSide()));
  // «Inspiration» UC2-1 (mockup): an entry under the five places, with «neu» until it was opened once
  const INSP_SEEN = 'insp.seen';
  const insp = $derived((hash || '').startsWith('#/inspiration'));
  // Impeccable Runde 2: the «neu» also goes after 14 days from the first time it showed, opened or not
  const INSP_SINCE = 'insp.newSince';
  const NEW_DAYS = 14;
  let first = false;
  try {
    first = !!localStorage.getItem(INSP_SEEN);
    if (!first) {
      const today = localDay();
      const since = localStorage.getItem(INSP_SINCE);
      if (!since) localStorage.setItem(INSP_SINCE, today);
      else if (Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${since}T12:00:00Z`)) / 864e5) >= NEW_DAYS) first = true;
    }
  } catch {
    /* private mode: the «neu» stays */
  }
  let seen = $state(first);
  $effect(() => {
    if (!insp || seen) return;
    seen = true;
    try {
      localStorage.setItem(INSP_SEEN, '1');
    } catch {
      /* private mode */
    }
  });
</script>

<aside class="side" aria-label={t('Places')}>
  <div class="in">
    <a class="logo" href="#/" aria-label={t('Pack Generator, start page')}><span class="mark" aria-hidden="true">PG</span><span>Pack Generator</span></a>
    {#if shownew}
      <button type="button" class="newbtn" onclick={onnew} aria-haspopup="dialog" aria-keyshortcuts="n">
        <Plus size={20} strokeWidth={2.4} aria-hidden="true" /><span>{t('New')}</span><kbd aria-hidden="true">N</kbd>
      </button>
    {/if}
    <div class="srow">
      <Search short />
    </div>
    <!-- «Assistent» (Noah 15.10.2026 «3 a und b»): its own button, under the search -->
    <a class="asst" href="#/assistent" aria-current={hash.startsWith('#/assistent') ? 'page' : undefined}><MessageCircle size={18} aria-hidden="true" /><span>{t('Assistant')}</span></a>
    <!-- «Alles finden 2» (Noah 22.10.2026 «3a»): the help of this page, under the assistant -->
    <HelpButton wide />
    <nav class="places" aria-label={t('Sections')}>
      <ul>
        {#each sidePlaces as p (p.key)}
          {@const tabs = (void anp.v, shownTabs(p.key, place === p.key ? hash : ''))}
          {@const on = place === p.key}
          {@const tab = on ? tabOf(p.key, hash) : null}
          <li class="pl" class:on data-place={p.key}>
            <!-- the place of the page: «page» when none of its pages is lit (a trip), else «true» -->
            <a class="pa" href={(void anp.v, placeHref(p, place, hash))} aria-current={on ? (tab && tabs.length > 1 ? 'true' : 'page') : undefined}>
              <span class="pi"><PlaceIcon place={p.key} size={20} /></span>
              <span class="pn">{placeLabel(p)}</span>
              {#if p.key === 'bikes' && due}<span class="cnt due num"><span class="sr">, {t('{n} due', { n: due })}</span><span aria-hidden="true">{due}</span></span>{/if}
            </a>
            {#if on && tabs.length > 1}
              <ul class="tabs">
                {#each tabs as x (x.key)}
                  <li><a href={x.href} class:cur={tab === x.key} aria-current={tab === x.key ? 'page' : undefined}>{tabLabel(p.key, x)}</a></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
      <ul class="extra">
        <li class:on={insp}>
          <a class="pa" href="#/inspiration" aria-current={insp ? 'page' : undefined}>
            <span class="pi"><Compass size={20} aria-hidden="true" /></span>
            <span class="pn">{t('Inspiration')}</span>
            {#if !seen}<span class="newp">{t('new|badge')}</span>{/if}
          </a>
        </li>
      </ul>
    </nav>
    <MeButton {inbox} current={place === 'me' && !insp} card />
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
  .asst {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-top: var(--sp-1);
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
  /* «Inspiration»: below the places, after a quiet line */
  .extra {
    margin-top: var(--sp-2);
    padding-top: var(--sp-2);
    border-top: 1px solid var(--line);
  }
  .newp {
    padding: 0 6px;
    border-radius: 6px;
    background: var(--warn-soft);
    color: var(--ink);
    font: 600 var(--fs-tiny) / 1.6 var(--font-body);
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
