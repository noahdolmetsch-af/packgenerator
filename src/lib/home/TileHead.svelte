<script>
  /**
   * v0.101.0 Design-Refresh P2 (H1): the head of a tile card: the icon in a grey square, the name, a
   * number or word at the right and the «neu» sign for the new tiles. id: the heading's id.
   */
  import { t } from '../i18n.svelte.js';

  let { icon: Icon, title, id, side = '', isnew = false } = $props();
</script>

<div class="th">
  <span class="ico" aria-hidden="true"><Icon size={16} /></span>
  <h2 {id}>{title}</h2>
  {#if side}<span class="sd num">{side}</span>{/if}
  {#if isnew}<span class="nw">{t('new|tile')}</span>{/if}
</div>

<style>
  .th {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    font: 600 var(--fs-body)/1.3 var(--font-body);
    overflow-wrap: break-word;
  }
  .sd {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .nw {
    padding: 0 8px;
    border-radius: 10px;
    background: var(--hi-soft);
    color: var(--badge-ink);
    font: 600 var(--fs-tiny)/1.6 var(--font-body);
  }
</style>
