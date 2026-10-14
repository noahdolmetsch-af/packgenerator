<script>
  /**
   * One own list (Noah 14.10.2026 «2 b»): its points with a box to tick, or as plain notes; a field to add one.
   * compact: the small card where a list is pinned (open points only, at most 4, then «Open ›»).
   * Taking a point away offers Undo (offerDone, the toast of the whole app).
   */
  import { X, Plus, RotateCcw } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t } from '../i18n.svelte.js';
  import { addPoint, togglePoint, removePoint, resetPoints, pointsOf, openCount } from '../lists.js';
  import { changeList, uid } from '../listsdb.js';
  import { offerDone } from '../ui/rename.svelte.js';

  let { list, compact = false } = $props();
  let text = $state('');
  const all = $derived(pointsOf(list));
  const open = $derived(openCount(list));
  const shown = $derived(compact ? all.filter((x) => !list.check || !x.done).slice(0, 4) : all);
  const done = $derived(list.items.filter((x) => x.done).length);

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const tx = text;
    text = '';
    await changeList(db, list.id, (l) => addPoint(l, tx, { id: uid('pt') }));
  }
  const toggle = (x) => changeList(db, list.id, (l) => togglePoint(l, x.id));
  async function drop(x) {
    const undo = await changeList(db, list.id, (l) => removePoint(l, x.id));
    offerDone(t('«{name}» removed.', { name: x.text }), undo);
  }
  async function reset() {
    const undo = await changeList(db, list.id, resetPoints);
    offerDone(t('All boxes empty again.'), undo);
  }
</script>

<ul class="pts" class:compact data-list={list.id}>
  {#each shown as x (x.id)}
    <li class="pt" class:done={list.check && x.done}>
      {#if list.check}
        <button type="button" class="bx" role="checkbox" aria-checked={!!x.done} aria-labelledby="pt-{list.id}-{x.id}{compact ? '-c' : ''}" onclick={() => toggle(x)}></button>
      {:else}
        <span class="dot" aria-hidden="true"></span>
      {/if}
      <span class="tx" id="pt-{list.id}-{x.id}{compact ? '-c' : ''}">{x.text}</span>
      {#if !compact}<button type="button" class="rm" onclick={() => drop(x)} aria-label={t('Remove: {name}', { name: x.text })}><X size={16} aria-hidden="true" /></button>{/if}
    </li>
  {/each}
</ul>
{#if compact}
  {#if !open}<p class="none">{list.check && list.items.length ? t('All ticked.') : t('No points yet.')}</p>{:else if open > shown.length}<p class="none">{t('{n} more', { n: open - shown.length })}</p>{/if}
{:else}
  <form class="add" onsubmit={add}>
    <input class="inp" bind:value={text} maxlength="160" enterkeyhint="done" placeholder={t('New point …')} aria-label={t('New point')} />
    <button type="submit" class="btn"><Plus size={16} aria-hidden="true" />{t('Add')}</button>
  </form>
  {#if list.check && done}<button type="button" class="reset" onclick={reset}><RotateCcw size={16} aria-hidden="true" />{t('Empty all boxes')}</button>{/if}
{/if}

<style>
  .pts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .pt {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    border-top: 1px solid var(--line);
  }
  .pt:first-child {
    border-top: 0;
  }
  .compact .pt {
    min-height: 44px;
  }
  .bx {
    position: relative;
    flex: none;
    width: 24px;
    height: 24px;
    border: 1.5px solid var(--line-strong, var(--ink-2));
    border-radius: 7px;
    background: var(--paper);
    cursor: pointer;
  }
  .bx::before {
    content: '';
    position: absolute;
    inset: -10px;
  }
  .bx[aria-checked='true'] {
    background: var(--accent);
    border-color: var(--accent);
  }
  .bx[aria-checked='true']::after {
    content: '';
    position: absolute;
    left: 7px;
    top: 3px;
    width: 6px;
    height: 11px;
    border: solid var(--paper);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  .dot {
    flex: none;
    width: 6px;
    height: 6px;
    margin: 0 9px;
    border-radius: 50%;
    background: var(--ink-2);
  }
  .tx {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .done .tx {
    color: var(--ink-2);
    text-decoration: line-through;
  }
  .rm {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 0;
    background: none;
    color: var(--ink-2);
    cursor: pointer;
  }
  .add {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }
  .add .inp {
    flex: 1;
    min-width: 0;
  }
  .add .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .reset {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    margin-top: 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
  }
  .none {
    margin: 4px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
</style>
