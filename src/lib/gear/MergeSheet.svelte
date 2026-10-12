<script>
  /**
   * v0.37.1 "Zusammenlegen": merge one item into its counterpart(s). Comes up from below on a phone,
   * centred on a computer. The app proposes up to 3 counterparts (gearimport.js counterparts, badge
   * "Suggestion"), a search finds any other item; several can be chosen (a collection item that became
   * several items). One orange button merges (mergeitems.js); the caller shows "Merged · Undo".
   *
   * item: the item that goes away. items: all items. imported: propose only imported items (sourceId).
   * onmerged(snap, targets): after the merge. onclose(): the sheet closed.
   */
  import { Check, Search, X, Undo2 } from '@lucide/svelte';
  import { db } from '../db.js';
  import { counterparts, fold } from '../gearimport.js';
  import { mergeItems } from './mergeitems.js';
  import { CATEGORY, formatWeight, itemWeight } from '../gear.js';
  import { t, nameOf } from '../i18n.svelte.js';

  let { item, items = [], imported = false, onmerged, onclose } = $props();
  let dialog;
  let q = $state('');
  let busy = $state(false);
  let error = $state('');

  // svelte-ignore state_referenced_locally
  const proposed = counterparts(item, items, { imported });
  // The best proposal is chosen already: Noah only confirms (or picks another one).
  // svelte-ignore state_referenced_locally
  let chosen = $state(proposed.length ? [proposed[0].item.id] : []);
  const byId = $derived(new Map(items.map((i) => [i.id, i])));
  const proposedIds = $derived(new Set(proposed.map((p) => p.item.id)));
  const hay = (i) => fold([nameOf(i), i.name, i.nameDe, i.brand, i.model, i.id].filter(Boolean).join(' '));
  const found = $derived.by(() => {
    const words = fold(q).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return items
      .filter((i) => i.id !== item.id && i.ownership !== 'gone' && !proposedIds.has(i.id) && words.every((w) => hay(i).includes(w)))
      .slice(0, 8);
  });
  // Chosen from the search, shown on top so a choice never disappears while typing.
  const extra = $derived(chosen.filter((id) => !proposedIds.has(id) && !found.some((f) => f.id === id)).map((id) => byId.get(id)).filter(Boolean));

  $effect(() => {
    dialog.showModal();
  });

  const flip = (id) => (chosen = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id]);
  const sub = (i) => [CATEGORY[i.category] ? t(CATEGORY[i.category].name) : i.category, i.sourceId].filter(Boolean).join(' · ');

  async function merge() {
    if (busy || !chosen.length) return;
    busy = true;
    error = '';
    try {
      const snap = await mergeItems(db, item.id, chosen);
      if (!snap) error = t('Nothing was changed.');
      else {
        onmerged?.(snap, chosen.map((id) => byId.get(id)).filter(Boolean));
        dialog.close();
      }
    } catch (err) {
      error = `${t('Nothing was changed.')} ${err.message}`;
    } finally {
      busy = false;
    }
  }
</script>

{#snippet row(i, badge)}
  <li>
    <button type="button" class="opt" aria-pressed={chosen.includes(i.id)} onclick={() => flip(i.id)}>
      <span class="box" aria-hidden="true">{#if chosen.includes(i.id)}<Check size={16} />{/if}</span>
      <span class="nm"><b>{nameOf(i)}</b><small>{sub(i)}</small></span>
      {#if badge}<i class="badge">{t('Suggestion')}</i>{/if}
      <span class="w num">{i.weightG == null ? '–' : formatWeight(itemWeight(i))}</span>
    </button>
  </li>
{/snippet}

<!-- v0.102.0 Design-Refresh P3 (M5): «Merge» as the title, the item in the line below, suggestions in a soft box -->
<dialog class="sheet merge" bind:this={dialog} onclose={onclose} aria-labelledby="merge-h merge-n">
  <span class="grab" aria-hidden="true"></span>
  <div class="mh">
    <h2 id="merge-h">{t('Merge|items')}</h2>
    <button type="button" class="x" aria-label={t('Close')} onclick={() => dialog.close()}><X size={20} aria-hidden="true" /></button>
  </div>
  <p class="lead" id="merge-n">{t('"{name}" is the same as …', { name: nameOf(item) })} <small>{t('(several for a collection)')}</small></p>

  {#if proposed.length || extra.length}
    <h3 class="lbl" id="merge-sug">{t('Suggestions')}</h3>
    <ul class="opts box" aria-labelledby="merge-sug">
      {#each extra as i (i.id)}{@render row(i, false)}{/each}
      {#each proposed as p (p.item.id)}{@render row(p.item, true)}{/each}
    </ul>
  {:else}
    <p class="none">{t('No suggestion. Search for the item.')}</p>
  {/if}

  <label class="find">
    <Search size={16} aria-hidden="true" />
    <input class="inp" type="search" bind:value={q} placeholder={t('Search all items')} aria-label={t('Search all items')} />
  </label>
  {#if found.length}
    <ul class="opts box" aria-label={t('Search results')}>
      {#each found as i (i.id)}{@render row(i, false)}{/each}
    </ul>
  {:else if q.trim()}
    <p class="none">{t('No item found.')}</p>
  {/if}

  <p class="what"><Undo2 size={16} aria-hidden="true" /><span>{t('Replaces the item in templates, building blocks and bags. Past trips stay. Afterwards under Gone.')}</span></p>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <div class="foot">
    <button type="button" class="btn" onclick={() => dialog.close()}>{t('Cancel')}</button>
    <button type="button" class="btn hi" disabled={busy || !chosen.length} onclick={merge}>{t('Merge|items')}</button>
  </div>
</dialog>

<style>
  .merge {
    padding: 10px 16px 16px;
    overflow-x: hidden;
  }
  .grab {
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 4px;
    background: var(--line);
    margin: 0 auto 10px;
  }
  .mh {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    font-size: var(--fs-section);
    margin: 2px 0 4px;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink);
    cursor: pointer;
  }
  .lead {
    overflow-wrap: break-word;
  }
  h3.lbl {
    margin: 12px 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  /* the choices in a soft box, a line between them */
  .opts.box {
    padding: 4px 12px;
    border-radius: var(--radius-card);
    background: var(--paper-2);
  }
  .opts.box .opt[aria-pressed='true'],
  .opts.box .opt:hover {
    background: none;
  }
  .lead,
  .none,
  .what {
    margin: 0 0 8px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  /* v0.102.0 Design-Refresh P3 (M5): what happens, in a soft box with the Undo arrow */
  .what {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 12px 0 0;
    padding: 10px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .what :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .opts {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
  }
  .opts li + li {
    border-top: 1px solid var(--line);
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 52px;
    padding: 6px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .opt[aria-pressed='true'] {
    background: var(--paper-2);
  }
  @media (hover: hover) {
    .opt:hover {
      background: var(--paper-2);
    }
  }
  .box {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--line-strong);
    border-radius: 5px;
    background: var(--paper);
    color: var(--ok);
  }
  .opt[aria-pressed='true'] .box {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--paper);
  }
  .nm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
  }
  .nm b {
    font-weight: 600;
  }
  .nm small {
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  /* Small neutral badge. */
  .badge {
    flex: none;
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
    border: 1px solid var(--line);
  }
  .w {
    flex: none;
    min-width: 4.5em;
    text-align: right;
    color: var(--ink-3);
    font-size: 14px;
    white-space: nowrap;
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .find {
    position: relative;
    display: flex;
    align-items: center;
    margin: 4px 0 8px;
    color: var(--ink-3);
  }
  .find :global(svg) {
    position: absolute;
    left: 10px;
    pointer-events: none;
  }
  .find .inp {
    padding-left: 32px;
    min-height: 44px;
  }
  .err {
    color: var(--hi);
    margin: 8px 0 0;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
  }
  .foot .btn {
    min-height: 44px;
  }
  /* A phone: comes up from below, full width. */
  @media (max-width: 719px) {
    .merge {
      width: 100%;
      max-width: 100%;
      margin: auto 0 0;
      border-radius: 16px 16px 0 0;
      max-height: 88vh;
      padding-bottom: calc(16px + env(safe-area-inset-bottom));
    }
  }
  @media (min-width: 720px) {
    .grab {
      display: none;
    }
  }
</style>
