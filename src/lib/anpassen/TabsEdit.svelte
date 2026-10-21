<script>
  /**
   * «Anpassen» 2a + 3a + 4a (Noah 20.10.2026): the tabs of a place: show, hide, rename and sort them
   * (the order is the one of «Mehr», nav.js setTabOrder), and which tab the place opens with.
   */
  import { t } from '../i18n.svelte.js';
  import { orderedTabs, setTabOrder } from '../nav.js';
  import { setTabHidden, setTabName, setStartTab, tabCfg, moved } from '../anpassen.js';
  import { anp, change, tabLabel } from '../anpassen.svelte.js';
  import EditRows from './EditRows.svelte';

  let { place } = $props();

  const all = $derived((void anp.v, orderedTabs(place)));
  const cfg = $derived((void anp.v, tabCfg(anp.cfg, place)));
  const visible = $derived(all.filter((x) => !cfg.hide.includes(x.key)));
  // the last tab shown cannot be hidden
  const rows = $derived(all.map((x) => ({ key: x.key, label: tabLabel(place, x), orig: t(x.label), hidden: cfg.hide.includes(x.key), locked: visible.length <= 1 && !cfg.hide.includes(x.key) })));

  function move(from, to) {
    setTabOrder(place, moved(all.map((x) => x.key), from, to));
    anp.v++; // the order lives in nav.js; the tabs redraw with anp.v
  }
  function hide(key, hidden) {
    change((c) => setTabHidden(c, place, key, hidden));
  }
</script>

<EditRows {rows} label={t('Tabs')} onmove={move} onhide={hide} onrename={(key, name, orig) => change((c) => setTabName(c, place, key, name, orig))} />

<label class="start">
  <span>{t('Opens with')}</span>
  <select value={cfg.start ?? ''} onchange={(e) => change((c) => setStartTab(c, place, e.currentTarget.value))} data-anp-start>
    <option value="">{t('The tab opened last')}</option>
    {#each visible as x (x.key)}<option value={x.key}>{tabLabel(place, x)}</option>{/each}
  </select>
</label>

<style>
  .start {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-2);
    margin-top: var(--sp-3);
  }
  select {
    min-height: 44px;
    max-width: 100%;
    padding: 0 var(--sp-2);
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
</style>
