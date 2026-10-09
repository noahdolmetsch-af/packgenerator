<script>
  import { take } from '../lib/nav.js';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { phone } from '../lib/media.svelte.js';
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { gearStats, matches, groupByCategory, formatWeight, knownWeight, itemWeight, favouriteCounts, CATEGORIES, CATEGORY, UNKNOWN_CATEGORY, BAG, OWNERSHIP, bulkOwnership, namesList } from '../lib/gear.js';
  import { saveItems, deletePlan, deleteItems, undoBulk, archiveItems } from '../lib/gear/bulk.js';
  import { weighQueue } from '../lib/weigh.js';
  import { STAGED } from '../lib/gear/importdb.js';
  import FavStar from '../lib/gear/FavStar.svelte';
  import GearRow from '../lib/gear/GearRow.svelte';
  import { tripCount } from '../lib/gear/swipe.js';
  import WeightOverview from '../lib/gear/WeightOverview.svelte';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import ReviewMode from '../lib/gear/ReviewMode.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import AssignDialog from '../lib/gear/AssignDialog.svelte';
  import { assignSet } from '../lib/gear/assign.js';
  import { SETS_KEY, allSets } from '../lib/sets.js';
  import { itemUsage, deadWeight, wishReason } from '../lib/insights.js';
  import { t, tn, nameOf, locale } from '../lib/i18n.svelte.js';
  import { DOMAINS, countByDomain, domainName } from '../lib/domains.js';
  import Sum from '../lib/ui/Sum.svelte';
  import { longUnused } from '../lib/know.js';
  import { leaveHome } from '../lib/blocks2026.js';
  import { leaveHomeFields } from '../lib/gear/comes.js';

  // v0.36.0: a gear list waiting on "Check import" (#/gear/import), counted in the ••• menu.
  const stagedQ = liveQuery(() => db.table('meta').get(STAGED));
  let gmoreEl = $state();
  function closeGmore(e) {
    e.stopPropagation();
    gmoreEl.open = false;
    gmoreEl.querySelector('summary')?.focus();
  }
  // All items, kept up to date by the database (liveQuery re-runs on every change).
  const itemsQuery = liveQuery(() => db.items.toArray());
  const items = $derived($itemsQuery ?? []);
  const stats = $derived(gearStats(items));
  // v0.19.2 (Noah 6a, 7a): what the debriefs say about each item.
  const tripsQ = liveQuery(() => db.trips.toArray());
  const debriefsQ = liveQuery(() => db.debriefs.toArray());
  const usage = $derived(itemUsage($tripsQ ?? [], $debriefsQ ?? []));
  const dead = $derived(deadWeight(items, usage));
  const debriefN = $derived(($debriefsQ ?? []).filter((d) => d.status === 'done').length);
  // v0.38.0 (Noah 1a): "Compact | With bag" above the list; the bag is hidden unless chosen, remembered here.
  const BAGCOL = 'gear.bagColumn';
  let showBag = $state(
    (() => {
      try {
        return localStorage.getItem(BAGCOL) === '1';
      } catch {
        return false;
      }
    })(),
  );
  function setShowBag(on) {
    showBag = on;
    try {
      localStorage.setItem(BAGCOL, on ? '1' : '0');
    } catch {
      /* private mode: only this visit */
    }
  }
  // v0.38.0 (Noah 3a, 4a): row actions. An item on a trip is archived (Gone), never deleted from the
  // row; a real delete stays the red button in the item. Swipe on a phone, ••• everywhere.
  const usedN = $derived(Object.fromEntries(items.map((i) => [i.id, tripCount(i.id, $tripsQ ?? [])])));
  let swiped = $state(null);
  let rowMenu = $state(null); // the item whose ••• menu is open
  let assignItem = $state(null); // the item "Assign …" is open for
  let menuDlg = $state();
  $effect(() => {
    if (rowMenu && menuDlg && !menuDlg.open) menuDlg.showModal();
    if (!rowMenu && menuDlg?.open) menuDlg.close();
  });
  const touch = $derived(phone.matches);
  async function archiveOne(item) {
    rowMenu = null;
    const n = usedN[item.id] ?? 0;
    const snap = await saveItems(db, [{ ...$state.snapshot(item), ownership: 'gone', updatedAt: new Date().toISOString() }]);
    offerUndo(tn(n, '"{name}" archived. It was on {n} trip and stays in the look back.', '"{name}" archived. It was on {n} trips and stays in the look back.', { name: nameOf(item) }), snap);
  }
  async function deleteOne(item) {
    rowMenu = null;
    if ((usedN[item.id] ?? 0) > 0) return archiveOne(item); // never delete a used item from the row
    offerUndo(t('"{name}" deleted.', { name: nameOf(item) }), await deleteItems(db, [item.id]));
  }
  async function favOne(item) {
    rowMenu = null;
    await db.items.update(item.id, { favorite: item.favorite ? null : true, updatedAt: new Date().toISOString() });
  }
  const assignOne = (item) => ((rowMenu = null), (assignItem = item));
  // v0.33.0 (finding 5, stage 2): the mark item.leaveHome, out of Standard; role / always in step (comes.js).
  async function markHome(item) {
    await db.items.update(item.id, { ...leaveHomeFields(item), updatedAt: new Date().toISOString() });
  }

  // v0.19.6: the search in the top bar opens Gear with ?q=<name>.
  // ?cat=<key> (start page "Where the weight is") opens one category.
  const hashQ = new URLSearchParams(location.hash.split('?')[1] ?? '');
  // v0.22.0 (AP05): ?fav=1 (start page "Favourites") opens with the favourites filter on.
  let filter = $state({ q: hashQ.get('q') ?? '', category: hashQ.get('cat') ?? '', role: '', fav: hashQ.get('fav') === '1', domain: hashQ.get('area') ?? '' });
  // The favourites filter lives in the address too, so back, forward and a reload keep it.
  function setFav(on) {
    filter.fav = on;
    const [path, query = ''] = location.hash.split('?');
    const q = new URLSearchParams(query);
    if (on) q.set('fav', '1');
    else q.delete('fav');
    const s = q.toString();
    history.replaceState(history.state, '', `${path || '#/gear'}${s ? `?${s}` : ''}`);
  }
  // v0.25.1 (Noah 1a): ?unused=1 (Today "Long not used" → Look through) shows only the owned
  // items that were on no trip for 12 months (the same list as the card, know.js).
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  let unusedOnly = $state(hashQ.get('unused') === '1');
  // v0.43.0 (Wiege-Modus): what still needs the scale: bikes and bags first, then the items (weigh.js).
  const toWeigh = $derived(weighQueue({ items, bikes: $bikesQ ?? [], containers: $bagsQ ?? [], extras: true }).length);
  function startWeigh() {
    if (gmoreEl) gmoreEl.open = false;
    tab = 'weigh';
    scrollTo({ top: 0 });
  }
  const unused = $derived(longUnused(items, $tripsQ ?? [], $bikesQ ?? [], $bagsQ ?? [], new Date().toISOString().slice(0, 10)));
  const unusedIds = $derived(new Set((unused?.items ?? []).map((i) => i.id)));
  function setUnused(on) {
    unusedOnly = on;
    const [path, query = ''] = location.hash.split('?');
    const q = new URLSearchParams(query);
    if (on) q.set('unused', '1');
    else q.delete('unused');
    const s = q.toString();
    history.replaceState(history.state, '', `${path || '#/gear'}${s ? `?${s}` : ''}`);
  }
  const clearFilters = () => {
    filter = { q: '', category: '', role: '', fav: false, domain: '' };
    setFav(false);
    setUnused(false);
  };
  // v0.22.0 (AP05): the same bases as the tabs; the button counts what the list below shows.
  const favN = $derived(favouriteCounts(items));
  // v0.21.0 (package 5): the area filter shows once items belong to more than one area.
  const perArea = $derived(countByDomain(items));
  const areaKeys = $derived([...DOMAINS.map((d) => d.key), ...Object.keys(perArea).filter((k) => !DOMAINS.some((d) => d.key === k))].filter((k) => perArea[k]));
  const showAreas = $derived(areaKeys.length > 1 || !!filter.domain);
  // Tabs on every screen size (design audit G1, G2): the wishlist and weighing no longer hide
  // at the bottom of a long page. #/gear?tab=weigh opens a tab directly (from the start page).
  const TABS = ['inventory', 'wishlist', 'dead', 'weigh', 'check'];
  const fromHash = new URLSearchParams(location.hash.split('?')[1] ?? '').get('tab');
  let tab = $state(TABS.includes(fromHash) ? fromHash : 'inventory');
  const toReview = $derived(stats.inventory.filter((i) => !i.reviewedAt).length);
  let dialog = $state(null); // { item } or { item: null, preset? } for "Add item"
  // v0.23.0 (AP08): the weight analyses sit below the list, folded shut until opened.
  let analysis = $state(false);
  // v0.23.0 (AP08): "Add item" starts with what the page already knows: the search text as the name,
  // the chosen category and area, and "Wishlist" on the wishlist tab.
  function addItem(extra = {}) {
    const preset = { ...(filter.domain ? { domains: [filter.domain] } : {}), ...(filter.category ? { category: filter.category } : {}), ...(tab === 'wishlist' ? { ownership: 'wishlist' } : {}), ...extra };
    dialog = { item: null, preset };
  }
  // Categories folded shut (10a). On the phone everything starts folded, on the desktop open.
  let folded = $state(phone.matches ? Object.fromEntries(CATEGORIES.map((c) => [c.key, true])) : {});

  // v0.26.0 (Noah 2a): "+ Add items" on a building block opens Gear with ?fill=<key>: "Select" is on
  // and the list shows only the items not in that block yet; one button puts the ticked ones in.
  const setsQ = liveQuery(() => db.settings.get(SETS_KEY));
  const blocks = $derived(allSets($setsQ?.value));
  let fillKey = $state(hashQ.get('fill') ?? '');
  const fill = $derived(fillKey ? blocks.find((b) => b.key === fillKey) ?? null : null);
  const inventory = $derived(stats.inventory.filter((i) => matches(i, filter) && (!unusedOnly || unusedIds.has(i.id)) && (!fillKey || !i.sets?.includes(fillKey))));
  // Wishlist sorted by how much it helps (Noah 7a): missing on trips, needed on the bike, lighter.
  const wishlist = $derived(
    stats.wishlist
      .filter((i) => matches(i, filter))
      .map((item) => ({ item, ...wishReason(item, items, $tripsQ ?? [], $debriefsQ ?? []) }))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)),
  );
  const groups = $derived(groupByCategory(inventory));
  const catStats = $derived(Object.fromEntries([...stats.cats, stats.other].map((c) => [c.key, c])));
  // While searching or filtering, every matching category is shown open.
  const searching = $derived(!!(filter.q.trim() || filter.category || filter.role || filter.fav || filter.domain || unusedOnly));
  const isOpen = (key) => searching || !folded[key];
  const allOpen = $derived(groups.every((g) => !folded[g.key]));
  const toggle = (key) => (folded[key] = !folded[key]);
  const setAll = (shut) => (folded = Object.fromEntries([...CATEGORIES, UNKNOWN_CATEGORY].map((c) => [c.key, shut])));

  const pickCategory = (key) => (filter.category = filter.category === key ? '' : key);
  // Side column: jump to a category (and open it).
  function jump(key) {
    folded[key] = false;
    queueMicrotask(() => document.getElementById(`gh-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  const open = (item) => (dialog = { item });
  // v0.30.2 (test H1.11): a hit from the top bar search opens that item (?item=<id>).
  let wantItem = $state(hashQ.get('item') ?? '');
  $effect(() => {
    if (!wantItem || !$itemsQuery) return;
    const it = items.find((i) => String(i.id) === wantItem);
    wantItem = '';
    if (it) open(it);
  });
  // v0.19.6: "New → Gear item" from any page opens "Add item" here.
  $effect(() => {
    const add = () => {
      const v = take('gear.add');
      if (!v) return;
      let preset = {};
      try {
        if (v !== '1') preset = { name: String(JSON.parse(v).name ?? '') };
      } catch {
        /* an old wish without a name */
      }
      addItem(preset);
    };
    add();
    window.addEventListener('pg:additem', add);
    return () => window.removeEventListener('pg:additem', add);
  });
  // v0.23.1 (Noah): "Search" on the start page Gear card opens Gear with ?find=1: the inventory
  // tab with the cursor in the search field.
  let searchEl = $state();
  function findFocus() {
    tab = 'inventory';
    requestAnimationFrame(() => searchEl?.focus());
  }
  $effect(() => {
    if (searchEl && hashQ.get('find') === '1') findFocus();
  });
  // A new search from the top bar while Gear is open.
  $effect(() => {
    const read = () => {
      if (!location.hash.startsWith('#/gear')) return;
      const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
      const q = params.get('q');
      if (q != null) (filter.q = q), (tab = 'inventory');
      filter.fav = params.get('fav') === '1';
      unusedOnly = params.get('unused') === '1';
      if (unusedOnly) tab = 'inventory';
      if (params.get('find') === '1') findFocus();
      if (params.get('fill')) startFill(params.get('fill'));
      if (params.get('item')) wantItem = params.get('item');
    };
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  });

  // v0.24.1 (Noah 5a): select several items, then change their category, move them to the
  // wishlist or back, or delete them. A tap on a row ticks it instead of opening the item.
  let selecting = $state(!!hashQ.get('fill'));
  const picked = new SvelteSet();
  // What the list shows right now (search and filters included); only these count as selected,
  // so a hidden item is never changed by mistake.
  const shown = $derived(tab === 'wishlist' ? wishlist.map((w) => w.item) : inventory);
  const chosen = $derived(shown.filter((i) => picked.has(i.id)));
  let busy = $state(false);
  // The last bulk change, kept in memory for ~10 s: { text, snap }. Raw: the snapshot goes back
  // into the database as it is (a $state proxy cannot be stored).
  let undo = $state.raw(null);
  let undoTimer;
  function setSelecting(on) {
    selecting = on;
    picked.clear();
    if (!on && fillKey) endFill();
  }
  function startFill(key) {
    fillKey = key;
    tab = 'inventory';
    selecting = true;
    picked.clear();
  }
  function endFill() {
    fillKey = '';
    const [path, query = ''] = location.hash.split('?');
    const q = new URLSearchParams(query);
    q.delete('fill');
    const str = q.toString();
    history.replaceState(history.state, '', `${path || '#/gear'}${str ? `?${str}` : ''}`);
  }
  // Put the ticked items into the building block of ?fill=, then back to the building blocks.
  const fillIn = () =>
    run(async () => {
      const res = await assignSet(db, chosen.map((i) => i.id), fill.key);
      offerUndo(tn(res.n, 'Done: {n} item → {target}', 'Done: {n} items → {target}', { target: fill.name }), res.n ? res.snap : null);
    });
  // v0.26.0 (Noah 2a, AP11): "Into a building block…", "Onto a trip…" and the rest open the assign dialog.
  let assign = $state(null); // the kind: 'into' | 'out' | 'bag' | 'template' | 'trip'
  let moreEl = $state();
  function closeMore() {
    if (moreEl) moreEl.open = false;
  }
  function openAssign(kind) {
    closeMore();
    assign = kind;
  }
  // Another tab is another list: start again.
  $effect(() => {
    void tab;
    untrack(() => picked.clear());
  });
  const flip = (id) => (picked.has(id) ? picked.delete(id) : picked.add(id));
  const pickAll = (list, on) => list.forEach((i) => (on ? picked.add(i.id) : picked.delete(i.id)));
  const allPicked = (list) => list.length > 0 && list.every((i) => picked.has(i.id));
  function offerUndo(text, snap) {
    clearTimeout(undoTimer);
    undo = snap ? { text, snap } : { text };
    undoTimer = setTimeout(() => (undo = null), 10_000);
    picked.clear();
  }
  async function run(fn) {
    if (busy) return;
    busy = true;
    try {
      await fn();
    } finally {
      busy = false;
    }
  }
  // v0.43.0 (Mehrfachauswahl): archive many at once, the same as "Archive" on one row (status Gone).
  const archiveSel = () =>
    run(async () => {
      closeMore();
      const res = await archiveItems(db, chosen.map((i) => i.id));
      offerUndo(tn(res.n, '{n} item archived. It stays in the look back.', '{n} items archived. They stay in the look back.'), res.snap);
    });
  const own = (ownership) =>
    run(async () => {
      closeMore();
      const n = chosen.length;
      const snap = await saveItems(db, bulkOwnership(chosen, chosen.map((i) => i.id), ownership));
      offerUndo(ownership === 'wishlist' ? tn(n, '{n} item moved to the wishlist.', '{n} items moved to the wishlist.') : tn(n, '{n} item moved to my gear.', '{n} items moved to my gear.'), snap);
    });
  const remove = () =>
    run(async () => {
      closeMore();
      const list = chosen;
      const ids = list.map((i) => i.id);
      const plan = await deletePlan(db, ids);
      const text = [
        tn(ids.length, 'Delete {n} item from your gear?', 'Delete {n} items from your gear?'),
        namesList(list.map((i) => nameOf(i))),
        plan.used.length ? t('{n} of them are on a trip or template; they disappear from there too.', { n: plan.used.length }) : '',
        t('You can undo this for a few seconds.'),
      ].filter(Boolean);
      if (!confirm(text.join('\n\n'))) return;
      offerUndo(tn(ids.length, '{n} item deleted.', '{n} items deleted.'), await deleteItems(db, ids));
    });
  async function doUndo() {
    if (!undo) return;
    const { snap } = undo;
    clearTimeout(undoTimer);
    undo = null;
    if (snap) await undoBulk(db, snap);
  }
  $effect(() => () => clearTimeout(undoTimer));
</script>

<div class="gear">
  <header class="head">
    <div class="ht">
      <h1 class="title">{t('Gear')}</h1>
      <!-- v0.26.0 (Noah 2b): the building blocks page -->
      <a class="btn sm blk" href="#/blocks">{t('Building blocks')} →</a>
      <!-- v0.42.0 (Noah 1): the wardrobe, clothing by layer and body zone -->
      <a class="btn sm blk" href="#/wardrobe">{t('Wardrobe')} →</a>
      <!-- v0.36.0 (Noah 1a): the quiet page actions; "Check import" opens the staged gear list. -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <details class="gmore" bind:this={gmoreEl} onkeydown={(e) => e.key === 'Escape' && closeGmore(e)}>
        <summary class="btn sm" aria-label={t('More for Gear')}>•••</summary>
        <div class="gmenu">
          <!-- v0.43.0 (Wiege-Modus): weigh one thing after the other -->
          <button type="button" onclick={startWeigh}>{t('Record weights')}{#if toWeigh}<i class="badge num">{toWeigh}</i>{/if}</button>
          <a href="#/gear/import">{t('Check import')}{#if $stagedQ}<i class="badge num">{$stagedQ.data?.items?.length || t('Step 2')}</i>{/if}</a>
        </div>
      </details>
    </div>
    <div class="kpis">
      <div><span class="lbl">{t('Items')}</span><b class="num">{stats.inventory.length}</b></div>
      <!-- v0.22.0 (AP04): unknown is not zero: the known sum with the missing weights right next to it. -->
      <div class="tot"><span class="lbl">{t('Gear weight')}</span><Sum g={stats.total} missing={stats.totalMissing} miss={stats.consumablesMissing ? t('{n} not weighed (+ {f} food and water)', { n: stats.totalMissing, f: stats.consumablesMissing }) : ''} /></div>
      <div><span class="lbl">{t('Wishlist')}</span><b class="num">{stats.wishlist.length}</b></div>
    </div>
  </header>

  {#if !items.length && $itemsQuery}
    <p class="card">{t('No gear yet. Import your data on the')} <a href="#/">{t('start page')}</a> {t('(Your data → Import backup), or add an item.')}</p>
  {/if}

  <div class="tabs" role="tablist" aria-label={t('Show')}>
    <button type="button" role="tab" aria-selected={tab === 'inventory'} onclick={() => (tab = 'inventory')}>{t('Inventory')} <small>{stats.inventory.length}</small></button>
    <button type="button" role="tab" aria-selected={tab === 'wishlist'} onclick={() => (tab = 'wishlist')}>{t('Wishlist')} <small>{stats.wishlist.length}</small></button>
    <button type="button" role="tab" aria-selected={tab === 'dead'} onclick={() => (tab = 'dead')}>{t('Dead weight')} <small>{dead.dead.length}</small></button>
    <button type="button" role="tab" aria-selected={tab === 'weigh'} onclick={() => (tab = 'weigh')}>{t('Weigh')} <small>{toWeigh}</small></button>
    <button type="button" role="tab" aria-selected={tab === 'check'} onclick={() => (tab = 'check')}>{t('Check')} <small>{toReview}</small></button>
  </div>

  {#if tab === 'dead'}
    <section class="dead" aria-labelledby="dead-h">
      <h2 id="dead-h" class="title">{t('Dead weight')} {#if dead.deadG}<small class="num">{formatWeight(dead.deadG)}</small>{/if}</h2>
      <p class="sub">{tn(debriefN, 'Taken on 2 trips or more and never used, from your {n} debrief. Heaviest first.', 'Taken on 2 trips or more and never used, from your {n} debriefs. Heaviest first.')}</p>
      {#if debriefN < 2}<p class="card">{t('Shows up after 2 debriefs. You have {n}.', { n: debriefN })}</p>{/if}
      {#snippet row(r)}
        <li>
          <button type="button" class="nmb" onclick={() => open(r.item)}><span class="nm">{nameOf(r.item)}</span><small>{t('taken {a}×, used {b}×', { a: r.u.taken, b: r.u.used })} · {r.u.trips.slice(-3).join(', ')}</small></button>
          <span class="w num" class:nw={r.item.weightG == null}>{formatWeight(itemWeight(r.item))}</span>
          {#if leaveHome(r.item)}<span class="ok small">{t('Stays at home')}</span>{:else}<button type="button" class="btn sm" onclick={() => markHome(r.item)}>{t('Leave at home')}</button>{/if}
        </li>
      {/snippet}
      {#if dead.dead.length}<ul class="drows">{#each dead.dead as r (r.item.id)}{@render row(r)}{/each}</ul>{:else if debriefN >= 2}<p class="card">{t('Nothing: everything you took got used at least once.')}</p>{/if}
      {#if dead.rare.length}
        <h3 class="title">{t('Rarely used')}</h3>
        <p class="sub">{t('Used on a third of the trips or less.')}</p>
        <ul class="drows">{#each dead.rare as r (r.item.id)}{@render row(r)}{/each}</ul>
      {/if}
      <p class="sub small">{t('"Leave at home" makes it optional: new trips no longer pack it on their own.')}</p>
    </section>
  {:else if tab === 'weigh'}
    <WeighMode {items} extras onclose={() => (tab = 'inventory')} />
  {:else if tab === 'check'}
    <ReviewMode {items} />
  {:else}
    <div class="toolbar" class:areas={showAreas}>
      <label class="q"><span class="lbl">{t('Search gear')}</span><input class="inp" type="search" placeholder={t('Name, brand, bag or ID')} bind:value={filter.q} bind:this={searchEl} /></label>
      <label>
        <span class="lbl">{t('Category')}</span>
        <select class="sel" bind:value={filter.category}>
          <option value="">{t('All categories')}</option>
          {#each stats.cats as c (c.key)}<option value={c.key}>{t(c.name)} ({c.n})</option>{/each}
        </select>
      </label>
      <!-- Noah, 4.10.2026: the favourites list is the base; ★ shows only those. -->
      {#if showAreas}
        <label>
          <span class="lbl">{t('Area')}</span>
          <select class="sel" bind:value={filter.domain} aria-label={t('Area')}>
            <option value="">{t('All areas')}</option>
            {#each areaKeys as k (k)}<option value={k}>{t(domainName(k))} ({perArea[k]})</option>{/each}
          </select>
        </label>
      {/if}
      <button type="button" class="toggle fav" aria-pressed={filter.fav} onclick={() => setFav(!filter.fav)} title={t('Only my favourites')}>★ {t('Favourites')} <small>{tab === 'wishlist' ? favN.wishlist : favN.inventory}</small></button>
      <!-- v0.24.1 (Noah 5a): select several items for one change -->
      <button type="button" class="toggle fav pick" aria-pressed={selecting} onclick={() => setSelecting(!selecting)}>{selecting ? t('Done') : t('Select')}</button>
      {#if !phone.matches}
        <label>
          <!-- v0.32.0 (finding 5, stage 1): "Comes along" instead of "Role". -->
          <span class="lbl">{t('Comes along')}</span>
          <select class="sel" bind:value={filter.role}>
            <option value="">{t('All items')}</option>
            <option value="standard">{t('Standard|block')}</option>
            <option value="worn">{t('On me')}</option>
            <option value="night">{t('In a building block')}</option>
            <option value="optional">{t('Stays at home')}</option>
            <option value="none">{t('Nothing set')}</option>
          </select>
        </label>
        <div class="acts"><button type="button" class="btn hi" onclick={() => addItem()}>{t('Add item')}</button></div>
      {/if}
    </div>
    {#if fill && tab === 'inventory'}
      <p class="unused-f fillbar"><span>{t('Add to "{block}": tick the items, then "Into {block}" below. Only items not in it are shown.', { block: fill.name })}</span> <a class="btn sm" href="#/blocks" onclick={() => endFill()}>{t('Back to building blocks')}</a></p>
    {/if}
    {#if selecting}
      <div class="selrow">
        <b class="num" aria-live="polite">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
        <button type="button" class="btn" disabled={!shown.length || allPicked(shown)} onclick={() => pickAll(shown, true)}>{t('Select all')}</button>
        <button type="button" class="btn" disabled={!chosen.length} onclick={() => pickAll(shown, false)}>{t('Select none')}</button>
      </div>
    {/if}

    {#if tab === 'inventory'}
      <div class="inv">
        {#if !phone.matches}
          <nav class="side" aria-label={t('Jump to a category')}>
            <span class="lbl">{t('Categories')}</span>
            <ul>
              {#each groups as g (g.key)}
                <li><button type="button" onclick={() => jump(g.key)}><span class="sw" style:background={g.color}></span><span class="n">{t(g.name)}</span><span class="num">{knownWeight(catStats[g.key].g, catStats[g.key].unweighed)}</span></button></li>
              {/each}
            </ul>
          </nav>
        {/if}
        <div class="list">
          {#if unusedOnly}
            <!-- v0.25.1 (Noah 1a): the filter says what it shows and goes away with one tap -->
            <p class="unused-f"><span>{unused?.full === false ? t('Only items on no trip since {date}', { date: new Date(`${unused.since}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) }) : t('Only items on no trip for 12 months')}</span> <button type="button" class="btn sm" onclick={() => setUnused(false)}>{t('Show all items')}</button></p>
          {/if}
          <!-- v0.38.0: the count and "Compact | With bag" share one line (one header row less). -->
          <div class="viewbar">
            <p class="count num" aria-live="polite">
              {t('{a} of {b} items', { a: inventory.length, b: stats.inventory.length })}
              {#if !searching && groups.length}<button type="button" class="link tap" onclick={() => setAll(allOpen)}>{allOpen ? t('Collapse all') : t('Expand all')}</button>{/if}
              <!-- v0.21.0: every favourite by area, read-only and printable -->
              {#if filter.fav}<a class="favlink" href="#/favorites">{t('All favourites')} →</a>{/if}
            </p>
            <span class="seg" role="group" aria-label={t('Show the bag')}>
              <button type="button" aria-pressed={!showBag} onclick={() => setShowBag(false)}>{t('Compact')}</button>
              <button type="button" aria-pressed={showBag} onclick={() => setShowBag(true)}>{t('With bag')}</button>
            </span>
          </div>
          {#if toWeigh && !selecting && !searching}
            <!-- v0.43.0 (Wiege-Modus): one quiet row, no alarm -->
            <p class="weighrow"><button type="button" class="link tap" onclick={startWeigh}>{t('{n} without weight · weigh', { n: toWeigh })}</button></p>
          {/if}
          {#if filter.fav}
            <!-- v0.22.0 (AP05): what the favourites number counts, and where the others are. -->
            <p class="favbase">
              {tn(favN.inventory, '{n} favourite in your inventory', '{n} favourites in your inventory')}{#if favN.wishlist}{' · '}<button type="button" class="link" onclick={() => (tab = 'wishlist')}>{tn(favN.wishlist, '{n} on the wishlist', '{n} on the wishlist')}</button>{/if}{#if favN.gone}{' · '}{tn(favN.gone, '{n} gone', '{n} gone')}{/if}
            </p>
          {/if}
          <div class="cats">
            {#each groups as g (g.key)}
              <section class="cat" aria-labelledby="gh-{g.key}">
                <h2 id="gh-{g.key}" class="ch">
                  <button type="button" aria-expanded={isOpen(g.key)} disabled={searching} onclick={() => toggle(g.key)}>
                    <span class="sw" style:background={g.color}></span>
                    <span class="title">{t(g.name)}</span>
                    <b class="num k">{knownWeight(catStats[g.key].g, catStats[g.key].unweighed)}</b>
                    <span class="m">{tn(catStats[g.key].n, '{n} item', '{n} items')}{catStats[g.key].unweighed ? ` · ${t('{n} not weighed', { n: catStats[g.key].unweighed })}` : ''}{catStats[g.key].consumable ? ` · ${t('not in gear weight')}` : ''}</span>
                    {#if !searching}<span class="chev" aria-hidden="true">▾</span>{/if}
                  </button>
                </h2>
                {#if selecting}
                  <!-- v0.24.1 (Noah 5a): the whole category at once, also while it is folded -->
                  {@const all = allPicked(g.items)}
                  <button type="button" class="link gpick" aria-label={all ? t('Select none: {cat}', { cat: t(g.name) }) : t('Select all: {cat}', { cat: t(g.name) })} onclick={() => pickAll(g.items, !all)}>{all ? t('Select none') : t('Select all')}</button>
                {/if}
                {#if isOpen(g.key)}
                  {#if g.unknown}<p class="unknown-cat">{t('The app does not know the category of these items. Open one and pick a category.')}</p>{/if}
                  <ul class="rows">
                    {#each g.items as item (item.id)}
                      {#if !selecting}
                        <GearRow {item} {showBag} {touch} {swiped} used={(usedN[item.id] ?? 0) > 0} onswipe={(id) => (swiped = id)} onopen={open} onmenu={(it) => (rowMenu = it)} onassign={assignOne} onarchive={archiveOne} ondelete={deleteOne} />
                      {:else}
                      <li class="fr">
                        {#if selecting}
                          {@render pickRow(item, BAG[item.defaultBag] ? t(BAG[item.defaultBag]) : '–')}
                        {/if}
                      </li>
                      {/if}
                    {/each}
                  </ul>
                {/if}
              </section>
            {:else}
              {#if items.length && filter.fav && !favN.inventory}
                <p class="card">{t('No favourites in your inventory yet. Tap the ☆ in front of an item to mark it.')} <button type="button" class="btn" onclick={clearFilters}>{t('Show all items')}</button></p>
              {:else if items.length}{@render nothing()}{/if}
            {/each}
          </div>
        </div>
      </div>
      <!-- v0.23.0 (AP08): the analyses come after the list, in one fold that starts closed. -->
      <details class="analysis" bind:open={analysis}>
        <summary><span class="title">{t('Analysis')}</span> <small>{t('Weight by category and the heaviest items')}</small></summary>
        {#if analysis}<WeightOverview {stats} category={filter.category} onpick={pickCategory} onopen={open} />{/if}
      </details>
    {:else}
      <section class="wish" aria-labelledby="wish-h">
        <h2 id="wish-h" class="title">{t('Wishlist & to buy')}</h2>
        <p class="sub">{t('Not owned yet. Not counted in the inventory or any total. Sorted by what helps most: missing on trips, needed on the bike, lighter.')}</p>
        <ul class="rows">
          {#each wishlist as { item, reasons } (item.id)}
            <li class="fr">
              {#if selecting}
                {@render pickRow(item, `${t(OWNERSHIP[item.ownership] ?? '')} · ${t(CATEGORY[item.category]?.name ?? '')}`)}
              {:else}
                <FavStar {item} describedby="gn-{item.id}" />
                <button type="button" onclick={() => open(item)}>
                  <span class="st st-{item.ownership}">{t(OWNERSHIP[item.ownership] ?? '')}</span>
                  <span class="nm" id="gn-{item.id}">{nameOf(item)}{#if reasons.length}<small class="why">{reasons.join(' · ')}</small>{/if}</span>
                  <span class="bg">{t(CATEGORIES.find((c) => c.key === item.category)?.name ?? '')}</span>
                  <span class="w num" class:muted={item.weightG == null}>{item.weightG == null ? '–' : formatWeight(itemWeight(item))}</span>
                </button>
              {/if}
            </li>
          {:else}
            <li class="empty">{filter.fav ? t('No favourites on the wishlist.') : t('No wishlist items match.')}{#if filter.q.trim() && !filter.fav}{' '}<button type="button" class="btn sm" onclick={() => addItem({ name: filter.q.trim() })}>{t('Add "{q}" as a new item', { q: filter.q.trim() })}</button>{/if}</li>
          {/each}
        </ul>
      </section>
      {#if stats.gone.length}
        <details class="gone">
          <summary>{t('Gone')} ({stats.gone.length}) <small>{t('kept for the record, not in any list or total')}</small></summary>
          <ul class="rows">
            {#each stats.gone as item (item.id)}
              <li><button type="button" onclick={() => open(item)}><span class="nm">{nameOf(item)}</span><span class="bg">{item.note ?? ''}</span><span class="w num muted">–</span></button></li>
            {/each}
          </ul>
        </details>
      {/if}
    {/if}
  {/if}
</div>

{#snippet nothing()}
  <!-- v0.23.0 (AP08): zero results offer to add what was searched for. -->
  <div class="card none">
    <p><b>{t('Nothing found.')}</b>{#if filter.q.trim()}{' '}{t('No item matches "{q}".', { q: filter.q.trim() })}{/if}</p>
    <div class="acts">
      {#if filter.q.trim()}<button type="button" class="btn hi" onclick={() => addItem({ name: filter.q.trim() })}>{t('Add "{q}" as a new item', { q: filter.q.trim() })}</button>{/if}
      <button type="button" class="btn" onclick={clearFilters}>{t('Clear search and filters')}</button>
    </div>
  </div>
{/snippet}

{#snippet pickRow(item, sub)}
  <!-- v0.24.1 (Noah 5a): in "Select" a tap anywhere on the row ticks its box. -->
  <label class="pr" class:on={picked.has(item.id)}>
    <input type="checkbox" checked={picked.has(item.id)} onchange={() => flip(item.id)} aria-label={nameOf(item)} />
    <span class="nm">{nameOf(item)}{#if item.qty > 1}<small> × {item.qty}</small>{/if}</span>
    <span class="bg">{sub}</span>
    <span class="w num" class:nw={item.weightG == null}>{item.weightG == null ? '–' : formatWeight(itemWeight(item))}</span>
  </label>
{/snippet}

{#if (selecting && (tab === 'inventory' || tab === 'wishlist')) || undo}
  <!-- v0.24.1 (Noah 5a): the actions for the selected items, at the bottom above the phone bar. -->
  <div class="bulkpad" aria-hidden="true"></div>
  <div class="bulk" role="region" aria-label={t('Selected items')}>
    {#if undo}
      <p class="undo" role="status"><span>{undo.text}</span> {#if undo.snap}<button type="button" class="btn hi" onclick={doUndo}>{t('Undo')}</button>{/if}</p>
    {/if}
    {#if selecting && (tab === 'inventory' || tab === 'wishlist')}
      <div class="bacts">
        <b class="num">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
        {#if fill}
          <!-- v0.26.0 (Noah 2a): "+ Add items" of a building block -->
          <button type="button" class="btn hi" disabled={!chosen.length || busy} onclick={fillIn}>{t('Into {block}', { block: fill.name })}</button>
        {:else}
          <!-- v0.43.0 (Mehrfachauswahl): the most used actions in sight, the rest under •••. -->
          <button type="button" class="btn" disabled={!chosen.length || busy} onclick={() => openAssign('into')}>{t('Into a building block …')}</button>
          {#if !phone.matches}
            <button type="button" class="btn" disabled={!chosen.length || busy} onclick={() => openAssign('bag')}>{t('Default bag …')}</button>
            <button type="button" class="btn" disabled={!chosen.length || busy} onclick={archiveSel}>{t('Archive')}</button>
          {/if}
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <details class="more" bind:this={moreEl} onkeydown={(e) => e.key === 'Escape' && (closeMore(), moreEl.querySelector('summary')?.focus())}>
            <summary class="btn" aria-label={t('More actions')}>•••</summary>
            <div class="menu">
              <button type="button" disabled={!chosen.length || busy} onclick={() => openAssign('out')}>{t('Out of a building block …')}</button>
              {#if phone.matches}<button type="button" disabled={!chosen.length || busy} onclick={() => openAssign('bag')}>{t('Default bag …')}</button>{/if}
              <button type="button" disabled={!chosen.length || busy} onclick={() => openAssign('area')}>{t('Area …')}</button>
              <button type="button" disabled={!chosen.length || busy} onclick={() => openAssign('category')}>{t('Category …')}</button>
              <button type="button" disabled={!chosen.length || busy} onclick={() => openAssign('trip')}>{t('Onto a trip …')}</button>
              <button type="button" disabled={!chosen.length || busy} onclick={() => openAssign('template')}>{t('Into a template …')}</button>
              {#if tab === 'wishlist'}
                <button type="button" disabled={!chosen.length || busy} onclick={() => own('owned')}>{t('To my gear')}</button>
              {:else}
                <button type="button" disabled={!chosen.length || busy} onclick={() => own('wishlist')}>{t('To wishlist')}</button>
              {/if}
              {#if phone.matches}<button type="button" disabled={!chosen.length || busy} onclick={archiveSel}>{t('Archive')}</button>{/if}
              <button type="button" class="del" disabled={!chosen.length || busy} onclick={remove}>{t('Delete')}</button>
            </div>
          </details>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if assign}
  <AssignDialog ids={chosen.map((i) => i.id)} kind={assign} ondone={({ text, snap }) => offerUndo(text, snap)} onclose={() => (assign = null)} />
{/if}

{#if assignItem}
  <AssignDialog ids={[assignItem.id]} item={assignItem} onclose={() => (assignItem = null)} />
{/if}

<!-- v0.38.0 (Noah 4a): ••• on a row: every action, also without swiping (keyboard, screen reader). -->
<dialog class="sheet rowmenu" class:phone={phone.matches} bind:this={menuDlg} onclose={() => (rowMenu = null)} aria-labelledby="rm-h">
  {#if rowMenu}
    {@const used = (usedN[rowMenu.id] ?? 0) > 0}
    <div class="rmh"><h2 id="rm-h" class="title">{nameOf(rowMenu)}</h2><span class="num">{rowMenu.weightG == null ? '–' : formatWeight(itemWeight(rowMenu))}</span></div>
    <ul>
      <li><button type="button" onclick={() => favOne(rowMenu)}><span>{rowMenu.favorite ? t('Remove from favourites') : t('Mark as favourite')}</span></button></li>
      <li><button type="button" onclick={() => assignOne(rowMenu)}><span>{t('Assign …')}</span><small>{t('Building block, trip, bag')}</small></button></li>
      <li><button type="button" onclick={() => ((dialog = { item: rowMenu }), (rowMenu = null))}><span>{t('Open and edit')}</span></button></li>
      {#if used}
        <li><button type="button" onclick={() => archiveOne(rowMenu)}><span>{t('Archive')}</span><small>{t('Status "Gone", stays in the look back')}</small></button></li>
      {:else}
        <li><button type="button" class="del" onclick={() => deleteOne(rowMenu)}><span>{t('Delete')}</span><small>{t('with Undo')}</small></button></li>
      {/if}
    </ul>
    {#if used}<p class="rmn">{tn(usedN[rowMenu.id], 'On {n} trip: delete it for good in the item itself.', 'On {n} trips: delete it for good in the item itself.')}</p>{/if}
    <div class="rmf"><button type="button" class="btn" onclick={() => (rowMenu = null)}>{t('Close')}</button></div>
  {/if}
</dialog>

<!-- v0.43.0: a tap outside closes the ••• menus -->
<svelte:window onclick={(e) => { if (moreEl?.open && !moreEl.contains(e.target)) moreEl.open = false; if (gmoreEl?.open && !gmoreEl.contains(e.target)) gmoreEl.open = false; }} />

{#if dialog}
  <ItemDialog item={dialog.item} {items} preset={dialog.preset ?? {}} readOnly={phone.matches && !!dialog.item} onclose={() => (dialog = null)} />
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
  /* v0.22.0 (AP03): page title from the type scale (was 56–88 px condensed capitals). */
  .head .title {
    max-width: 100%;
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
  /* The big numbers keep the condensed face: a small accent of the outdoor identity. */
  .kpis b,
  .kpis :global(.sum b) {
    font-family: var(--font-brand);
    font-weight: 800;
    font-size: 32px;
    line-height: 1.05;
  }
  @media (max-width: 719px) {
    .kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: 100%;
      gap: 8px;
    }
    .kpis div {
      min-width: 0;
    }
    .kpis b,
    .kpis :global(.sum b) {
      font-size: 26px;
    }
    .kpis .tot {
      grid-column: span 2;
    }
    .kpis .lbl {
      font-size: var(--fs-small);
      line-height: 1.25;
      hyphens: auto;
      overflow-wrap: break-word;
    }
  }
  /* v0.22.0 (AP03): 14 px labels need two rows of numbers on the narrowest phones. */
  @media (max-width: 379px) {
    .kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)); /* v0.21.0: tabs may shrink below their label width */
    gap: 1px;
    background: var(--line);
    border: 1.5px solid var(--line-strong);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 16px;
  }
  @media (min-width: 720px) {
    .tabs {
      max-width: 780px;
    }
  }
  /* v0.22.0 (AP03): words are never cut inside a tab; very narrow phones get 3 + 2 tabs. */
  @media (max-width: 520px) {
    .tabs button {
      font-size: 13.5px;
      line-height: 1.2;
      text-align: center;
      padding: 8px 2px;
    }
  }
  /* v0.27.0 (AP21): 3 + 2 tabs up to 459 px; at 390 px "Wunschliste" was cut in five columns. */
  @media (max-width: 459px) {
    .tabs {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
    .tabs button {
      grid-column: span 2;
    }
    .tabs button:nth-child(n + 4) {
      grid-column: span 3;
    }
  }
  .tabs button {
    border: 0;
    background: var(--paper);
    padding: 8px 4px;
    font: 500 15px/1.3 var(--font-body);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  .tabs button[aria-selected='true'] {
    background: var(--ink);
    color: var(--paper);
    font-weight: 600;
  }
  .tabs small {
    font-weight: 400;
    font-size: var(--fs-small);
  }
  .toolbar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    align-items: end;
    margin-bottom: 8px;
  }
  .fav {
    border: 1.5px solid var(--line-strong);
    background: var(--paper);
    border-radius: 999px;
    padding: 7px 12px;
    font: 500 var(--fs-label) var(--font-body);
    min-height: 40px;
    color: var(--ink);
    cursor: pointer;
    justify-self: start;
    white-space: nowrap;
  }
  /* v0.45.0 (acceptance follow-up 3): 44 px on touch ("Select", favourites, the toggles). */
  @media (pointer: coarse) {
    .fav,
    .seg button {
      min-height: 44px;
    }
  }
  .fav[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }
  .fav small {
    font-weight: 400;
    opacity: 0.8;
  }
  /* v0.38.0: search and category on one line (one header row less); the toggles below. */
  .toolbar {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
  .toolbar.areas .q {
    grid-column: 1 / -1;
  }
  /* v0.22.0 (AP03): on the narrowest phones the category list gets the full width. */
  @media (max-width: 339px) {
    .toolbar {
      grid-template-columns: 1fr;
    }
  }
  /* The search stays at the top while you scroll (desktop). */
  @media (min-width: 720px) {
    .toolbar {
      position: sticky;
      top: 46px;
      z-index: 2;
      background: var(--ground);
      padding: 6px 0;
      /* v0.24.1 (Noah 5a): one more auto column for "Select" */
      grid-template-columns: minmax(200px, 2fr) 1fr auto auto 1fr auto;
    }
    .toolbar.areas {
      grid-template-columns: minmax(200px, 2fr) 1fr 1fr auto auto 1fr auto;
    }
    .toolbar .q,
    .toolbar.areas .q {
      grid-column: auto;
    }
  }
  .acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .favlink {
    margin-left: 12px;
    font-weight: 700;
    color: var(--ink);
  }
  .count {
    color: var(--ink-3);
    font-size: 14px;
    margin: 6px 0 12px;
  }
  .cat {
    margin-bottom: 20px;
  }
  /* v0.22.0 (AP03): a thin line under the category instead of a 3 px bar. */
  .ch {
    margin: 0;
    border-bottom: 1px solid var(--line-strong);
  }
  /* v0.38.0 (Noah 2a): one line: name, count (and how many not weighed), weight. */
  .ch button {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto;
    align-items: baseline;
    gap: 0 8px;
    width: 100%;
    padding: 0 0 4px;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  /* v0.44.1 (AP21): on a touch screen the category head is a 44 px target (it was 28 px) */
  @media (pointer: coarse) {
    .ch button {
      min-height: 44px;
      align-content: end;
    }
  }
  .ch button:disabled {
    cursor: default;
  }
  .ch .title {
    font-size: var(--fs-sub);
    font-weight: 600;
    min-width: 0;
  }
  .ch .k {
    font-size: 16px;
  }
  .ch .m {
    grid-column: 3;
    grid-row: 1;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .ch .k {
    grid-column: 4;
    grid-row: 1;
    text-align: right;
  }
  .ch .sw {
    align-self: center;
  }
  .ch .chev {
    grid-column: 5;
    grid-row: 1;
    font-size: 16px;
    transition: transform 0.15s;
  }
  .ch button[aria-expanded='false'] .chev {
    transform: rotate(-90deg);
  }
  /* v0.45.0 (acceptance follow-up 6): on a narrow phone the count line goes under the name and the
     weight stays on the right, so the head is two lines instead of four. */
  @media (max-width: 479px) {
    .ch button {
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      gap: 0 8px;
    }
    .ch .title {
      grid-column: 2;
      grid-row: 1;
    }
    .ch .k {
      grid-column: 3;
      grid-row: 1;
      white-space: nowrap;
    }
    .ch .chev {
      grid-column: 4;
      grid-row: 1;
    }
    .ch .m {
      grid-column: 2 / 4;
      grid-row: 2;
    }
  }
  @media (min-width: 720px) {
    .ch button {
      grid-template-columns: auto auto 1fr auto auto;
    }
    .ch .m {
      grid-column: 3;
      grid-row: 1;
    }
    .ch .k {
      grid-column: 4;
    }
    .ch .chev {
      grid-column: 5;
    }
  }
  .link {
    margin-left: 10px;
    border: 0;
    background: none;
    padding: 0;
    font: inherit;
    color: var(--ink);
    text-decoration: underline;
    cursor: pointer;
  }
  /* v0.22.0 (AP05): the star button sits before the row's own button. */
  .rows .fr {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--line);
  }
  .rows .fr > button {
    flex: 1;
    min-width: 0;
    border-bottom: 0;
  }
  .rows .fr .nm {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .favbase {
    margin: -4px 0 10px;
    font-size: 14px;
    color: var(--ink-2);
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
    background: var(--paper);
  }
  .rows button {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
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
  @media (hover: hover) {
    .rows button:hover {
      background: var(--paper-2);
    }
  }
  .rows .nm {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .rows .bg {
    grid-column: 1;
    grid-row: 2;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .rows .w {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    font-weight: 700;
    text-align: right;
  }
  /* v0.27.0 (Noah 1a): hint in the group of unknown categories */
  .unknown-cat {
    margin: 4px 0 8px;
    font-size: 14px;
    color: var(--ink-3);
  }
  .rows .muted {
    color: var(--ink-3);
    font-weight: 400;
  }
  .rows .nw {
    color: var(--ink-3);
    font-weight: 500;
    font-size: var(--fs-small);
  }
  @media (min-width: 720px) {
    .rows button {
      grid-template-columns: minmax(0, 1fr) minmax(0, 150px) 80px;
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
  .gone {
    margin-top: 18px;
  }
  /* v0.38.0 (Noah 1a): "Compact | With bag", a segmented toggle above the list */
  .viewbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 12px;
    margin: 0 0 8px;
  }
  .viewbar .count {
    margin: 0;
  }
  .seg {
    display: inline-flex;
    border: 1.5px solid var(--line-strong);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    min-height: 40px;
    padding: 4px 14px;
    border: 0;
    background: var(--paper);
    color: var(--ink);
    font: 500 14px var(--font-body);
    cursor: pointer;
  }
  .seg button + button {
    border-left: 1.5px solid var(--line-strong);
  }
  .seg button[aria-pressed='true'] {
    background: var(--ink);
    color: var(--paper);
  }
  @media (pointer: coarse) {
    .seg button {
      min-height: 44px;
    }
  }
  .rowmenu ul {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }
  .rowmenu li {
    border-bottom: 1px solid var(--line);
  }
  .rowmenu li button {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 2px 12px;
    width: 100%;
    min-height: 48px;
    padding: 10px 2px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 500 16px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .rowmenu li button:hover,
  .rowmenu li button:focus-visible {
    background: var(--paper-2);
  }
  .rowmenu li button small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 400;
  }
  .rowmenu .del {
    color: var(--bad);
  }
  .rmh {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .rmh h2 {
    font-size: var(--fs-sub);
  }
  .rmn {
    margin: 10px 0 0;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .rmf {
    margin-top: 12px;
  }
  .rowmenu.phone {
    margin: auto 0 0;
    width: 100vw;
    max-width: 100vw;
    border-radius: 16px 16px 0 0;
    padding-bottom: calc(18px + env(safe-area-inset-bottom));
  }
  /* v0.23.0 (AP08): the folded analyses under the list. */
  .analysis {
    margin-top: 24px;
    border-top: 1px solid var(--line-strong);
    padding-top: 10px;
  }
  .analysis summary {
    list-style: none;
    cursor: pointer;
    min-height: 44px;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 2px 10px;
  }
  .analysis summary::-webkit-details-marker {
    display: none;
  }
  .analysis summary::before {
    content: '▸' / ''; /* v0.27.0 (AP21): only a picture, screen readers skip it */
    margin-right: 2px;
    transition: transform 0.15s;
  }
  .analysis[open] summary::before {
    transform: rotate(90deg);
  }
  .analysis summary .title {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .analysis summary small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none p {
    margin: 0 0 10px;
    overflow-wrap: anywhere;
  }
  .none .btn {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
    text-align: left;
  }
  /* Desktop: a side column to jump between categories, categories in two columns (G1). */
  @media (min-width: 720px) {
    .inv {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: 28px;
      align-items: start;
    }
  }
  .side {
    position: sticky;
    top: 130px;
  }
  .side ul {
    list-style: none;
    margin: 6px 0 0;
    padding: 0;
  }
  .side button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    padding: 6px 2px;
    font: inherit;
    font-size: 14px;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .side .n {
    flex: 1;
  }
  .side .num {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  @media (hover: hover) {
    .side button:hover {
      background: var(--paper-2);
    }
  }
  @media (min-width: 1200px) {
    .cats {
      columns: 2;
      column-gap: 28px;
    }
    .cat {
      break-inside: avoid;
    }
  }
  .gone summary {
    cursor: pointer;
    font-weight: 700;
  }
  .gone summary small {
    font-weight: 400;
    color: var(--ink-3);
  }
  .why {
    display: block;
    font-weight: 400;
    font-size: var(--fs-small);
    color: var(--ink-3);
  }
  .unused-f {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 0 0 8px;
    padding: 8px 12px;
    border-left: 3px solid var(--hi);
    background: var(--paper);
    overflow-wrap: anywhere;
  }
  .dead {
    max-width: 1000px;
  }
  .dead h3.title {
    font-size: var(--fs-sub);
    margin-top: 20px;
  }
  .dead .sub {
    color: var(--ink-3);
    margin: 4px 0 10px;
  }
  .drows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .drows li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 4px 12px;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .nmb {
    border: 0;
    background: none;
    padding: 0;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
    min-width: 0;
  }
  .nmb small {
    display: block;
    color: var(--ink-3);
  }
  .ok {
    color: var(--ink-3);
  }
  @media (max-width: 520px) {
    .drows li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .drows li .btn,
    .drows li .ok {
      grid-column: 1 / -1;
      justify-self: start;
    }
  }
  .wish {
    margin-top: 8px;
    padding: 16px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    max-width: 1000px;
  }
  .wish .sub {
    color: var(--ink-3);
    margin: 4px 0 10px;
  }
  .wish .rows {
    background: transparent;
  }
  .wish .rows button {
    grid-template-columns: auto minmax(0, 1fr) auto;
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
    font-size: var(--fs-small);
    font-weight: 500;
    border: 1px solid var(--ink-3);
    border-radius: 99px;
    padding: 1px 8px;
    color: var(--ink-3);
    justify-self: start;
  }
  .st-to-buy {
    border-color: var(--ink);
    color: var(--ink);
  }
  .empty {
    padding: 10px 8px;
    color: var(--ink-3);
  }
  /* v0.24.1 (Noah 5a): selecting several items. */
  .selrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    margin: 4px 0 8px;
  }
  .selrow b {
    margin-right: 4px;
  }
  .gpick {
    display: block;
    margin: 4px 0 2px auto;
    min-height: 32px;
    padding: 4px 0;
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .rows .fr > .pr {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 2px 10px;
    padding: 9px 8px;
    cursor: pointer;
  }
  .pr.on {
    background: var(--paper-2);
  }
  .pr input {
    width: 22px;
    height: 22px;
    margin: 0;
    grid-row: 1 / span 2;
    accent-color: var(--ink);
  }
  .pr .nm {
    grid-column: 2;
  }
  .pr .bg {
    grid-column: 2;
    grid-row: 2;
  }
  .pr .w {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
  /* Room under the list so the bar never covers the last item. */
  .bulkpad {
    height: 210px;
  }
  .bulk {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    background: var(--paper);
    border-top: 1.5px solid var(--line-strong);
    box-shadow: 0 -4px 14px var(--shadow);
    padding: 8px max(12px, calc((100vw - 1560px) / 2)) calc(8px + env(safe-area-inset-bottom));
  }
  /* Phone: above the bottom bar with its raised + button. */
  @media (max-width: 719px) {
    .bulk {
      bottom: calc(76px + env(safe-area-inset-bottom));
      padding-bottom: 8px;
    }
  }
  .bacts,
  .undo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
  .undo {
    padding-bottom: 6px;
  }
  .undo + .bacts {
    border-top: 1px solid var(--line);
    padding-top: 6px;
  }
  .undo span {
    flex: 1 1 180px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .bacts b {
    margin-right: auto;
  }
  .bacts .btn {
    white-space: nowrap;
  }
  /* v0.36.0: the ••• of the page header (Check import). */
  .gmore {
    position: relative;
    display: inline-block;
  }
  .gmore > summary {
    list-style: none;
    min-width: 44px;
    letter-spacing: 1px;
  }
  .gmore > summary::-webkit-details-marker {
    display: none;
  }
  .gmenu {
    position: absolute;
    z-index: 20;
    top: calc(100% + 4px);
    right: 0;
    min-width: 200px;
    max-width: calc(100vw - 32px);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 8px 24px var(--shadow);
    padding: 4px;
  }
  .gmenu a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 6px;
    text-decoration: none;
    white-space: nowrap;
  }
  .gmenu a:hover {
    background: var(--paper-2);
  }
  .gmenu .badge {
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    padding: 1px 8px;
    border-radius: 99px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  /* v0.26.0 (Noah 2b, 6a): the building blocks link in the header, the "More" menu of the bar. */
  .ht {
    /* v0.36.0: the ••• menu opens over the numbers next to it. */
    position: relative;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 14px;
    min-width: 0;
  }
  .blk {
    text-decoration: none;
  }
  /* v0.43.0 (Mehrfachauswahl): ••• in the bar opens a short list upwards, over the page. */
  .more {
    position: relative;
  }
  .more summary {
    list-style: none;
    cursor: pointer;
    min-width: 44px;
    letter-spacing: 1px;
  }
  .more summary::-webkit-details-marker {
    display: none;
  }
  .more[open] summary {
    background: var(--paper-2);
  }
  .more .menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    z-index: 6;
    display: grid;
    min-width: 230px;
    max-width: calc(100vw - 24px);
    max-height: min(70vh, 480px);
    overflow-y: auto;
    padding: 4px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 8px;
    box-shadow: 0 8px 24px var(--shadow);
  }
  .more .menu button,
  .gmenu button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
  }
  .gmenu button {
    width: 100%;
  }
  .more .menu button:hover:not(:disabled),
  .gmenu button:hover {
    background: var(--paper-2);
  }
  .more .menu button:disabled {
    color: var(--ink-3);
    cursor: default;
  }
  .more .menu button.del {
    color: var(--bad);
    border-top: 1px solid var(--line);
    border-radius: 0 0 6px 6px;
  }
  .weighrow {
    margin: -4px 0 8px;
    font-size: var(--fs-small);
  }
  .weighrow .link {
    color: var(--ink-2);
  }
  .fillbar {
    margin-top: 4px;
  }
  .btn.danger {
    border-color: var(--bad);
    color: var(--bad);
  }
  @media (max-width: 719px) {
    .bacts b {
      flex: 1 0 100%;
    }
    .bacts > .btn {
      flex: 1 1 auto;
    }
  }
</style>
