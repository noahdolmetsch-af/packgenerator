<script>
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { phone } from '../lib/media.svelte.js';
  import { gearStats, matches, groupByCategory, formatWeight, itemWeight, CATEGORIES, BAG, OWNERSHIP } from '../lib/gear.js';
  import WeightOverview from '../lib/gear/WeightOverview.svelte';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';

  // All items, kept up to date by the database (liveQuery re-runs on every change).
  const itemsQuery = liveQuery(() => db.items.toArray());
  const items = $derived($itemsQuery ?? []);
  const stats = $derived(gearStats(items));

  let filter = $state({ q: '', category: '', role: '' });
  let tab = $state('inventory'); // phone only: inventory | wishlist | weigh
  let weighing = $state(false); // desktop: weigh mode open
  let dialog = $state(null); // { item } or { item: null } for "Add item"

  const inventory = $derived(stats.inventory.filter((i) => matches(i, filter)));
  const wishlist = $derived(stats.wishlist.filter((i) => matches(i, filter)));
  const groups = $derived(groupByCategory(inventory));
  const catStats = $derived(Object.fromEntries(stats.cats.map((c) => [c.key, c])));

  const pickCategory = (key) => (filter.category = filter.category === key ? '' : key);
  const open = (item) => (dialog = { item });
</script>

<div class="gear">
  <header class="head">
    <h1 class="title">Gear</h1>
    <div class="kpis">
      <div><span class="lbl">Items</span><b class="num">{stats.inventory.length}</b></div>
      <div class="un"><span class="lbl">Not weighed</span><b class="num">{stats.unweighed}</b></div>
      <div class="tot"><span class="lbl">Total weighed</span><b class="num">{formatWeight(stats.total)}</b></div>
      <div><span class="lbl">Wishlist</span><b class="num">{stats.wishlist.length}</b></div>
    </div>
  </header>

  {#if !items.length && $itemsQuery}
    <p class="card">No gear yet. Import your data on the <a href="#/">start page</a> (Your data → Import backup), or add an item.</p>
  {/if}

  {#if weighing && !phone.matches}
    <WeighMode {items} onclose={() => (weighing = false)} />
  {:else}
    <WeightOverview {stats} category={filter.category} onpick={pickCategory} onopen={open} />

    {#if phone.matches}
      <div class="tabs" role="tablist" aria-label="Show">
        <button type="button" role="tab" aria-selected={tab === 'inventory'} onclick={() => (tab = 'inventory')}>Inventory <small>{stats.inventory.length}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'wishlist'} onclick={() => (tab = 'wishlist')}>Wishlist <small>{stats.wishlist.length}</small></button>
        <button type="button" role="tab" aria-selected={tab === 'weigh'} onclick={() => (tab = 'weigh')}>To weigh <small>{stats.unweighed}</small></button>
      </div>
    {/if}

    {#if phone.matches && tab === 'weigh'}
      <WeighMode {items} />
    {:else}
      <div class="toolbar">
        <label class="q"><span class="lbl">Search gear</span><input class="inp" type="search" placeholder="Name, brand, bag or ID" bind:value={filter.q} /></label>
        <label>
          <span class="lbl">Category</span>
          <select class="sel" bind:value={filter.category}>
            <option value="">All categories</option>
            {#each stats.cats as c (c.key)}<option value={c.key}>{c.name} ({c.n})</option>{/each}
          </select>
        </label>
        {#if !phone.matches}
          <label>
            <span class="lbl">Role</span>
            <select class="sel" bind:value={filter.role}>
              <option value="">All roles</option>
              <option value="worn">Worn</option>
              <option value="standard">Standard pack</option>
              <option value="optional">Optional</option>
              <option value="night">Overnight sets</option>
              <option value="none">No role</option>
            </select>
          </label>
          <div class="acts">
            <button type="button" class="btn" onclick={() => (weighing = true)}>Weigh missing items ({stats.unweighed})</button>
            <button type="button" class="btn hi" onclick={() => (dialog = { item: null })}>Add item</button>
          </div>
        {/if}
      </div>

      {#if !phone.matches || tab === 'inventory'}
        <p class="count num" aria-live="polite">{inventory.length} of {stats.inventory.length} items</p>
        {#each groups as g (g.key)}
          <section class="cat" aria-labelledby="gh-{g.key}">
            <div class="ch">
              <span class="sw" style:background={g.color}></span>
              <h2 id="gh-{g.key}" class="title">{g.name}</h2>
              <span class="m">{catStats[g.key].n} items{catStats[g.key].unweighed ? ` · ${catStats[g.key].unweighed} not weighed` : ''}</span>
              <b class="num k">{formatWeight(catStats[g.key].g)}</b>
            </div>
            <ul class="rows">
              {#each g.items as item (item.id)}
                <li>
                  <button type="button" onclick={() => open(item)}>
                    <span class="nm">{item.name}{#if item.qty > 1}<small> × {item.qty}</small>{/if}</span>
                    <span class="bg">{BAG[item.defaultBag] ?? '–'}</span>
                    <span class="w num" class:nw={item.weightG == null}>{formatWeight(itemWeight(item))}</span>
                  </button>
                </li>
              {/each}
            </ul>
          </section>
        {:else}
          {#if items.length}<p class="card">Nothing matches. <button type="button" class="btn" onclick={() => (filter = { q: '', category: '', role: '' })}>Clear search and filters</button></p>{/if}
        {/each}
      {/if}

      {#if !phone.matches || tab === 'wishlist'}
        <section class="wish" aria-labelledby="wish-h">
          <h2 id="wish-h" class="title">Wishlist & to buy</h2>
          <p class="sub">Not owned yet. Not counted in the inventory or any total.</p>
          <ul class="rows">
            {#each wishlist as item (item.id)}
              <li>
                <button type="button" onclick={() => open(item)}>
                  <span class="st st-{item.ownership}">{OWNERSHIP[item.ownership]}</span>
                  <span class="nm">{item.name}</span>
                  <span class="bg">{CATEGORIES.find((c) => c.key === item.category)?.name}</span>
                  <span class="w num" class:nw={item.weightG == null}>{formatWeight(itemWeight(item))}</span>
                </button>
              </li>
            {:else}
              <li class="empty">No wishlist items match.</li>
            {/each}
          </ul>
        </section>
      {/if}
    {/if}
  {/if}
</div>

{#if dialog}
  <ItemDialog item={dialog.item} {items} readOnly={phone.matches} onclose={() => (dialog = null)} />
{/if}

<style>
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    justify-content: space-between;
    gap: 12px 24px;
    margin-bottom: 18px;
  }
  .head .title {
    font-size: clamp(56px, 12vw, 88px);
  }
  .kpis {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
  }
  .kpis div {
    display: flex;
    flex-direction: column;
  }
  .kpis b {
    font-family: var(--font-title);
    font-weight: 800;
    font-size: 30px;
    line-height: 1;
  }
  @media (max-width: 719px) {
    .kpis {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      width: 100%;
      gap: 8px;
    }
    .kpis b {
      font-size: 22px;
    }
    .kpis .lbl {
      font-size: 10px;
    }
  }
  .kpis .un b {
    color: var(--hi);
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 2px solid var(--ink);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .tabs button {
    border: 0;
    border-right: 2px solid var(--ink);
    background: var(--paper);
    padding: 10px 4px;
    font: 700 15px var(--font-body);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .tabs button:last-child {
    border-right: 0;
  }
  .tabs button[aria-selected='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  .tabs small {
    font-weight: 400;
    font-size: 12px;
  }
  .toolbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    align-items: end;
    margin-bottom: 8px;
  }
  .toolbar .q {
    grid-column: 1 / -1;
  }
  @media (min-width: 720px) {
    .toolbar {
      grid-template-columns: minmax(200px, 2fr) 1fr 1fr auto;
    }
    .toolbar .q {
      grid-column: auto;
    }
  }
  .acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .count {
    color: var(--ink-3);
    font-size: 14px;
    margin: 6px 0 12px;
  }
  .cat {
    margin-bottom: 20px;
  }
  .ch {
    display: flex;
    align-items: baseline;
    gap: 8px;
    border-bottom: 3px solid var(--ink);
    padding-bottom: 4px;
    flex-wrap: wrap;
  }
  .ch .sw {
    align-self: center;
  }
  .ch .title {
    font-size: 26px;
  }
  .ch .m {
    color: var(--ink-3);
    font-size: 13px;
    flex: 1;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
  }
  .rows button {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    width: 100%;
    text-align: left;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    padding: 9px 8px;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .rows button:hover {
    background: var(--hi-soft);
  }
  .rows .bg {
    grid-column: 1;
    grid-row: 2;
    font-size: 13px;
    color: var(--ink-3);
  }
  .rows .w {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    font-weight: 700;
    text-align: right;
  }
  .rows .nw {
    color: var(--hi);
    font-weight: 600;
    font-size: 13px;
  }
  @media (min-width: 720px) {
    .rows button {
      grid-template-columns: 1fr 200px 110px;
    }
    .rows .bg {
      grid-column: 2;
      grid-row: 1;
      font-size: 15px;
    }
    .rows .w {
      grid-column: 3;
      grid-row: 1;
    }
  }
  .wish {
    margin-top: 28px;
    padding: 16px;
    border: 2px dashed var(--ink-3);
    border-radius: 6px;
  }
  .wish .title {
    font-size: 28px;
  }
  .wish .sub {
    color: var(--ink-3);
    margin: 4px 0 10px;
  }
  .wish .rows {
    background: transparent;
  }
  .wish .rows button {
    grid-template-columns: auto 1fr auto;
  }
  .wish .st {
    grid-row: 1 / span 2;
    align-self: center;
  }
  .wish .nm {
    grid-column: 2;
  }
  .wish .bg {
    grid-column: 2;
  }
  .wish .w {
    grid-column: 3;
  }
  @media (min-width: 720px) {
    .wish .rows button {
      grid-template-columns: 90px 1fr 200px 110px;
    }
    .wish .nm,
    .wish .bg,
    .wish .w {
      grid-row: 1;
    }
    .wish .bg {
      grid-column: 3;
    }
    .wish .w {
      grid-column: 4;
    }
  }
  .st {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border: 1.5px solid var(--ink-3);
    border-radius: 99px;
    padding: 1px 8px;
    color: var(--ink-3);
    justify-self: start;
  }
  .st-to-buy {
    border-color: var(--hi);
    color: var(--hi);
  }
  .empty {
    padding: 10px 8px;
    color: var(--ink-3);
  }
</style>
