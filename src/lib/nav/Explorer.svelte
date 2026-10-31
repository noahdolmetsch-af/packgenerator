<script>
  /**
   * «Pfad auf jeder Seite» Schritt 3, Explorer mode (Noah 28.10.2026 «1a und c und d alle»): while it is on, a tap on a
   * tile that has an «i» does not open the tile but opens the sheet «Where does this come from?». A bar at the top
   * says so and switches it off. Everything else (tabs, buttons outside tiles, the «i» itself) works as always.
   */
  import { onMount } from 'svelte';
  import { Compass } from '@lucide/svelte';
  import { t } from '../i18n.svelte.js';
  import { setOp } from '../bedienung.svelte.js';

  // the nearest ancestor of the tap that holds exactly one «i»: that is the tile
  function tileMark(target) {
    const main = document.querySelector('main');
    for (let el = target; el && el !== main && el !== document.body; el = el.parentElement) {
      const marks = el.querySelectorAll('[data-info-open]');
      if (marks.length === 1) return marks[0];
      if (marks.length > 1) return null;
    }
    return null;
  }

  function onTap(e) {
    const target = e.target;
    if (!(target instanceof Element) || !target.closest('main')) return;
    if (target.closest('[data-info-open], [data-explorer], dialog')) return;
    const mark = tileMark(target);
    if (!mark) return;
    e.preventDefault();
    e.stopPropagation();
    mark.click();
  }

  onMount(() => {
    document.addEventListener('click', onTap, true);
    document.documentElement.dataset.explore = '1';
    return () => {
      document.removeEventListener('click', onTap, true);
      delete document.documentElement.dataset.explore;
    };
  });
</script>

<div class="bar" role="status" data-explorer>
  <Compass size={16} aria-hidden="true" />
  <span class="tx">{t('Explorer mode is on: tap a tile to see where it comes from.')}</span>
  <button type="button" class="off" onclick={() => setOp('explore', false)} data-explorer-off>{t('Switch off')}</button>
</div>

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-small) / 1.3 var(--font-body);
  }
  .tx {
    flex: 1 1 0;
    min-width: 0;
  }
  .off {
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid currentColor;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
  /* in the mode, the small «i» of a tile shows which tiles can explain themselves */
  :global(html[data-explore] .idot) {
    color: var(--badge-ink);
    outline: 2px dashed var(--badge-ink);
    outline-offset: 2px;
  }
</style>
