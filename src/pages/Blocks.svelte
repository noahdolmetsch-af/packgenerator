<script>
  /**
   * v0.26.0 (Noah 2a/2b, AP10): building blocks (code: item sets) on their own page, #/blocks.
   * v0.32.0 (finding 5, stage 1): the blocks in 3 groups, each card with "when it comes" and the
   * names of its items:
   *   - Always with you: the block "Standard" (in stage 1 still the items with the old role worn or
   *     standard pack, or "On every trip"; changed in the item dialog under "Comes along");
   *   - With the night: the blocks the overnight stay brings by itself (context.js CONTEXT_SETS);
   *   - To add: Light and your own blocks, one tap in "New trip" or in Pack's "Add material".
   * The rows and the changes (amount, remove, add items, rename, delete) fold away under "Change".
   * Built-in blocks (gear.js SETS) can be renamed but not deleted; own blocks can be renamed and
   * deleted. Every change can be undone for a few seconds. No data changes because of the groups.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { formatWeight, itemWeight, OWNERSHIP, isInventory, sumKnown } from '../lib/gear.js';
  import { SETS_KEY, allSets, setView, setUse, qtyOf, addSet, blockLabel } from '../lib/sets.js';
  import { TEMPLATES_KEY } from '../lib/templates.js';
  import { CONTEXT_SETS } from '../lib/context.js';
  import { blockKind, comesOf } from '../lib/gear/comes.js';
  import { assignSet, editSets, renameSetIn, setQtyIn, deleteSet } from '../lib/gear/assign.js';
  import { undoBulk } from '../lib/gear/bulk.js';
  import Sum from '../lib/ui/Sum.svelte';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { Check, Moon, Plus, X, Minus, Layers, ChevronRight, UserRound } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const tplQ = liveQuery(() => db.settings.get(TEMPLATES_KEY));
  const items = $derived($itemsQ ?? []);
  const sets = $derived(allSets($setsQ?.value));
  const cards = $derived(sets.map((s) => ({ ...s, ...setView(s, items), kind: blockKind(s.key) })));
  // With the night in the order the overnight stay brings them; to add: Light first, then your own.
  const nightCards = $derived(CONTEXT_SETS.map((k) => cards.find((c) => c.key === k)).filter(Boolean));
  const addCards = $derived(cards.filter((c) => c.kind === 'add'));
  const tplCount = $derived(($tplQ?.value ?? []).length);
  // The block "Standard" (stage 1: read from the old fields, nothing is stored for it).
  const standard = $derived.by(() => {
    const its = items.filter((i) => isInventory(i) && comesOf(i).standard);
    const { g, missing } = sumKnown(its.map(itemWeight));
    return { items: its, g, missing };
  });
  const NAMES_SHOWN = 8;

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
  /** "Tent · Mat · Gloves × 2 · +4": the names of the items that get packed. */
  const namesOf = (list, s = null) => {
    const shown = list.slice(0, NAMES_SHOWN).map((i) => {
      const n = s ? qtyOf(s, i.id) : 1;
      return n !== 1 ? `${nameOf(i)} × ${n}` : nameOf(i);
    });
    return list.length > NAMES_SHOWN ? [...shown, `+${list.length - NAMES_SHOWN}`] : shown;
  };
</script>

{#snippet head(icon, name, id, use, list, sum, s = null)}
  <div class="head">
    <span class="ico ico-{icon}" aria-hidden="true">
      {#if icon === 'always'}<Check size={20} />{:else if icon === 'night'}<Moon size={20} />{:else}<Plus size={20} />{/if}
    </span>
    <div class="htext">
      <div class="hrow">
        <h3 class="nm" {id}>{name}</h3>
        <span class="count"><span class="num">{tn(list.length, '{n} item', '{n} items')}</span> · <Sum g={sum.g} missing={sum.missing} /></span>
      </div>
      <p class="use">{use}</p>
      {#if list.length}<p class="names">{namesOf(list, s).join(' · ')}</p>{:else}<p class="names empty">{t('No items in this building block yet.')}</p>{/if}
    </div>
  </div>
{/snippet}

{#snippet blockCard(s)}
  <li class="card blk" aria-labelledby="blk-{s.key}">
    {@render head(s.kind, blockLabel(s), `blk-${s.key}`, setUse(s.builtIn ? s.key : null), s.inventory, s, s)}
    {#if s.note}<p class="note">{s.note}</p>{/if}
    <details class="edit">
      <summary>{t('Change|block')} <small>{s.builtIn ? t('Built-in') : t('Own')}</small><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
      {#if renaming === s.key}
        <form class="newset" onsubmit={(e) => { e.preventDefault(); rename(s, renameTo); }}>
          <label><span class="lbl">{t('New name')}</span><input class="inp" bind:value={renameTo} placeholder={s.builtIn ? builtInName(s.key) : ''} /></label>
          <button type="submit" class="btn hi">{t('Save')}</button>
          <button type="button" class="btn" onclick={() => (renaming = null)}>{t('Cancel')}</button>
        </form>
        {#if s.builtIn}<p class="note">{t('Empty: back to "{name}".', { name: builtInName(s.key) })}</p>{/if}
      {/if}
      {#if s.items.length}
        <!-- One header for the columns, quiet icon buttons in the rows (no "Remove" on every row). -->
        <p class="cols" aria-hidden="true"><span>{t('Item')}</span><span>{t('Amount')}</span></p>
        <ul class="rows">
          {#each s.items as item (item.id)}
            {@const inv = isInventory(item)}
            {@const n = qtyOf(s, item.id)}
            <li class:off={!inv}>
              <span class="in">
                <span class="iname">{nameOf(item)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span>
                <small>{#if inv}<span class="num">{formatWeight(itemWeight(item))}</span>{:else}{t(OWNERSHIP[item.ownership] ?? item.ownership)} · {t('never packed')}{/if}</small>
              </span>
              <span class="racts">
                {#if inv}
                  <span class="step" role="group" aria-label={t('Amount of {name}', { name: nameOf(item) })}>
                    <button type="button" class="sq" disabled={n <= 1} aria-label={t('Fewer: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n - 1)}><Minus size={16} aria-hidden="true" /></button>
                    <button type="button" class="sq" disabled={n >= 20} aria-label={t('More: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n + 1)}><Plus size={16} aria-hidden="true" /></button>
                  </span>
                {/if}
                <button type="button" class="sq quietx" aria-label={t('Remove {name} from {block}', { name: nameOf(item), block: s.name })} title={t('Remove')} onclick={() => takeOut(s, item)}><X size={16} aria-hidden="true" /></button>
              </span>
            </li>
          {/each}
        </ul>
      {/if}
      <div class="acts">
        <a class="btn" href={fillHref(s)} aria-label={t('Add items to {block}', { block: s.name })}>+ {t('Add items')}</a>
        <button type="button" class="btn" aria-label={t('Rename {name}', { name: blockLabel(s) })} onclick={() => ((renaming = s.key), (renameTo = s.name))}>{t('Rename')}</button>
        {#if !s.builtIn}<button type="button" class="btn del" onclick={() => remove(s)}>{t('Delete')}</button>{/if}
      </div>
    </details>
  </li>
{/snippet}

<div class="blocks">
  <p class="back"><a href="#/gear">← {t('Gear')}</a></p>
  <h1 class="title big">{t('Building blocks')}</h1>
  <p class="hint">{t('A building block is a group of items that comes along together. There are three kinds: always with you, with the night, and to add. Changing a block does not change trips you already made.')}</p>
  {#if error}<p class="err" role="alert">{error}</p>{/if}

  <div class="groups">
    <section class="grp" aria-labelledby="g-always">
      <h2 class="gh" id="g-always">{t('Always with you')} <small>{t('every new trip')}</small></h2>
      <ul class="list">
        <li class="card blk std" aria-labelledby="blk-standard">
          {@render head('always', t('Standard|block'), 'blk-standard', t('Comes into every new trip'), standard.items, standard)}
          <details class="edit">
            <summary>{t('Items')} <small>{t('change in the item: Comes along')}</small><ChevronRight class="chev" size={18} aria-hidden="true" /></summary>
            {#if standard.items.length}
              <p class="cols" aria-hidden="true"><span>{t('Item')}</span><span>{t('Weight')}</span></p>
              <ul class="rows">
                {#each standard.items as item (item.id)}
                  <li>
                    <span class="in"><span class="iname">{nameOf(item)}{#if comesOf(item).body}{' '}<small class="where"><UserRound size={14} aria-hidden="true" /> {t('On me')}</small>{/if}</span></span>
                    <small class="num w">{formatWeight(itemWeight(item))}</small>
                  </li>
                {/each}
              </ul>
            {/if}
            <p class="note">{t('To change: open the item in Gear, then "Comes along" → Standard.')}</p>
          </details>
        </li>
      </ul>
      <p class="note side">{t('Tools are never called "not needed" in the debrief.')}</p>
    </section>

    <section class="grp" aria-labelledby="g-night">
      <h2 class="gh" id="g-night">{t('With the night')} <small>{t('come by themselves')}</small></h2>
      <ul class="list">
        {#each nightCards as s (s.key)}{@render blockCard(s)}{/each}
      </ul>
    </section>

    <section class="grp" aria-labelledby="g-add">
      <h2 class="gh" id="g-add">{t('To add')} <small>{t('one tap when you make a trip')}</small></h2>
      <ul class="list">
        {#each addCards as s (s.key)}{@render blockCard(s)}{/each}
      </ul>
      <div class="top">
        {#if adding}
          <form class="newset" onsubmit={create}>
            <label><span class="lbl">{t('Name of the new building block')}</span><input class="inp" bind:value={newName} placeholder={t('e.g. Rain')} /></label>
            <button type="submit" class="btn hi">{t('Create')}</button>
            <button type="button" class="btn" onclick={() => ((adding = false), (error = ''))}>{t('Cancel')}</button>
          </form>
        {:else}
          <button type="button" class="btn" onclick={() => (adding = true)}><Plus size={18} aria-hidden="true" /> {t('New building block')}</button>
        {/if}
      </div>
      <a class="card tpl" href="#/pack/templates"><Layers size={20} aria-hidden="true" /><span class="tt">{t('Templates = building blocks + extras')}</span><span class="num tc">{tplCount}</span><ChevronRight size={18} aria-hidden="true" /></a>
    </section>
  </div>
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
    color: var(--ink-2);
    max-width: 760px;
  }
  .err {
    color: var(--bad);
  }
  .groups {
    display: grid;
    gap: 24px;
    margin-top: 16px;
  }
  @media (min-width: 1000px) {
    .groups {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: start;
    }
  }
  .grp {
    min-width: 0;
  }
  /* Light section headers: the group name, its rule quiet next to it. */
  .gh {
    font-size: var(--fs-sub);
    font-weight: 700;
    margin: 0 0 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 8px;
  }
  .gh small {
    font-size: var(--fs-small);
    font-weight: 400;
    color: var(--ink-3);
  }
  .top {
    margin: 12px 0;
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
    flex: 1 1 200px;
    min-width: 0;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .blk {
    min-width: 0;
    padding: 12px 14px;
  }
  .std {
    border: 1.5px solid var(--ink);
  }
  .head {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .ico {
    flex: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius);
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .ico-always {
    background: var(--ink);
    color: var(--paper);
  }
  .htext {
    flex: 1;
    min-width: 0;
  }
  .hrow {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 10px;
  }
  .nm {
    font-size: var(--fs-sub);
    font-weight: 700;
    margin: 0;
    overflow-wrap: anywhere;
    min-width: 0;
  }
  .count {
    margin-left: auto;
    font-size: var(--fs-small);
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .use {
    margin: 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .names {
    margin: 4px 0 0;
    font-size: 15px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .names.empty {
    color: var(--ink-3);
  }
  .note {
    margin: 6px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .note.side {
    margin-top: 8px;
  }
  /* Progressive disclosure: the rows and the changes fold away. */
  .edit {
    margin-top: 8px;
    border-top: 1px solid var(--line);
  }
  .edit summary {
    list-style: none;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    cursor: pointer;
    font-weight: 600;
    font-size: 15px;
    color: var(--ink-2);
  }
  .edit summary::-webkit-details-marker {
    display: none;
  }
  .edit summary small {
    font-weight: 400;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .edit :global(.chev) {
    margin-left: auto;
    flex: none;
    color: var(--ink-3);
    transition: transform 0.15s;
  }
  .edit[open] :global(.chev) {
    transform: rotate(90deg);
  }
  .cols {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-3);
  }
  .rows {
    list-style: none;
    margin: 4px 0 10px;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    border-top: 1px solid var(--line);
    min-height: 48px;
  }
  .rows li.off {
    color: var(--ink-3);
  }
  .in {
    flex: 1 1 auto;
    min-width: 0;
    display: grid;
  }
  .iname {
    overflow-wrap: anywhere;
  }
  .in small,
  .w {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .w {
    margin-left: auto;
    text-align: right;
  }
  .where {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-size: 13px;
    color: var(--ink-3);
  }
  .racts {
    flex: none;
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .step {
    display: flex;
    gap: 4px;
  }
  .sq {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1.5px solid var(--line-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  .sq:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .quietx {
    border-color: transparent;
    color: var(--ink-3);
  }
  /* Row actions: quiet on a desktop, full on hover and on focus, always full on a phone. */
  @media (hover: hover) and (pointer: fine) {
    .racts {
      opacity: 0.45;
      transition: opacity 0.12s;
    }
    .rows li:hover .racts,
    .rows li:focus-within .racts {
      opacity: 1;
    }
    .sq {
      width: 36px;
      height: 36px;
    }
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 4px;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
  .tpl {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 10px 14px;
    color: var(--ink);
    text-decoration: none;
    font-weight: 600;
  }
  .tpl:visited {
    color: var(--ink);
  }
  .tpl .tt {
    flex: 1;
    min-width: 0;
  }
  .tc {
    color: var(--ink-3);
    font-weight: 400;
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
