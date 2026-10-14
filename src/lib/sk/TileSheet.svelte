<script>
  /**
   * SK «Kacheln anpassen» (SK6 c, SK8): the tiles of one page. Shown tiles move up and down (the moved
   * one is pinned there) and switch off; «Ausgeblendet» with «Wieder zeigen»; «Dazunehmen» the page's
   * other tiles; «Gerade still» the tiles that stepped aside by themselves; «Eigener Link» (SKX5);
   * «Wie am Anfang». With all 7 places full, adding asks first which tile goes (Noah, answer 1 b).
   *
   * page: the page key; name: its name; arr: the arrangement now (tiles.js arrange); state: the stored
   * state; hints; mode: 'add' (from «+») or 'edit'; onchange(fn): changes the state; onclose.
   */
  import { tick } from 'svelte';
  import { X, Info, Plus, Eye, ChevronUp, ChevronDown, Pin, ExternalLink, Link as LinkIc } from '@lucide/svelte';
  import { backClose } from '../ui/backclose.js';
  import { MAX_TILES, needsChoice, moveTile, hideTile, showTile, unpin, addTile, addOwn, resetState } from './tiles.js';
  import { skIcon } from './icons.js';
  import OwnLinkSheet from './OwnLinkSheet.svelte';
  import { t } from '../i18n.svelte.js';

  let { name = '', arr, state: cur, hints = {}, mode = 'edit', onchange, onclose } = $props();

  let dialog;
  let pending = $state(null); // { id } or { own: { url, name } }: waits for «which tile goes»
  let ownOpen = $state(false);
  const shownIds = $derived(arr.sorted.map((d) => d.id));
  const pinned = (id) => Number.isInteger(cur?.pins?.[id]);
  const full = $derived(needsChoice(arr));

  $effect(() => {
    dialog.showModal();
  });

  function add(id) {
    if (full) return (pending = { id });
    onchange((s) => addTile(s, arr, id));
  }
  function goes(id) {
    const p = pending;
    pending = null;
    if (p.own) onchange((s) => addOwn(s, arr, p.own, id));
    else onchange((s) => addTile(s, arr, p.id, id));
    tick().then(() => dialog?.querySelector('h2')?.focus());
  }
  function own(link) {
    if (full) pending = { own: link };
    else onchange((s) => addOwn(s, arr, link));
  }
  const move = (id, by) => onchange((s) => moveTile(s, shownIds, id, shownIds.indexOf(id) + by));
  const label = (d) => (d.own ? d.label : t(d.label));
</script>

{#snippet row(d, extra)}
  {@const Icon = skIcon(d.icon)}
  <span class="sk-ic" aria-hidden="true"><Icon size={18} /></span>
  <span class="sk-m"><span class="sk-n">{label(d)}{#if d.url}<ExternalLink class="sk-ext" size={14} aria-hidden="true" />{/if}{#if extra}{@render extra()}{/if}</span>{#if hints[d.id]?.text || hints[d.id]?.quiet}<span class="sk-s">{hints[d.id]?.text ?? hints[d.id]?.quiet}</span>{/if}</span>
{/snippet}

<dialog class="sheet from-below sk-sheet" bind:this={dialog} use:backClose onclose={() => onclose?.()} aria-labelledby="sk-sheet-h" data-sk-sheet>
  <div class="sk-head">
    <div>
      <h2 id="sk-sheet-h" tabindex="-1">{pending ? t('Which tile makes room?') : t('Adjust tiles')}</h2>
      <p class="sk-ctx">{t('{page} · only for this page', { page: name })}</p>
    </div>
    <button type="button" class="sk-x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>

  {#if pending}
    <!-- Noah 13.10.2026 (answer 1 b): all 7 places are full, so first: which tile goes? -->
    <p class="sk-info" data-sk-choose><Info size={18} aria-hidden="true" /><span>{t('All {n} places are taken. Which tile should make room? It goes to «Hidden» and can come back.', { n: MAX_TILES })}</span></p>
    <ul class="sk-list">
      {#each arr.shown as d (d.id)}
        <li><button type="button" class="sk-pick" data-sk-goes={d.id} onclick={() => goes(d.id)}>{@render row(d)}</button></li>
      {/each}
    </ul>
    <div class="sk-foot"><button type="button" class="btn" onclick={() => (pending = null)}>{t('Cancel')}</button></div>
  {:else}
    {#if mode === 'add' && full}
      <p class="sk-info"><Info size={18} aria-hidden="true" /><span>{t('{n} of {n} places taken. If you add a tile, the app first asks which one should make room.', { n: MAX_TILES })}</span></p>
    {/if}

    {#snippet addSec()}
      {#if arr.extras.length}
        <h3>{t('Add|tiles')}</h3>
        <ul class="sk-list">
          {#each arr.extras as d (d.id)}
            <li>{@render row(d)}<button type="button" class="btn sk-act" data-sk-add={d.id} onclick={() => add(d.id)}><Plus size={16} aria-hidden="true" />{t('Add|tile')}</button></li>
          {/each}
        </ul>
      {/if}
      {#if arr.quiet.length}
        <h3>{t('Quiet right now')}</h3>
        <ul class="sk-list">
          {#each arr.quiet as q (q.tile.id)}
            <li class="sk-still">{@render row(q.tile)}<span class="sk-badge">{t('by itself')}</span></li>
          {/each}
        </ul>
      {/if}
      <h3>{t('Own link')}</h3>
      <ul class="sk-list">
        <li class="sk-ownrow"><span class="sk-ic" aria-hidden="true"><LinkIc size={18} /></span><span class="sk-m"><span class="sk-n">{t('Own link')}</span><span class="sk-s">{t('A page of your choice as a tile, e.g. your bike club. Stays on this device only.')}</span></span><button type="button" class="btn sk-act" data-sk-ownadd onclick={() => (ownOpen = true)}><Plus size={16} aria-hidden="true" />{t('Enter|link')}</button></li>
      </ul>
    {/snippet}

    {#snippet shownSec()}
      <ul class="sk-list">
        {#each arr.sorted as d, i (d.id)}
          <li data-sk-row={d.id} class:sk-over={i >= MAX_TILES}>
            <span class="sk-mv">
              <button type="button" class="sk-ib" aria-label={t('Move {name} up', { name: label(d) })} disabled={i === 0} onclick={() => move(d.id, -1)}><ChevronUp size={18} aria-hidden="true" /></button>
              <button type="button" class="sk-ib" aria-label={t('Move {name} down', { name: label(d) })} disabled={i === arr.sorted.length - 1} onclick={() => move(d.id, 1)}><ChevronDown size={18} aria-hidden="true" /></button>
            </span>
            {#snippet pinMark()}{#if pinned(d.id)}<button type="button" class="sk-pin" aria-label={t('Pinned · let {name} sort by use again', { name: label(d) })} title={t('Pinned|tile')} onclick={() => onchange((s) => unpin(s, d.id))}><Pin size={14} aria-hidden="true" /></button>{/if}{/snippet}
            {@render row(d, pinMark)}
            {#if i >= MAX_TILES}<span class="sk-badge">{t('no room')}</span>{/if}
            <button type="button" class="sk-sw" role="switch" aria-checked="true" data-sk-switch={d.id} aria-label={t('Show {name}', { name: label(d) })} onclick={() => onchange((s) => hideTile(s, d.id))}><span class="sk-knob"></span></button>
          </li>
        {/each}
      </ul>
      {#if arr.hidden.length}
        <h3>{t('Hidden')}</h3>
        <ul class="sk-list">
          {#each arr.hidden as d (d.id)}
            <li>{@render row(d)}<button type="button" class="btn sk-act" data-sk-show={d.id} onclick={() => (full ? (pending = { id: d.id }) : onchange((s) => showTile(s, d.id)))}><Eye size={16} aria-hidden="true" />{t('Show again')}</button></li>
          {/each}
        </ul>
      {/if}
    {/snippet}

    {#if mode === 'add'}
      {@render addSec()}
      <details class="sk-fold">
        <summary>{t('Shown: order and hide {n} tiles', { n: arr.shown.length })}{#if Object.keys(cur?.pins ?? {}).length}<small>{t('{n} pinned', { n: Object.keys(cur.pins).length })}</small>{/if}</summary>
        {@render shownSec()}
      </details>
    {:else}
      <h3>{t('Shown · move with the arrows')}</h3>
      {@render shownSec()}
      {@render addSec()}
    {/if}

    <div class="sk-foot">
      <button type="button" class="sk-tx" data-sk-reset onclick={() => onchange((s) => resetState(s))}>{t('As at the start')}</button>
      <button type="button" class="btn hi" onclick={() => dialog.close()}>{t('Done')}</button>
    </div>
  {/if}
</dialog>

{#if ownOpen}
  <OwnLinkSheet title={t('Own link')} context={t('{page} · as a tile', { page: name })} onsave={own} onclose={() => (ownOpen = false)} />
{/if}

<style>
  .sk-sheet {
    width: min(580px, calc(100vw - 24px));
  }
  .sk-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 8px;
  }
  h2 {
    margin: 0;
    font-size: var(--fs-section);
    outline: none;
  }
  h3 {
    margin: 14px 0 4px;
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .sk-ctx {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sk-x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin: -6px -6px 0 0;
    border: 0;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    cursor: pointer;
  }
  .sk-info {
    display: flex;
    gap: 8px;
    margin: 4px 0 8px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-small);
    line-height: 1.4;
  }
  .sk-info :global(svg) {
    flex: none;
    margin-top: 1px;
  }
  .sk-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sk-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }
  .sk-list li:last-child {
    border-bottom: 0;
  }
  .sk-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .sk-m {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .sk-n {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .sk-n :global(.sk-ext) {
    flex: none;
    color: var(--ink-3);
  }
  .sk-s {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .sk-act {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sk-badge {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--paper-2);
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .sk-still .sk-n {
    color: var(--ink-2);
  }
  .sk-ownrow {
    border: 1px dashed var(--line);
    border-radius: 12px;
    padding: 8px 10px !important;
  }
  .sk-mv {
    display: flex;
    flex-direction: column;
  }
  .sk-ib {
    display: grid;
    place-items: center;
    width: 44px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .sk-ib:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .sk-pin {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink-3);
    cursor: pointer;
  }
  .sk-sw {
    position: relative;
    flex: none;
    width: 56px;
    height: 44px;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .sk-sw::before {
    content: '';
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    height: 28px;
    transform: translateY(-50%);
    border-radius: 99px;
    background: var(--accent);
  }
  .sk-knob {
    position: absolute;
    top: 50%;
    left: 28px;
    width: 20px;
    height: 20px;
    transform: translateY(-50%);
    border-radius: 50%;
    background: var(--paper);
    box-shadow: 0 1px 2px var(--shadow);
  }
  .sk-over .sk-m {
    opacity: 0.6;
  }
  .sk-pick {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 4px 6px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .sk-pick:hover {
    background: var(--paper-2);
  }
  .sk-fold {
    margin-top: 12px;
    border-top: 1px solid var(--line);
  }
  .sk-fold summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    font-weight: 600;
    cursor: pointer;
  }
  .sk-fold summary small {
    margin-left: auto;
    color: var(--ink-3);
    font-weight: 400;
  }
  .sk-foot {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .sk-tx {
    min-height: 44px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 var(--fs-body)/1.3 var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  @media (max-width: 719px) {
    .sk-foot {
      justify-content: space-between;
    }
    .sk-foot :global(.btn.hi) {
      flex: 1;
    }
  }
</style>
