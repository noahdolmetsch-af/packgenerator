<script>
  /**
   * «Mehr Ideen» (Noah 23.11.2026 «2b»): the window behind the row «Heute entdecken» on Heute. Up to three ideas, each
   * with its «Warum», «Ansehen», «Später» and «Nicht für mich» (both with Undo), a switch that takes the row away
   * (it comes back with the same switch here under «Heute anpassen») and the way to the map of the app («Noch nie
   * geöffnet: n von m»). Only a suggestion.
   */
  import { X } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { SHOWN } from './ideen.js';
  import { t } from '../i18n.svelte.js';
  import '../bikes/velo-dlg.css';

  let { ideas = [], words, tried = 0, total = 0, off = false, onview, onlater, onnot, onoff, onclose } = $props();
  const list = $derived(ideas.slice(0, SHOWN));
  let dialog;
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal();
  });
  const view = (x) => {
    dialog.close();
    onview(x);
  };
</script>

<dialog class="sheet vdlg ids" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="ids-h" data-ideas-sheet>
  <div class="vd-head">
    <div class="vd-t">
      <h2 id="ids-h">{t('More ideas')}</h2>
      <p class="vd-sub">{t('The app looks at what you do and what you have not opened yet. Everything here is only a suggestion.')}</p>
    </div>
    <button type="button" class="vd-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if list.length}
    <ul class="ideas">
      {#each list as x (x.id)}
        {@const w = words(x)}
        <li data-idea-item={x.id}>
          <h3>{w.title}</h3>
          {#if w.text}<p class="tx">{w.text}</p>{/if}
          <p class="why">{w.why}</p>
          <p class="acts">
            <button type="button" class="btn sm hi" onclick={() => view(x)} data-idea-item-go>{w.label}</button>
            <button type="button" class="btn btn-link" onclick={() => onlater(x)} data-idea-item-later>{t('Later|discover')}</button>
            <button type="button" class="btn btn-link" onclick={() => onnot(x)} data-idea-item-not>{t('Not for me|discover')}</button>
          </p>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="hint" data-ideas-none>{t('No more ideas for today. Tomorrow there are new ones.')}</p>
  {/if}

  <p class="map" data-ideas-map>{t('Never opened: {n} of {total}.', { n: Math.max(0, total - tried), total })} <a href="#/me/karte" onclick={() => dialog.close()}>{t('See the map of the app')}</a></p>
  <label class="ids-sw">
    <input type="checkbox" role="switch" checked={!off} onchange={(e) => onoff(!e.currentTarget.checked)} data-ideas-switch />
    <span>{t('Show «Discover today» under the chips')}</span>
  </label>

  <div class="vd-foot">
    <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done|customise')}</button>
  </div>
</dialog>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  h3 {
    margin: 0;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .tx,
  .why,
  .hint,
  .map {
    margin: 2px 0 0;
    overflow-wrap: break-word;
  }
  .why,
  .hint,
  .map {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 8px 0 0;
  }
  .map {
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .ids-sw {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    cursor: pointer;
  }
</style>
