<script>
  /**
   * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): the one window behind a tapped bar or day. On a phone
   * it comes from below, on a computer it is a window (dialog.sheet, like every sheet of the app). Head with
   * what it is (kicker) and which week or day (title), the content, then «‹ earlier» and «later ›» to walk
   * through the chart without closing. Android back, Escape and ✕ close it.
   */
  import { X, ChevronLeft, ChevronRight } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { t, tn } from '../i18n.svelte.js';

  let { kicker = '', title = '', onclose, onprev = null, onnext = null, prevLabel = '', nextLabel = '', list = [], children } = $props();
  let dialog;
  let showList = $state(false);
  // a new bar starts with the list closed
  $effect(() => {
    title;
    showList = false;
  });

  $effect(() => {
    dialog.showModal();
  });
</script>

<dialog class="sheet from-below csheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} onclick={(e) => e.target === dialog && dialog.close()} aria-labelledby="cs-h" data-chart-sheet>
  <div class="head">
    <div>
      {#if kicker}<p class="kick">{kicker}</p>{/if}
      <h2 id="cs-h">{title}</h2>
    </div>
    <button type="button" class="ib" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <div class="body">
    {@render children()}
    {#if list.length}
      <button type="button" class="btn lbtn" aria-expanded={showList} onclick={() => (showList = !showList)} data-sheet-more>{showList ? t('Hide the units') : tn(list.length, 'See the {n} unit', 'See the {n} units')}</button>
      {#if showList}
        <ul class="ulist" data-sheet-list>
          {#each list as r (r.key)}<li><span class="num">{r.a}</span><span class="nm">{r.b}</span><b class="num">{r.c}</b></li>{/each}
        </ul>
      {/if}
    {/if}
  </div>
  {#if onprev || onnext}
    <div class="nav">
      <button type="button" class="btn" disabled={!onprev} onclick={() => onprev?.()} data-sheet-prev><ChevronLeft size={18} aria-hidden="true" />{prevLabel}</button>
      <button type="button" class="btn" disabled={!onnext} onclick={() => onnext?.()} data-sheet-next>{nextLabel}<ChevronRight size={18} aria-hidden="true" /></button>
    </div>
  {/if}
</dialog>

<style>
  .csheet {
    width: min(460px, calc(100vw - 24px));
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 10px;
  }
  .kick {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  h2 {
    margin: 2px 0 0;
    font-size: var(--fs-section);
  }
  .ib {
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
  .body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .lbtn {
    min-height: 44px;
  }
  .ulist {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
  }
  .ulist li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 10px;
    padding: 7px 0;
    border-top: 1px solid var(--line);
    font-size: var(--fs-small);
  }
  .ulist .nm {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .nav {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .nav .btn {
    min-height: 44px;
  }
</style>
