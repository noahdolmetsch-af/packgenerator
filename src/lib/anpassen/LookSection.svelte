<script>
  /**
   * «Anpassen» (Noah 20.10.2026 «1a 2a 5a»): Ich › Darstellung › «Seiten und Menü»: the menu, the pages
   * you changed (each with «As at the start») and «Put everything back», with Undo. Only on this device.
   */
  import { RotateCcw } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import { PLACES, PLACE_TABS, orderedTabs, setTabOrder } from '../nav.js';
  import { empty, resetPage, resetTabs, changeCount, isAllEmpty } from '../anpassen.js';
  import { anp, change, restore, placeLabel } from '../anpassen.svelte.js';
  import MenuEdit from './MenuEdit.svelte';

  const pages = $derived((void anp.v, Object.entries(anp.cfg.pages)));
  const tabPlaces = $derived((void anp.v, Object.keys(anp.cfg.tabs).map((k) => PLACES.find((p) => p.key === k)).filter(Boolean)));
  const count = $derived((void anp.v, changeCount(anp.cfg)));
  // closed at the start: one line on the page, so Darstellung stays short on a phone
  let open = $state(false);

  function resetOne(key, title) {
    const before = anp.cfg;
    change((c) => resetPage(c, key));
    offerDone(t('"{name}" is back as at the start.', { name: title }), () => restore(before));
  }
  function resetPlaceTabs(p) {
    const before = anp.cfg;
    change((c) => resetTabs(c, p.key));
    offerDone(t('"{name}" is back as at the start.', { name: placeLabel(p) }), () => restore(before));
  }
  function resetAll() {
    const before = anp.cfg;
    // the order of the tabs (the «Mehr» window) goes back too
    const orders = Object.fromEntries(Object.keys(PLACE_TABS).map((k) => [k, orderedTabs(k).map((x) => x.key)]));
    change(() => empty());
    for (const k of Object.keys(PLACE_TABS)) setTabOrder(k, null);
    anp.v++;
    offerDone(t('Everything is back as at the start.'), () => {
      for (const [k, keys] of Object.entries(orders)) setTabOrder(k, keys);
      restore(before);
    });
  }
</script>

<section aria-labelledby="look-anp" id="anpassen" data-anp-look>
  <h2 id="look-anp">{t('Pages and menu')}</h2>
  <p class="note">{t('At the end of every page: «Customise this page». There you show, hide, rename and sort its parts and tabs. Only on this device.')}</p>
  <button type="button" class="btn sm" aria-expanded={open} onclick={() => (open = !open)} data-anp-look-open>
    {open ? t('Close') : count ? t('Menu and {n} changes', { n: count }) : t('Change the menu')}
  </button>

  {#if open}
  <h3>{t('Menu')}</h3>
  <p class="note">{t('The places at the bottom of a phone and on the left of a computer. Today always stays.')}</p>
  <MenuEdit />

  {#if pages.length || tabPlaces.length}
    <h3>{t('Pages you changed')}</h3>
    <ul class="chg">
      {#each pages as [key, p] (key)}
        {@const n = p.hide.length + Object.keys(p.names).length + (p.order.length ? 1 : 0)}
        <li>
          <span class="nm"><b>{p.title || key}</b><small>{t('{n} changes|custom', { n })}</small></span>
          <button type="button" class="btn sm" onclick={() => resetOne(key, p.title || key)}><RotateCcw size={14} aria-hidden="true" />{t('As at the start')}</button>
        </li>
      {/each}
      {#each tabPlaces as p (p.key)}
        <li>
          <span class="nm"><b>{t('Tabs of {place}', { place: placeLabel(p) })}</b><small>{t('hidden, renamed or start tab')}</small></span>
          <button type="button" class="btn sm" onclick={() => resetPlaceTabs(p)}><RotateCcw size={14} aria-hidden="true" />{t('As at the start')}</button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if count || !isAllEmpty(anp.cfg)}
    <p class="all"><button type="button" class="btn" onclick={resetAll} data-anp-reset-all><RotateCcw size={16} aria-hidden="true" />{t('Put everything back')}</button></p>
  {/if}
  {/if}
</section>

<style>
  h3 {
    margin: var(--sp-4) 0 var(--sp-1);
    font-size: var(--fs-body);
  }
  .note {
    margin: var(--sp-1) 0 var(--sp-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .chg {
    display: grid;
    gap: var(--sp-1);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chg li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    min-height: 52px;
    padding: 6px var(--sp-3);
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
  }
  .nm {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  small {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .all {
    margin: var(--sp-3) 0 0;
  }
</style>
