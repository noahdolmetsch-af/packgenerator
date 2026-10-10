<script>
  /**
   * v0.71.0 «Fünf Orte» 1 (Noah 10.10.2026, O1.1a): on a computer the places live in a sidebar on the
   * left: the logo, the search and «Ich», the orange «+ Neu», then the five places, each with its
   * pages (nav.js PLACE_TABS; release 2 makes them tabs on top). The chosen place shows in its colour.
   */
  import { PLACES, PLACE_TABS, tabOf } from '../nav.js';
  import { t } from '../i18n.svelte.js';
  import Search from './Search.svelte';
  import MeButton from './MeButton.svelte';
  import PlaceIcon from './PlaceIcon.svelte';
  import { Plus } from '@lucide/svelte';

  let { place = null, hash = '#/', due = 0, inbox = 0, onnew, shownew = true } = $props();
</script>

<aside class="side" aria-label={t('Places')}>
  <div class="in">
    <a class="logo" href="#/" aria-label={t('Pack Generator, start page')}>Pack Generator</a>
    <div class="srow">
      <Search short />
      <MeButton {inbox} current={place === 'me'} />
    </div>
    {#if shownew}
      <button type="button" class="newbtn" onclick={onnew} aria-haspopup="dialog" aria-keyshortcuts="n">
        <Plus size={20} strokeWidth={2.6} aria-hidden="true" /><span>{t('New')}</span><kbd aria-hidden="true">N</kbd>
      </button>
    {/if}
    <nav class="places" aria-label={t('Sections')}>
      <ul>
        {#each PLACES as p (p.key)}
          {@const tabs = PLACE_TABS[p.key] ?? []}
          {@const on = place === p.key}
          {@const tab = on ? tabOf(p.key, hash) : null}
          <li class="pl" class:on data-place={p.key}>
            <!-- the place of the page: «page» when none of its pages is lit (a trip), else «true» -->
            <a class="pa" href={p.href} aria-current={on ? (tab && tabs.length > 1 ? 'true' : 'page') : undefined}>
              <span class="pi"><PlaceIcon place={p.key} size={18} /></span>
              <span class="pn">{t(p.label)}</span>
              {#if p.key === 'bikes' && due}<span class="cnt num"><span class="sr">, {t('{n} due', { n: due })}</span><span aria-hidden="true">{due}</span></span>{/if}
            </a>
            {#if tabs.length > 1}
              <ul class="tabs">
                {#each tabs as x (x.key)}
                  <li><a href={x.href} class:cur={tab === x.key} aria-current={tab === x.key ? 'page' : undefined}>{t(x.label)}</a></li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</aside>

<style>
  .side {
    background: var(--brand);
    color: var(--brand-ink);
  }
  .in {
    position: sticky;
    top: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: var(--sp-4) var(--sp-3) var(--sp-3);
    box-sizing: border-box;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 6px var(--sp-2);
    font: 900 var(--fs-section) / 1 var(--font-brand);
    color: var(--hi-bright);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-decoration: none;
  }
  .srow {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    margin-bottom: var(--sp-3);
  }
  .srow :global(.search) {
    flex: 1;
    min-width: 0;
  }
  .srow :global(.search .field) {
    width: 100%;
  }
  .newbtn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 44px;
    margin-bottom: var(--sp-4);
    padding: 0 var(--sp-3);
    border: 0;
    border-radius: 10px;
    background: var(--hi);
    color: var(--hi-ink);
    font: 700 var(--fs-sub) var(--font-body);
    cursor: pointer;
  }
  .newbtn:hover {
    background: var(--hi-hover);
  }
  .newbtn span {
    flex: 1;
    text-align: left;
  }
  kbd {
    padding: 1px 6px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font: 500 var(--fs-tiny) / 1.4 var(--font-body);
    opacity: 0.85;
  }
  .places {
    flex: 1;
    min-height: 0;
    margin: 0 calc(-1 * var(--sp-3));
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
    padding: 0 10px;
    border-radius: 9px;
    color: var(--brand-ink);
    font: 500 var(--fs-sub) var(--font-body);
    text-decoration: none;
  }
  .pa:hover {
    background: var(--side-row);
  }
  .pi {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: var(--side-row);
    color: var(--brand-ink-2);
  }
  .pn {
    flex: 1;
  }
  .on > .pa {
    background: var(--side-row);
    font-weight: 700;
  }
  .on .pi {
    background: var(--pc);
    color: var(--pc-ink);
  }
  .cnt {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--hi);
    color: var(--hi-ink);
    font: 700 var(--fs-tiny) / 1.67 var(--font-body);
    text-align: center;
  }
  .tabs {
    margin: 2px 0 var(--sp-2) 25px;
    padding-left: var(--sp-3);
    border-left: 1px solid var(--side-line);
  }
  .tabs a {
    display: flex;
    align-items: center;
    min-height: 32px;
    padding: 0 10px;
    border-radius: 6px;
    color: var(--brand-ink-2);
    font: 400 var(--fs-body) var(--font-body);
    text-decoration: none;
  }
  .tabs a:hover {
    background: var(--side-row);
    color: var(--brand-ink);
  }
  .tabs a.cur {
    background: var(--side-row);
    color: var(--brand-ink);
    font-weight: 700;
    box-shadow: inset 3px 0 0 var(--pc);
  }
  .side :global(:focus-visible) {
    outline-color: var(--focus-on-dark);
  }
</style>
