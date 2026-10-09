<script>
  /**
   * v0.26.0 (Noah 2a/2b, AP10): building blocks (code: item sets) on their own page, #/blocks.
   * v0.32.0 (finding 5, stage 1): the blocks in 3 groups, each card with "when it comes" and the
   * names of its items:
   *   - Always with you: the block "Standard" (v0.33.0: item.sets has 'standard', or the old role /
   *     "On every trip", plus the items On me; changed in the item dialog under "Comes along");
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
  import { TEMPLATES_KEY, templatesWith } from '../lib/templates.js';
  import { tempRange } from '../lib/wardrobe.js';
  import { CONTEXT_SETS } from '../lib/context.js';
  import { blockKind, comesOf } from '../lib/gear/comes.js';
  import { assignSet, editSets, renameSetIn, setQtyIn, deleteSet } from '../lib/gear/assign.js';
  import { undoBulk } from '../lib/gear/bulk.js';
    import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { Check, Moon, Plus, X, Minus, Layers, ChevronRight, UserRound, Scale } from '@lucide/svelte';
  import Help from '../lib/ui/Help.svelte';
  import { SvelteSet } from 'svelte/reactivity';

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
  // v0.39.0 (AP28, Noah 3a): templates are linked to their blocks; a quiet line says how many a change reaches.
  const inTemplates = (key) => templatesWith($tplQ?.value ?? [], key).length;
  // The block "Standard" (v0.33.0: the key 'standard' on item.sets, read with the old fields; On me shows in it).
  const standard = $derived.by(() => {
    const its = items.filter((i) => isInventory(i) && comesOf(i).standard);
    const { g, missing } = sumKnown(its.map(itemWeight));
    return { items: its, g, missing };
  });
  const NAMES_SHOWN = 5;
  // v0.40.0: the blocks an Outdoor night brings get the quiet word "outdoor" (the head says "with the night").
  const OUTDOOR = ['base', 'sleep', 'warm', 'cook'];

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
    const tn2 = inTemplates(s.key);
    if (!confirm([t('Delete the building block "{name}"?', { name: s.name }), tn(n, 'Its {n} item stays in your gear; only the building block goes.', 'Its {n} items stay in your gear; only the building block goes.'), ...(tn2 ? [tn(tn2, 'The template that holds it keeps its items as extras.', 'The {n} templates that hold it keep its items as extras.')] : []), t('You can undo this for a few seconds.')].join('\n\n'))) return;
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
  // v0.43.0 (Mehrfachauswahl): "Select" in an open block, then "Remove" takes many out at once (one Undo).
  let selKey = $state(null);
  const picked = new SvelteSet();
  const selBlock = $derived(selKey ? cards.find((c) => c.key === selKey) ?? null : null);
  const chosen = $derived(selBlock ? selBlock.items.filter((i) => picked.has(i.id)) : []);
  function selectIn(key) {
    selKey = selKey === key ? null : key;
    picked.clear();
  }
  const flipPick = (id) => (picked.has(id) ? picked.delete(id) : picked.add(id));
  async function takeOutMany() {
    const s = selBlock;
    const ids = chosen.map((i) => i.id);
    if (!s || !ids.length) return;
    const res = await assignSet(db, ids, s.key, { out: true });
    offer(tn(res.n, '{n} item taken out of {block}.', '{n} items taken out of {block}.', { block: blockLabel(s) }), res.n ? res.snap : null);
    picked.clear();
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

{#snippet summary(icon, name, id, list, sum, s = null)}
  <summary class="lrow">
    <span class="ic ic-{icon}" aria-hidden="true">
      {#if icon === 'always'}<Check size={18} />{:else if icon === 'night'}<Moon size={18} />{:else}<Plus size={18} />{/if}
    </span>
    <span class="m">
      <span class="t"><span class="nm" {id}>{name}</span>{#if s && (typeof s.minC === 'number' || typeof s.maxC === 'number')}{' '}<small class="quiet num">{tempRange(s.minC, s.maxC, t)}</small>{/if}{#if s && OUTDOOR.includes(s.key)}{' '}<small class="quiet">{t('outdoor|block')}</small>{/if}{#if s && !s.builtIn}{' '}<i class="nbadge">{t('own|block')}</i>{/if}</span>
      <span class="s">{#if list.length}{namesOf(list, s).join(' · ')}{:else}{t('No items in this building block yet.')}{/if}</span>
    </span>
    <!-- Count and weight right in one column; an unknown weight is the scale, never 0 g. -->
    <span class="v num" aria-hidden="true">{list.length}{#if list.length}{' · '}{#if sum.missing === list.length}<Scale size={15} class="scale" />{:else}{sum.missing ? '~' : ''}{formatWeight(sum.g)}{/if}{/if}</span>
    <span class="sr">{tn(list.length, '{n} item', '{n} items')}{list.length && sum.missing < list.length ? `, ${sum.missing ? t('known: {w}', { w: formatWeight(sum.g) }) : formatWeight(sum.g)}` : ''}{sum.missing ? `, ${t('{n} not weighed', { n: sum.missing })}` : ''}</span>
    <ChevronRight class="chev" size={18} aria-hidden="true" />
  </summary>
{/snippet}

{#snippet blockCard(s)}
  <li class="blk" aria-labelledby="blk-{s.key}">
    <details class="edit">
      {@render summary(s.kind, blockLabel(s), `blk-${s.key}`, s.inventory, s, s)}
      <div class="body">
        <p class="note use">{setUse(s.builtIn ? s.key : null)}</p>
        {#if s.note}<p class="note">{s.note}</p>{/if}
        {#if inTemplates(s.key)}<p class="note intpl">{tn(inTemplates(s.key), 'In {n} template: it changes with this block.', 'In {n} templates: they change with this block.')}</p>{/if}
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
          <div class="cols"><span aria-hidden="true">{t('Item')}</span>{#if s.items.length > 1}<button type="button" class="selb" aria-pressed={selKey === s.key} onclick={() => selectIn(s.key)}>{selKey === s.key ? t('Done') : t('Select')}</button>{/if}<span aria-hidden="true">{selKey === s.key ? '' : t('Amount')}</span></div>
          <ul class="rows">
            {#each s.items as item (item.id)}
              {@const inv = isInventory(item)}
              {@const n = qtyOf(s, item.id)}
              {#if selKey === s.key}
                <li class:off={!inv} class="pickli">
                  <label class="pick" class:on={picked.has(item.id)}>
                    <input type="checkbox" checked={picked.has(item.id)} onchange={() => flipPick(item.id)} aria-label={nameOf(item)} />
                    <span class="iname">{nameOf(item)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span>
                    <small class="num w">{inv ? formatWeight(itemWeight(item)) : t(OWNERSHIP[item.ownership] ?? item.ownership)}</small>
                  </label>
                </li>
              {:else}
              <li class:off={!inv}>
                <span class="in">
                  <span class="iname">{nameOf(item)}{#if n !== 1}{' '}<b class="num">× {n}</b>{/if}</span>
                  <small>{#if inv}<span class="num">{formatWeight(itemWeight(item))}</span>{:else}{t(OWNERSHIP[item.ownership] ?? item.ownership)} · {t('never packed')}{/if}</small>
                </span>
                <span class="racts row-acts">
                  {#if inv}
                    <span class="step" role="group" aria-label={t('Amount of {name}', { name: nameOf(item) })}>
                      <button type="button" class="sq" disabled={n <= 1} aria-label={t('Fewer: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n - 1)}><Minus size={16} aria-hidden="true" /></button>
                      <button type="button" class="sq" disabled={n >= 20} aria-label={t('More: {name}', { name: nameOf(item) })} onclick={() => amount(s, item, n + 1)}><Plus size={16} aria-hidden="true" /></button>
                    </span>
                  {/if}
                  <button type="button" class="sq quietx" aria-label={t('Remove {name} from {block}', { name: nameOf(item), block: s.name })} title={t('Remove')} onclick={() => takeOut(s, item)}><X size={16} aria-hidden="true" /></button>
                </span>
              </li>
              {/if}
            {/each}
          </ul>
        {/if}
        <div class="acts">
          <a class="btn" href={fillHref(s)} aria-label={t('Add items to {block}', { block: s.name })}>+ {t('Add items')}</a>
          <button type="button" class="btn" aria-label={t('Rename {name}', { name: blockLabel(s) })} onclick={() => ((renaming = s.key), (renameTo = s.name))}>{t('Rename')}</button>
          {#if !s.builtIn}<button type="button" class="btn del" onclick={() => remove(s)}>{t('Delete')}</button>{/if}
        </div>
      </div>
    </details>
  </li>
{/snippet}

<div class="blocks">
  <!-- v0.40.0 (design check, Noah 7a): one line instead of four, the rest behind "?"; rows, not cards. -->
  <h1 class="title">{t('Building blocks')}</h1>
  <div class="page-sub">{tn(cards.length + 1, '{n} building block', '{n} building blocks')} · {t('groups of items that come along together')}
    <Help label={t('Building blocks')}>
      <p>{t('A building block is a group of items that comes along together. There are three kinds: always with you, with the night, and to add. Changing a block does not change trips you already made.')}</p>
      <p>{t('Tools are never called "not needed" in the debrief.')}</p>
    </Help>
  </div>
  {#if error}<p class="err" role="alert">{error}</p>{/if}

  <div class="groups">
    <section class="grp" aria-labelledby="g-always">
      <h2 class="sec-head" id="g-always"><span>{t('Always with you')}</span><span class="n">{t('every new trip')}</span></h2>
      <ul class="rowlist">
        <li class="blk std" aria-labelledby="blk-standard">
          <details class="edit">
            {@render summary('always', t('Standard|block'), 'blk-standard', standard.items, standard)}
            <div class="body">
              <p class="note use">{t('Comes into every new trip')}</p>
              {#if inTemplates('standard')}<p class="note intpl">{tn(inTemplates('standard'), 'In {n} template: it changes with this block.', 'In {n} templates: they change with this block.')}</p>{/if}
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
            </div>
          </details>
        </li>
      </ul>
    </section>

    <section class="grp" aria-labelledby="g-night">
      <h2 class="sec-head" id="g-night"><span>{t('With the night')}</span><span class="n">{t('come by themselves')}</span></h2>
      <ul class="rowlist">
        {#each nightCards as s (s.key)}{@render blockCard(s)}{/each}
      </ul>
    </section>

    <section class="grp" aria-labelledby="g-add">
      <h2 class="sec-head" id="g-add"><span>{t('To add')}</span><span class="n">{t('one tap when you make a trip')}</span></h2>
      <ul class="rowlist">
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
          <a class="btn tpl" href="#/pack/templates"><Layers size={18} aria-hidden="true" /><span>{t('Templates')}</span><span class="num tc">{tplCount}</span><ChevronRight size={16} aria-hidden="true" /></a>
        {/if}
      </div>
    </section>
  </div>
</div>

{#if selBlock}
  <!-- v0.43.0 (Mehrfachauswahl): the bar of a block's selection, with the Undo of the last change. -->
  <div class="undopad sel" aria-hidden="true"></div>
  <div class="undo selbar" role="region" aria-label={t('Selected items')}>
    {#if undo}<p class="ul" role="status"><span>{undo.text}</span>{#if undo.snap}<button type="button" class="btn hi" onclick={doUndo}>{t('Undo')}</button>{/if}</p>{/if}
    <div class="bacts">
      <b class="num" aria-live="polite">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
      <button type="button" class="btn" disabled={chosen.length === selBlock.items.length} onclick={() => selBlock.items.forEach((i) => picked.add(i.id))}>{t('Select all')}</button>
      <button type="button" class="btn" disabled={!chosen.length} onclick={takeOutMany}>{t('Remove')}</button>
      <button type="button" class="btn" onclick={() => selectIn(null)}>{t('Done')}</button>
    </div>
  </div>
{:else if undo}
  <div class="undopad" aria-hidden="true"></div>
  <div class="undo" role="status">
    <span>{undo.text}</span>
    {#if undo.snap}<button type="button" class="btn hi" onclick={doUndo}>{t('Undo')}</button>{/if}
  </div>
{/if}

<style>
  .blocks {
    max-width: 1200px;
    margin: 0 auto;
  }
  .page-sub {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
  }
  .err {
    color: var(--bad);
  }
  .groups {
    display: grid;
    gap: 0 24px;
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
  .grp .sec-head {
    margin-top: 12px;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  .newset {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
    width: 100%;
  }
  .newset label {
    display: grid;
    gap: 4px;
    flex: 1 1 200px;
    min-width: 0;
  }
  .blk {
    min-width: 0;
  }
  .nm {
    font-weight: 600;
  }
  .quiet {
    font-size: 13px;
    font-weight: 400;
    color: var(--ink-3);
  }
  .ic-always {
    background: var(--ink) !important;
    color: var(--paper) !important;
  }
  .v :global(.scale) {
    vertical-align: -2px;
    color: var(--ink-3);
  }
  .body {
    padding: 0 12px 10px 56px;
  }
  @media (max-width: 479px) {
    .body {
      padding-left: 12px;
    }
  }
  .note {
    margin: 6px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .note.use {
    margin-top: 0;
  }
  .edit[open] > summary {
    background: var(--paper-2);
  }
  .cols {
    display: flex;
    justify-content: space-between;
    margin: 8px 0 0;
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
  @media (hover: hover) and (pointer: fine) {
    .sq {
      width: 36px;
      height: 36px;
    }
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0 4px;
  }
  .del {
    margin-left: auto;
    border-color: var(--bad);
    color: var(--bad);
  }
  .tpl .tc {
    color: var(--ink-3);
    font-weight: 400;
  }
  .undopad {
    height: 80px;
  }
  /* v0.43.0 (Mehrfachauswahl): "Select" in the column header, rows with a box, the bar. */
  .cols {
    align-items: center;
  }
  .selb {
    min-height: 44px;
    margin: -8px 0;
    padding: 0 8px;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: 600 13px var(--font-body);
    text-decoration: underline;
    cursor: pointer;
  }
  .rows li.pickli {
    padding: 0;
  }
  .pick {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    cursor: pointer;
  }
  .pick.on {
    background: var(--paper-2);
  }
  .pick input {
    width: 22px;
    height: 22px;
    margin: 0 0 0 2px;
    flex: none;
    accent-color: var(--ink);
  }
  .pick .iname {
    flex: 1;
    min-width: 0;
  }
  .undopad.sel {
    height: 150px;
  }
  .selbar {
    display: block;
  }
  .selbar .ul {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    margin: 0 0 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--line);
  }
  .selbar .ul span {
    flex: 1 1 160px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .bacts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .bacts b {
    margin-right: auto;
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
