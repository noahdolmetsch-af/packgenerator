<script>
  /**
   * v0.26.0 (Noah 2a/2b, AP10): building blocks (code: item sets) on their own page, #/blocks.
   * One card per block: name, item count, honest weight, the items, what the block does.
   * Built-in blocks (gear.js SETS) can be renamed but not deleted; own blocks can be renamed and
   * deleted. "+ Add items" opens Gear in "Select" with only the items not in the block yet.
   * Amount per item (coordinator default 2): a small stepper; "+ {block}" in Pack uses it.
   * Every change can be undone for a few seconds.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { formatWeight, itemWeight, OWNERSHIP } from '../lib/gear.js';
  import { SETS_KEY, allSets, setView, setUse, qtyOf, addSet } from '../lib/sets.js';
  import { assignSet, editSets, renameSetIn, setQtyIn, deleteSet } from '../lib/gear/assign.js';
  import { undoBulk } from '../lib/gear/bulk.js';
  import Sum from '../lib/ui/Sum.svelte';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';

  const itemsQ = liveQuery(() => db.items.toArray());
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const items = $derived($itemsQ ?? []);
  const sets = $derived(allSets($setsQ?.value));
  const cards = $derived(sets.map((s) => ({ ...s, ...setView(s, items) })));

  let error = $state('');
  let undo = $state.raw(null); // { text, snap }
  let timer;
  function offer(text, snap) {
    clearTimeout(timer);
    undo = snap ? { text, snap } : { text };
    timer = setTimeout(() => (undo = null), 10_000);
  }
  async function doUndo() {
    const snap = undo?.snap;
    clearTimeout(timer);
    undo = null;
    if (snap) await undoBulk(db, snap);
  }
  $effect(() => () => clearTimeout(timer));
  const errText = (code, name) => (code === 'taken' ? t('There is already a building block "{name}".', { name }) : t('Give the building block a name.'));

  // "+ New building block"
  let adding = $state(false);
  let newName = $state('');
  async function create(event) {
    event.preventDefault();
    error = '';
    const name = newName.trim();
    const res = await editSets(db, (v) => addSet(v, name));
    if (res.error) return (error = errText(res.error, name));
    offer(t('Building block "{name}" made.', { name }), res.snap);
    newName = '';
    adding = false;
  }
  let renaming = $state(null);
  let renameTo = $state('');
  const builtInName = (key) => allSets([]).find((x) => x.key === key)?.name ?? key;
  async function rename(s, value) {
    error = '';
    const name = value.trim();
    renaming = null;
    if (name === s.name || (!name && !s.builtIn)) return;
    const res = await renameSetIn(db, s.key, name);
    if (res.error) return (error = errText(res.error, name));
    offer(t('Renamed to "{name}".', { name: name || builtInName(s.key) }), res.snap);
  }
  async function remove(s) {
    const n = s.items.length;
    if (!confirm([t('Delete the building block "{name}"?', { name: s.name }), tn(n, 'Its {n} item stays in your gear; only the building block goes.', 'Its {n} items stay in your gear; only the building block goes.'), t('You can undo this for a few seconds.')].join('\n\n'))) return;
    const res = await deleteSet(db, s.key);
    if (res.error) return;
    offer(t('Building block "{name}" deleted.', { name: s.name }), res.snap);
  }
  async function takeOut(s, item) {
    const res = await assignSet(db, [item.id], s.key, { out: true });
    offer(t('{name} taken out of {block}.', { name: nameOf(item), block: s.name }), res.snap);
  }
  async function amount(s, item, n) {
    const res = await setQtyIn(db, s.key, item.id, n);
    if (!res.error) offer(t('{name}: {n} in {block}.', { name: nameOf(item), n: Math.max(1, n), block: s.name }), res.snap);
  }
  // "+ Add items": Gear in "Select", only the items not in this block yet (Gear reads ?fill=).
  const fillHref = (s) => `#/gear?fill=${encodeURIComponent(s.key)}`;
</script>

<div class="blocks">
  <p class="back"><a href="#/gear">← {t('Gear')}</a></p>
  <h1 class="title big">{t('Building blocks')}</h1>
  <p class="hint">{t('A building block is a group of items you pack together, e.g. everything for rain. In Pack, "Add material" adds a whole block with one tap; an item in two blocks is packed once. Changing a block does not change trips you already made.')}</p>
  {#if error}<p class="err" role="alert">{error}</p>{/if}
  <div class="top">
    {#if adding}
      <form class="newset" onsubmit={create}>
        <label><span class="lbl">{t('Name of the new building block')}</span><input class="inp" bind:value={newName} placeholder={t('e.g. Rain')} /></label>
        <button type="submit" class="btn hi">{t('Create')}</button>
        <button type="button" class="btn" onclick={() => ((adding = false), (error = ''))}>{t('Cancel')}</button>
      </form>
    {:else}
      <button type="button" class="btn hi" onclick={() => (adding = true)}>+ {t('New building block')}</button>
    {/if}
  </div>

  <ul class="list">
    {#each cards as s (s.key)}
      <li class="card" aria-labelledby="blk-{s.key}">
        <div class="head">
          <h2 class="nm" id="blk-{s.key}">{s.name}</h2>
          {#if renaming === s.key}
            <form class="newset" onsubmit={(e) => { e.preventDefault(); rename(s, renameTo); }}>
              <label><span class="lbl">{t('New name')}</span><input class="inp" bind:value={renameTo} placeholder={s.builtIn ? builtInName(s.key) : ''} /></label>
              <button type="submit" class="btn hi">{t('Save')}</button>
              <button type="button" class="btn" onclick={() => (renaming = null)}>{t('Cancel')}</button>
            </form>
            {#if s.builtIn}<p class="note">{t('Empty: back to "{name}".', { name: builtInName(s.key) })}</p>{/if}
          {/if}
          <p class="facts">
            <span class="tag">{s.builtIn ? t('Built-in') : t('Own')}</span>
            {tn(s.inventory.length, '{n} item', '{n} items')} · <Sum g={s.g} missing={s.missing} />
          </p>
          <p class="use">{setUse(s.builtIn ? s.key : null)}</p>
          {#if s.note}<p class="note">{s.note}</p>{/if}
        </div>
        {#if s.items.length}
          <ul class="rows">
            {#each s.items as item (item.id)}
              {@const inv = item.ownership === 'owned' || item.ownership === 'unclear'}
              {@const n = qtyOf(s, item.id)}
              <li class:off={!inv}>
                <span class="in">
                  <span class="iname">{nameOf(item)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span>
                  <small>{#if inv}{formatWeight(itemWeight(item))}{:else}{t(OWNERSHIP[item.ownership] ?? item.ownership)} · {t('never packed')}{/if}</small>
                </span>
                {#if inv}
                  <span class="step" role="group" aria-label={t('Amount of {name}', { name: nameOf(item) })}>
                    <button type="button" class="sq" disabled={n <= 1} aria-label={t('Fewer: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n - 1)}>−</button>
                    <button type="button" class="sq" disabled={n >= 20} aria-label={t('More: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n + 1)}>+</button>
                  </span>
                {/if}
                <button type="button" class="btn sm" aria-label={t('Remove {name} from {block}', { name: nameOf(item), block: s.name })} onclick={() => takeOut(s, item)}>{t('Remove')}</button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="empty">{t('No items in this building block yet.')}</p>
        {/if}
        <div class="acts">
          <a class="btn" href={fillHref(s)} aria-label={t('Add items to {block}', { block: s.name })}>+ {t('Add items')}</a>
          <button type="button" class="btn" aria-label={t('Rename {name}', { name: s.name })} onclick={() => ((renaming = s.key), (renameTo = s.name))}>{t('Rename')}</button>
          {#if !s.builtIn}<button type="button" class="btn del" onclick={() => remove(s)}>{t('Delete')}</button>{/if}
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if undo}
  <div class="undopad" aria-hidden="true"></div>
  <div class="undo" role="status">
    <span>{undo.text}</span>
    {#if undo.snap}<button type="button" class="btn hi" onclick={doUndo}>{t('Undo')}</button>{/if}
  </div>
{/if}

<style>
  .blocks {
    max-width: 1200px;
  }
  .back {
    margin: 0 0 8px;
  }
  .hint {
    color: var(--ink-3);
    max-width: 760px;
  }
  .err {
    color: var(--bad);
  }
  .top {
    margin: 12px 0 16px;
  }
  .newset {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
  }
  .newset label {
    display: grid;
    gap: 4px;
    flex: 1 1 220px;
    min-width: 0;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 14px;
  }
  @media (min-width: 900px) {
    .list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .card {
    min-width: 0;
  }
  .nm {
    font-size: var(--fs-sub);
    font-weight: 700;
    margin: 0 0 6px;
    overflow-wrap: anywhere;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    margin: 8px 0 2px;
  }
  .tag {
    font-size: var(--fs-small);
    border: 1px solid var(--ink-3);
    border-radius: 99px;
    padding: 0 8px;
    color: var(--ink-2);
  }
  .use,
  .note {
    margin: 2px 0;
    font-size: 14px;
    color: var(--ink-2);
  }
  .note {
    color: var(--ink-3);
  }
  .rows {
    list-style: none;
    margin: 10px 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .rows li.off {
    color: var(--ink-3);
  }
  .in {
    flex: 1 1 170px;
    min-width: 0;
    display: grid;
  }
  .iname {
    overflow-wrap: anywhere;
  }
  .in small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .step {
    display: flex;
    gap: 4px;
  }
  .sq {
    width: 36px;
    height: 36px;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: 700 18px/1 var(--font-body);
    cursor: pointer;
  }
  .sq:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .empty {
    color: var(--ink-3);
    margin: 10px 0;
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
  .undopad {
    height: 80px;
  }
  .undo {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    background: var(--paper);
    border-top: 1.5px solid var(--line-strong);
    box-shadow: 0 -4px 14px rgb(0 0 0 / 0.08);
    padding: 8px max(12px, calc((100vw - 1560px) / 2)) calc(8px + env(safe-area-inset-bottom));
  }
  .undo span {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 719px) {
    .undo {
      bottom: calc(76px + env(safe-area-inset-bottom));
      padding-bottom: 8px;
    }
  }
</style>
