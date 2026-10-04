<script>
  import { db } from '../db.js';
  import { replaceEverywhere } from '../replace.js';
  import { CATEGORY, BAG, CATEGORIES, formatWeight, itemWeight, isInventory } from '../gear.js';
  import { layerOf } from '../layers.js';
  import ItemDialog from './ItemDialog.svelte';

  /**
   * Inventory check (to-do from 4.10.2026): go through everything you own once and say
   * what is still there, what is gone and what was replaced. One item at a time, like weighing.
   */
  let { items, onclose = null } = $props();

  let skipped = $state([]);
  let dialog = $state(null); // { item, preset, onsaved }
  const order = Object.fromEntries(CATEGORIES.map((c, i) => [c.key, i]));

  const owned = $derived(items.filter(isInventory));
  const queue = $derived.by(() => {
    // Round C answer 2: layer by layer, starting with what goes on every ride.
    const q = owned
      .filter((i) => !i.reviewedAt)
      .sort((a, b) => layerOf(a).rank - layerOf(b).rank || (order[a.category] ?? 99) - (order[b.category] ?? 99) || a.name.localeCompare(b.name));
    return [...q.filter((i) => !skipped.includes(i.id)), ...q.filter((i) => skipped.includes(i.id))];
  });
  const current = $derived(queue[0]);
  const layer = $derived(current ? layerOf(current) : null);
  const leftInLayer = $derived(layer ? queue.filter((i) => layerOf(i).name === layer.name).length : 0);
  const checked = $derived(items.filter((i) => i.reviewedAt).length);
  const now = () => new Date().toISOString();

  const keep = () => db.items.update(current.id, { reviewedAt: now() });
  const gone = () => db.items.update(current.id, { ownership: 'gone', reviewedAt: now(), updatedAt: now() });
  function skip() {
    skipped = [...skipped.filter((id) => id !== current.id), current.id];
  }
  function replaced() {
    const old = current;
    dialog = {
      item: null,
      preset: {
        category: old.category, defaultBag: old.defaultBag, role: old.role ?? '', sets: old.sets ?? [], note: `Replaces ${old.name} (${old.id})`, reviewedAt: now(),
        ...Object.fromEntries(['ride', 'coldBelow', 'rain', 'perHours', 'waterL'].filter((k) => old[k] != null).map((k) => [k, old[k]])),
      },
      onsaved: async (r) => {
        await db.items.update(old.id, { ownership: 'gone', reviewedAt: now(), note: [old.note, `Replaced by ${r.name} (${r.id}).`].filter(Boolean).join(' '), updatedAt: now() });
        await replaceEverywhere(db, old.id, r.id); // round C answer 3
      },
    };
  }
  const edit = () => (dialog = { item: current, onsaved: (r) => db.items.update(r.id, { reviewedAt: now() }) });
  const addNew = () => (dialog = { item: null, preset: { reviewedAt: now() } });
</script>

<section class="review" aria-labelledby="rev-h">
  <div class="head">
    <h2 id="rev-h" class="title">Check inventory</h2>
    <span class="num">{checked} checked · {queue.length} left</span>
    {#if onclose}<button type="button" class="btn" onclick={onclose}>Done</button>{/if}
  </div>
  <p class="intro">Do you still have it? Mark what is gone, add what replaced it, and add anything new that is missing.</p>

  {#if current}
    <div class="card">
      <p class="layer">{layer.name} <small>{leftInLayer} left in this group</small></p>
      <p class="cat"><span class="sw" style:background={CATEGORY[current.category]?.color}></span>{CATEGORY[current.category]?.name} · {current.id}</p>
      <p class="name">{current.name}{#if current.qty > 1}<small> × {current.qty}</small>{/if}</p>
      {#if current.brand || current.model}<p class="sub">{[current.brand, current.model].filter(Boolean).join(' ')}</p>{/if}
      <p class="sub">{BAG[current.defaultBag] ?? ''}{current.weightG != null ? ` · ${formatWeight(itemWeight(current))}` : ' · not weighed'}</p>
      {#if current.note}<p class="sub note">{current.note}</p>{/if}
      <div class="row">
        <button type="button" class="btn hi" onclick={keep}>Still have it</button>
        <button type="button" class="btn" onclick={gone}>Gone</button>
        <button type="button" class="btn" onclick={replaced}>Replaced by…</button>
      </div>
      <div class="row small">
        <button type="button" class="link" onclick={edit}>Edit</button>
        <button type="button" class="link" onclick={skip}>Skip for now</button>
      </div>
    </div>
  {:else}
    <p class="card">Everything you own is checked. 🎉</p>
  {/if}
  <p class="more">Something missing from the list? <button type="button" class="btn" onclick={addNew}>Add item</button></p>
</section>

{#if dialog}
  <ItemDialog item={dialog.item} {items} preset={dialog.preset} onsaved={dialog.onsaved} onclose={() => (dialog = null)} />
{/if}

<style>
  .layer {
    margin: 0 0 8px;
    font: 800 14px var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--hi);
  }
  .layer small {
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink-3);
  }
  .head {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }
  .head .title {
    font-size: 30px;
  }
  .head .num {
    color: var(--ink-3);
    flex: 1;
  }
  .intro {
    color: var(--ink-2);
    margin: 4px 0 12px;
  }
  .card {
    max-width: 520px;
  }
  .cat {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 13px;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
  }
  .name {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 34px;
    line-height: 1;
    margin: 6px 0;
  }
  .sub {
    margin: 0 0 6px;
    color: var(--ink-2);
  }
  .note {
    font-size: 14px;
  }
  .row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .row.small {
    gap: 16px;
  }
  .link {
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  .more {
    margin-top: 14px;
    color: var(--ink-2);
  }
</style>
