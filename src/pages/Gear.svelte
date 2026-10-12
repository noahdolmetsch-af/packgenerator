<script>
  import { take } from '../lib/nav.js';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { phone } from '../lib/media.svelte.js';
  import { untrack } from 'svelte';
  import { SvelteSet, MediaQuery } from 'svelte/reactivity';
  import { gearStats, matches, groupByCategory, formatWeight, knownWeight, itemWeight, favouriteCounts, CATEGORIES, CATEGORY, UNKNOWN_CATEGORY, BAG, BAGS, OWNERSHIP, bulkOwnership, namesList } from '../lib/gear.js';
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
  import { wishReason } from '../lib/insights.js';
  // v0.47.2 «Material-Ansichten» (Noah 6a-9a): seven fixed views, cards with the trips as dots.
  import { materialStats, tripLog, usageOf, inView, viewCounts, sortItems, lighterAlt, viewSummary, onTheWay, VIEWS, NEVER_AFTER, PROVEN_AFTER } from '../lib/gear/material.js';
  import { comesLine } from '../lib/gear/detail.js';
  import MatCard from '../lib/gear/MatCard.svelte';
  import DotsLegend from '../lib/gear/DotsLegend.svelte';
  import ItemLife from '../lib/gear/ItemLife.svelte';
  import FilterSheet from '../lib/gear/FilterSheet.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { catIcon } from '../lib/gear/caticon.js';
  import { localDay } from '../lib/localday.js';
  import { List, TrendingUp, Trophy, Star, PackageX, Scale, Heart, SlidersHorizontal, Plus, ChevronRight, ChevronLeft, Check, Search, Ellipsis } from '@lucide/svelte';
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
  const today = localDay();
  const mstats = $derived(materialStats(items, $tripsQ ?? [], $debriefsQ ?? [], today));
  const mlog = $derived(tripLog($tripsQ ?? [], $debriefsQ ?? []));
  const counts = $derived(viewCounts(items, mstats));
  const debriefN = $derived(mstats.n);
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
  let filter = $state({ q: hashQ.get('q') ?? '', category: hashQ.get('cat') ?? '', role: '', fav: false, domain: hashQ.get('area') ?? '', bag: '' });
  // v0.47.2: the favourites are the view «Lieblingssachen» now (?fav=1 still opens it).
  filter.fav = false;
  /*
   * v0.47.2 «Material-Ansichten» (Noah 6a): seven fixed views instead of the tabs. The view lives in
   * the address (?view=), so back, forward and a reload keep it; the old ?tab=wishlist, ?tab=dead
   * and ?fav=1 open the matching view. Weighing and checking are modes (?tab=weigh, ?tab=check),
   * opened from the page header and its ••• menu.
   */
  const VIEW_ICON = { all: List, most: TrendingUp, proven: Trophy, fav: Star, never: PackageX, unweighed: Scale, wish: Heart };
  // v0.102.0 Design-Refresh P3 (M1): one short line under each view in the card «Views»
  const VIEW_SUB = { all: 'everything you own', most: 'used on at least half the trips', proven: 'nearly always used', fav: 'your best items', never: 'along often, never used', unweighed: 'no weight yet', wish: 'not owned yet, in no total' };
  const VIEW_NAME = { all: 'All', most: 'Most used', proven: 'Proven', fav: 'Favourite things', never: 'Never used', unweighed: 'Unweighed', wish: 'Wishlist' };
  function viewFrom(params) {
    const v = params.get('view');
    if (VIEWS.includes(v)) return v;
    if (params.get('tab') === 'wishlist') return 'wish';
    if (params.get('tab') === 'dead') return 'never';
    if (params.get('fav') === '1') return 'fav';
    return 'all';
  }
  let view = $state(viewFrom(hashQ));
  let mode = $state(['weigh', 'check'].includes(hashQ.get('tab')) ? hashQ.get('tab') : '');
  function writeHash(edit) {
    const [path, query = ''] = location.hash.split('?');
    const q = new URLSearchParams(query);
    edit(q);
    const s = q.toString();
    history.replaceState(history.state, '', `${path || '#/gear'}${s ? `?${s}` : ''}`);
  }
  function setView(v) {
    view = v;
    mode = '';
    limit = PAGE;
    writeHash((q) => {
      ['tab', 'fav'].forEach((k) => q.delete(k));
      if (v === 'all') q.delete('view');
      else q.set('view', v);
    });
  }
  function setMode(m) {
    mode = m;
    writeHash((q) => (m ? q.set('tab', m) : q.delete('tab')));
    scrollTo({ top: 0 });
  }
  // v0.47.2 (Noah 8a): "Cards · List" (the table of D4 comes later as a third choice), remembered here.
  const DISPLAY = 'gear.display';
  let display = $state(
    (() => {
      try {
        // v0.102.0 Design-Refresh P3 (M1, Noah «5a Liste zuerst»): the list first; the cards stay a choice
        return localStorage.getItem(DISPLAY) === 'cards' ? 'cards' : 'list';
      } catch {
        return 'list';
      }
    })(),
  );
  function setDisplay(d) {
    display = d;
    try {
      localStorage.setItem(DISPLAY, d);
    } catch {
      /* private mode: only this visit */
    }
  }
  // The order of the cards (sort sheet), remembered like the display.
  const SORT = 'gear.sort';
  let sort = $state(
    (() => {
      try {
        return ['taken', 'weight', 'last', 'name'].includes(localStorage.getItem(SORT)) ? localStorage.getItem(SORT) : 'taken';
      } catch {
        return 'taken';
      }
    })(),
  );
  function setSort(v) {
    sort = v;
    try {
      localStorage.setItem(SORT, v);
    } catch {
      /* private mode */
    }
  }
  const PAGE = 24;
  let limit = $state(PAGE);
  let sheet = $state(false);
  // v0.47.2 (Noah 8a): on a wide computer the chosen card shows on the right (the detail column).
  const wideQ = new MediaQuery('min-width: 1200px');
  let picked1 = $state(null);
  // v0.25.1 (Noah 1a): ?unused=1 (Today "Long not used" → Look through) shows only the owned
  // items that were on no trip for 12 months (the same list as the card, know.js).
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const bagsQ = liveQuery(() => db.containers.toArray());
  let unusedOnly = $state(hashQ.get('unused') === '1');
  // v0.43.0 (Wiege-Modus): what still needs the scale: bikes and bags first, then the items (weigh.js).
  const toWeigh = $derived(weighQueue({ items, bikes: $bikesQ ?? [], containers: $bagsQ ?? [], extras: true }).length);
  function startWeigh() {
    if (gmoreEl) gmoreEl.open = false;
    setMode('weigh');
  }
  function startCheck() {
    if (gmoreEl) gmoreEl.open = false;
    setMode('check');
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
    filter = { q: '', category: '', role: '', fav: false, domain: '', bag: '' };
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
  // v0.47.2: what used to be the tab: a mode, else the wishlist or the inventory (the view decides).
  const tab = $derived(mode || (view === 'wish' ? 'wishlist' : 'inventory'));
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
  // v0.47.2: a bag ('bag:<key>') or a building block ('set:<key>') from the side column or the sheet.
  const bagOk = (i) => !filter.bag || (filter.bag.startsWith('bag:') ? i.defaultBag === filter.bag.slice(4) : !!i.sets?.includes(filter.bag.slice(4)));
  const inventory = $derived(stats.inventory.filter((i) => matches(i, filter) && bagOk(i) && inView(view, i, usageOf(mstats, i.id), mstats.n) && (!unusedOnly || unusedIds.has(i.id)) && (!fillKey || !i.sets?.includes(fillKey))));
  // Wishlist sorted by how much it helps (Noah 7a): missing on trips, needed on the bike, lighter.
  const wishlist = $derived(
    stats.wishlist
      .filter((i) => matches(i, filter) && bagOk(i))
      .map((item) => ({ item, ...wishReason(item, items, $tripsQ ?? [], $debriefsQ ?? []) }))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)),
  );
  const groups = $derived(groupByCategory(inventory));
  const catStats = $derived(Object.fromEntries([...stats.cats, stats.other].map((c) => [c.key, c])));
  // While searching or filtering, every matching category is shown open.
  const searching = $derived(!!(filter.q.trim() || filter.category || filter.role || filter.domain || filter.bag || view !== 'all' || unusedOnly));
  // v0.47.2: the cards of the view in the chosen order, a page at a time.
  const viewList = $derived(view === 'wish' ? wishlist.map((w) => w.item) : inventory);
  const sorted = $derived(sortItems(viewList, sort, mstats));
  const reasonsOf = $derived(Object.fromEntries(wishlist.map((w) => [w.item.id, w.reasons])));
  const summary = $derived(viewSummary(viewList, mstats));
  // v0.63.0 (Noah 3a): under an empty «Never used»: taken 1–2 times and never used.
  const onWay = $derived(view === 'never' ? onTheWay(stats.inventory, mstats) : []);
  const altOf = (item) => (item.ownership === 'owned' || item.ownership === 'unclear' ? lighterAlt(item, items) : null);
  const proven = (item) => inView('proven', item, usageOf(mstats, item.id), mstats.n);
  // Selecting works on the list (the rows have the boxes); the cards come back afterwards.
  const shownAs = $derived(selecting ? 'list' : display);
  // v0.102.0 Design-Refresh P3 (M1): the chosen item shows on the right in the list too (computer)
  const showPanel = $derived(wideQ.current && !mode);
  const selItem = $derived(showPanel ? (sorted.find((i) => i.id === picked1) ?? sorted[0] ?? null) : null);
  function pickCard(item) {
    if (showPanel && picked1 !== item.id && selItem?.id !== item.id) return (picked1 = item.id);
    open(item);
  }
  async function leaveAtHome(item) {
    await markHome(item);
  }
  // v0.72.0 (Noah 3a): «Leave at home» in «On the way there», as the debrief does it, with Undo.
  async function homeWithUndo(item) {
    const snap = await saveItems(db, [{ ...$state.snapshot(item), ...leaveHomeFields(item), updatedAt: new Date().toISOString() }]);
    offerUndo(t('"{name}" stays at home: new trips no longer pack it on their own.', { name: nameOf(item) }), snap);
  }
  // The side column and the sheet: categories, bags and building blocks with their counts.
  const base = $derived(view === 'wish' ? stats.wishlist : stats.inventory);
  const catOpts = $derived(CATEGORIES.map((c) => ({ key: c.key, name: t(c.name), color: c.color, n: base.filter((i) => i.category === c.key).length })).filter((c) => c.n));
  const bagOpts = $derived([
    ...BAGS.map((b) => ({ key: `bag:${b.key}`, name: t(b.name), n: base.filter((i) => i.defaultBag === b.key).length, set: false })),
    ...blocks.map((b) => ({ key: `set:${b.key}`, name: t('Set "{name}"', { name: b.builtIn ? t(b.name) : b.name }), n: base.filter((i) => i.sets?.includes(b.key)).length, set: true })),
  ].filter((b) => b.n));
  const areaOpts = $derived(areaKeys.map((k) => ({ key: k, name: t(domainName(k)), n: perArea[k] })));
  const activeN = $derived([filter.category, filter.bag, filter.domain, filter.role].filter(Boolean).length);
  const SORT_NAME = { taken: 'Most along', weight: 'Weight', last: 'Last along', name: 'Name' };
  const VIEW_TEXT = $derived({
    all: t('Everything you own. One dot per trip of the last 12 months.'),
    most: tn(mstats.n, 'Used on at least half of your {n} debriefed trip.', 'Used on at least half of your {n} debriefed trips.'),
    proven: t('Taken {n} times or more and used at least 4 times in 5.', { n: PROVEN_AFTER }),
    fav: t('Marked with a star: tested, your best items.'),
    never: t('Taken {n} times or more and never used. Formerly "Dead weight".', { n: NEVER_AFTER }),
    unweighed: t('No weight yet. Weigh them and your totals are complete.'),
    wish: t('Not owned yet and in no total. Sorted by what helps most: missing on trips, needed on the bike, lighter.'),
  });
  // A new view or filter starts at the first page again.
  $effect(() => {
    void [view, filter.q, filter.category, filter.bag, filter.domain, filter.role, sort];
    untrack(() => (limit = PAGE));
  });
  const isOpen = (key) => searching || !folded[key];
  const allOpen = $derived(groups.every((g) => !folded[g.key]));
  const toggle = (key) => (folded[key] = !folded[key]);
  // v0.45.1 (G012): on the computer an open category first draws its first ROWS_FIRST rows, the rest
  // with one tap ("Show all n"). 700 rows at once took 3–6 s. The phone starts folded and stays as it was.
  const ROWS_FIRST = 12;
  let full = $state({});
  const rowsOf = (g) => (phone.matches || searching || full[g.key] || g.items.length <= ROWS_FIRST + 5 ? g.items : g.items.slice(0, ROWS_FIRST));
  const setAll = (shut) => (folded = Object.fromEntries([...CATEGORIES, UNKNOWN_CATEGORY].map((c) => [c.key, shut])));

  const pickCategory = (key) => (filter.category = filter.category === key ? '' : key);
  // Side column: jump to a category (and open it).
  function jump(key) {
    folded[key] = false;
    full[key] = true;
    queueMicrotask(() => document.getElementById(`gh-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  const open = (item) => (dialog = { item });
  // v0.102.0 Design-Refresh P3 (M1): a row of the list opens the item as before and becomes the chosen one
  // in the right column (computer).
  const openRow = (item) => ((picked1 = item.id), open(item));
  function showAnalysis() {
    analysis = true;
    queueMicrotask(() => document.getElementById('gear-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
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
    mode = '';
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
      if (q != null) (filter.q = q), (mode = ''), (view = 'all');
      if (params.has('view') || params.has('fav') || ['wishlist', 'dead'].includes(params.get('tab'))) view = viewFrom(params);
      if (['weigh', 'check'].includes(params.get('tab'))) mode = params.get('tab');
      unusedOnly = params.get('unused') === '1';
      if (unusedOnly) (mode = ''), (view = 'all');
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
    mode = '';
    view = 'all';
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
  <!-- v0.102.0 Design-Refresh P3 (M1): the title and one line of numbers; the actions sit in the toolbar -->
  <header class="head">
    <div class="ht">
      <h1 class="title">{t('Gear|page')}</h1>
      <!-- v0.47.2 (Noah 6a): one line instead of three numbers: items, known weight, not weighed, debriefs -->
      <p class="page-sub num">
        {[tn(stats.inventory.length, '{n} item', '{n} items'), t('{w} weighed', { w: formatWeight(stats.total) }), stats.totalMissing ? t('{n} not weighed', { n: stats.totalMissing }) : '', debriefN ? tn(debriefN, 'learnt from {n} debrief', 'learnt from {n} debriefs') : ''].filter(Boolean).join(' · ')}
      </p>
    </div>
  </header>

  {#if !items.length && $itemsQuery}
    <p class="card">{t('No gear yet. Import your data on the')} <a href="#/">{t('start page')}</a> {t('(Your data → Import backup), or add an item.')}</p>
  {/if}

  {#if mode}
    <!-- v0.102.0 Design-Refresh P3 (M6): a quiet way back above the mode -->
    <p class="modeback"><button type="button" class="btn btn-link" onclick={() => setMode('')}><ChevronLeft size={18} aria-hidden="true" />{t('Back to all items')}</button></p>
    {#if mode === 'weigh'}
      <WeighMode {items} extras onclose={() => setMode('')} />
    {:else}
      <ReviewMode {items} />
    {/if}
  {:else}
    <div class="mat" class:panel={showPanel}>
      <div class="center">
        <!-- v0.102.0 Design-Refresh P3 (M1): search, «Sort and filter» and «+ Item» in one row; the rest in ••• -->
        <div class="toolbar">
          <label class="q"><span class="sr">{t('Search gear')}</span><Search class="qi" size={18} aria-hidden="true" /><input class="inp" type="search" placeholder={t('Name, brand, bag or ID')} bind:value={filter.q} bind:this={searchEl} /></label>
          <button type="button" class="btn fbtn" onclick={() => (sheet = true)}>
            <SlidersHorizontal size={18} aria-hidden="true" />{t('Sort and filter')}{#if activeN}<i class="badge num">{activeN}</i>{/if}
          </button>
          <button type="button" class="btn hi addb" aria-label={t('Add item')} onclick={() => addItem()}><Plus size={18} aria-hidden="true" />{t('Item|add')}</button>
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <details class="gmore" bind:this={gmoreEl} onkeydown={(e) => e.key === 'Escape' && closeGmore(e)}>
            <summary class="btn" aria-label={t('More for Gear')}><Ellipsis size={18} aria-hidden="true" /></summary>
            <div class="gmenu">
              <!-- v0.43.0 (Wiege-Modus): weigh one thing after the other -->
              <button type="button" onclick={startWeigh}>{t('Record weights')}{#if toWeigh}<i class="badge num">{toWeigh}</i>{/if}</button>
              <!-- v0.47.2: "Check" was a tab; now a mode, one tap from here -->
              <button type="button" onclick={startCheck}>{t('Check items')}{#if toReview}<i class="badge num">{toReview}</i>{/if}</button>
              <!-- v0.66.0 (Noah 4a): «Bausteine prüfen» -->
              <a href="#/blocks/check">{t('Check building blocks')}</a>
              <a href="#/gear/import">{t('Check import')}{#if $stagedQ}<i class="badge num">{$stagedQ.data?.items?.length || t('Step 2')}</i>{/if}</a>
              <!-- v0.26.0 (Noah 2b) / v0.42.0: the building blocks and the wardrobe, also in the sub-navigation -->
              <a href="#/blocks">{t('Building blocks')} →</a>
              <a href="#/wardrobe">{t('Wardrobe')} →</a>
            </div>
          </details>
        </div>
        <!-- one quiet line: how it is sorted, list or cards, select -->
        <div class="metaline">
          <span class="sorted">{t('Sorted: {s}', { s: t(SORT_NAME[sort]) })}</span>
          {@render showAs()}
        </div>

        {#if fill}
          <p class="unused-f fillbar"><span>{t('Add to "{block}": tick the items, then "Into {block}" below. Only items not in it are shown.', { block: fill.name })}</span> <a class="btn sm" href="#/blocks" onclick={() => endFill()}>{t('Back to building blocks')}</a></p>
        {/if}
        {#if unusedOnly}
          <!-- v0.25.1 (Noah 1a): the filter says what it shows and goes away with one tap -->
          <p class="unused-f"><span>{unused?.full === false ? t('Only items on no trip since {date}', { date: new Date(`${unused.since}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' }) }) : t('Only items on no trip for 12 months')}</span> <button type="button" class="btn sm" onclick={() => setUnused(false)}>{t('Show all items')}</button></p>
        {/if}
        {#if selecting}
          <div class="selrow">
            <b class="num" aria-live="polite">{tn(chosen.length, '{n} selected', '{n} selected')}</b>
            <button type="button" class="btn" disabled={!shown.length || allPicked(shown)} onclick={() => pickAll(shown, true)}>{t('Select all')}</button>
            <button type="button" class="btn" disabled={!chosen.length} onclick={() => pickAll(shown, false)}>{t('Select none')}</button>
          </div>
        {/if}

        <!-- v0.47.2 (Noah 6a): every view says in one sentence what it shows -->
        <section class="vhead" aria-labelledby="vh-h">
          <div class="vt">
            <h2 id="vh-h" class="title">{t(VIEW_NAME[view])}</h2>
            <p class="vs">{VIEW_TEXT[view]}</p>
          </div>
          <dl class="vstats">
            <div><dt>{t('Items')}</dt><dd class="num">{summary.n}</dd></div>
            <div><dt>{t('together')}</dt><dd class="num">{knownWeight(summary.g, summary.missing)}</dd></div>
            {#if summary.avgTaken != null}<div><dt>{t('Ø along')}</dt><dd class="num">{summary.avgTaken}×</dd></div>{/if}
            {#if summary.usedShare != null}<div><dt>{t('used')}</dt><dd class="num">{summary.usedShare} %</dd></div>{/if}
          </dl>
        </section>
        {#if view === 'never' && sorted.length}<p class="vs small">{t('"Leave at home" makes it optional: new trips no longer pack it on their own.')}</p>{/if}
        {#if view === 'unweighed' && toWeigh}<p class="weighrow"><button type="button" class="btn" onclick={startWeigh}><Scale size={18} aria-hidden="true" />{t('Weigh one after the other')}</button></p>{/if}

        {#if toWeigh && !selecting && !searching}
          <!-- v0.43.0 (Wiege-Modus): one quiet row, no alarm -->
          <p class="weighrow"><button type="button" class="link tap" onclick={startWeigh}>{t('{n} without weight · weigh', { n: toWeigh })}</button></p>
        {/if}
        {#if shownAs === 'cards'}
          {#if sorted.length}
            <div class="cards">
              {#each sorted.slice(0, limit) as item (item.id)}
                <MatCard {item} u={usageOf(mstats, item.id)} alt={altOf(item)} proven={proven(item)} {view} selected={selItem?.id === item.id} reasons={reasonsOf[item.id] ?? []} onopen={pickCard} onhome={leaveAtHome} />
              {/each}
            </div>
            <div class="cfoot">
              {#if mstats.months && view !== 'wish'}<DotsLegend />{/if}
              {#if sorted.length > limit}<button type="button" class="btn" onclick={() => (limit += PAGE)}>{t('{n} more', { n: sorted.length - limit })}</button>{/if}
            </div>
          {:else if items.length}
            {@render emptyView()}
          {/if}
        {:else if tab === 'inventory'}
          <!-- The list (v0.38.0): the categories with their rows, swipe and ••• as before. -->
          <div class="viewbar">
            <p class="count num" aria-live="polite">
              {t('{a} of {b} items', { a: inventory.length, b: stats.inventory.length })}
              {#if !searching && groups.length}<button type="button" class="link tap" onclick={() => setAll(allOpen)}>{allOpen ? t('Collapse all') : t('Expand all')}</button>{/if}
              {#if view === 'fav'}<a class="favlink" href="#/favorites">{t('All favourites')} →</a>{/if}
            </p>
            <span class="seg" role="group" aria-label={t('Show the bag')}>
              <button type="button" aria-pressed={!showBag} onclick={() => setShowBag(false)}>{t('Compact')}</button>
              <button type="button" aria-pressed={showBag} onclick={() => setShowBag(true)}>{t('With bag')}</button>
            </span>
          </div>
          <div class="cats">
            {#each groups as g (g.key)}
              {@const GIcon = catIcon(g.key)}
              <section class="cat" aria-labelledby="gh-{g.key}">
                <h2 id="gh-{g.key}" class="ch">
                  <button type="button" aria-expanded={isOpen(g.key)} disabled={searching} onclick={() => toggle(g.key)}>
                    <span class="gic" aria-hidden="true"><GIcon size={18} /></span>
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
                  {@const rows = rowsOf(g)}
                  <ul class="rows">
                    {#each rows as item (item.id)}
                      {#if !selecting}
                        <GearRow {item} {showBag} {touch} {swiped} u={usageOf(mstats, item.id)} selected={showPanel && selItem?.id === item.id} used={(usedN[item.id] ?? 0) > 0} onswipe={(id) => (swiped = id)} onopen={openRow} onmenu={(it) => (rowMenu = it)} onassign={assignOne} onarchive={archiveOne} ondelete={deleteOne} />
                      {:else}
                        <li class="fr">{@render pickRow(item, BAG[item.defaultBag] ? t(BAG[item.defaultBag]) : '–')}</li>
                      {/if}
                    {/each}
                  </ul>
                  {#if rows.length < g.items.length}
                    <button type="button" class="link tap allrows" aria-label={`${t(g.name)}: ${t('Show all {n}', { n: g.items.length })}`} onclick={() => (full[g.key] = true)}>{t('Show all {n}', { n: g.items.length })}</button>
                  {/if}
                {/if}
              </section>
            {:else}
              {#if items.length}{@render emptyView()}{/if}
            {/each}
          </div>
          {#if mstats.months && groups.length}<div class="lgd"><DotsLegend /></div>{/if}
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
                    <button type="button" class:wl={item.ownership === 'wishlist'} onclick={() => open(item)}>
                      <span class="st st-{item.ownership}">{t(OWNERSHIP[item.ownership] ?? '')}</span>
                      <span class="nm" id="gn-{item.id}">{nameOf(item)}{#if reasons.length}<small class="why">{reasons.join(' · ')}</small>{/if}</span>
                      <span class="bg">{t(CATEGORIES.find((c) => c.key === item.category)?.name ?? '')}</span>
                      <span class="w num" class:muted={item.weightG == null}>{item.weightG == null ? '–' : formatWeight(itemWeight(item))}</span>
                    </button>
                  {/if}
                </li>
              {:else}
                <li class="empty">{t('No wishlist items match.')}{#if filter.q.trim()}{' '}<button type="button" class="btn sm" onclick={() => addItem({ name: filter.q.trim() })}>{t('Add "{q}" as a new item', { q: filter.q.trim() })}</button>{/if}</li>
              {/each}
            </ul>
          </section>
        {/if}

        {#if view === 'wish' && stats.gone.length}
          <details class="gone">
            <summary>{t('Gone')} ({stats.gone.length}) <small>{t('kept for the record, not in any list or total')}</small></summary>
            <ul class="rows">
              {#each stats.gone as item (item.id)}
                <li><button type="button" onclick={() => open(item)}><span class="nm">{nameOf(item)}</span><span class="bg">{item.note ?? ''}</span><span class="w num muted">–</span></button></li>
              {/each}
            </ul>
          </details>
        {/if}
        {#if view === 'all'}
          <!-- v0.23.0 (AP08): the analyses come after the list, in one fold that starts closed. -->
          <details class="analysis" id="gear-analysis" bind:open={analysis}>
            <summary><span class="title">{t('Analysis')}</span> <small>{t('Weight by category and the heaviest items')}</small></summary>
            {#if analysis}<WeightOverview {stats} category={filter.category} onpick={pickCategory} onopen={open} />{/if}
          </details>
        {/if}
      </div>

      <!-- v0.102.0 Design-Refresh P3 (M1): the right column: the chosen item, then the views as one card
           (on a phone and a narrow window both come under the list) -->
      <div class="rcol">
        {#if showPanel && selItem}
          <!-- v0.47.2 (Noah 8a): the chosen item in detail; "Open and edit" opens the item window -->
          <aside class="detail" aria-labelledby="det-h">
            <div class="dtitle">
              <h2 id="det-h" class="title">{nameOf(selItem)}</h2>
              <FavStar item={selItem} describedby="det-h" />
            </div>
            <p class="dsub">{[selItem.brand, t(CATEGORY[selItem.category]?.name ?? ''), BAG[selItem.defaultBag] ? t(BAG[selItem.defaultBag]) : '', proven(selItem) ? `★ ${t('Proven')}` : ''].filter(Boolean).join(' · ')}</p>
            <div class="dcard">
              <!-- v0.63.0 (Noah 1a): the numbers, one line on how it comes along, then rows that fold away -->
              <ItemLife item={selItem} {items} stats={mstats} log={mlog} {today} compact folds line={comesLine(selItem, blocks)} />
              <div class="dacts">
                <button type="button" class="btn hi" onclick={() => open(selItem)}>{t('Open and edit')}</button>
                <button type="button" class="btn" onclick={() => assignOne(selItem)}>{t('Assign …')}</button>
              </div>
            </div>
          </aside>
        {/if}
        <section class="vcard" aria-labelledby="views-h">
          <h2 id="views-h" class="title">{t('Views')}</h2>
          {@render viewButtons('vrows')}
        </section>
      </div>
    </div>
  {/if}
</div>

{#snippet showAs()}
  <span class="disp"><Seg label={t('Show as')} full={false} small options={[{ key: 'list', name: t('List') }, { key: 'cards', name: t('Cards') }]} value={display} onchange={setDisplay} /></span>
  <!-- D4 «Material als Tabelle» adds a third choice here: Cards · List · Table -->
  <button type="button" class="btn btn-link selbtn" aria-pressed={selecting} onclick={() => setSelecting(!selecting)}>{selecting ? t('Done') : t('Select')}</button>
{/snippet}

{#snippet viewButtons(kind)}
  <div class="views {kind}" role="group" aria-label={t('Views')}>
    {#each VIEWS as v (v)}
      {@const I = VIEW_ICON[v]}
      <button type="button" class="vbtn" data-view={v} aria-pressed={view === v} aria-describedby="vsub-{v}" onclick={() => setView(v)}><span class="vic" aria-hidden="true"><I size={18} /></span><span class="vm"><span class="vn">{t(VIEW_NAME[v])}</span><span class="vsub" id="vsub-{v}" aria-hidden="true">{t(VIEW_SUB[v])}</span></span> <small class="num">{counts[v]}</small></button>
    {/each}
    {#if view === 'all'}
      <!-- v0.23.0 (AP08): the analyses below the list, one tap from here -->
      <button type="button" class="vbtn" aria-expanded={analysis} aria-controls="gear-analysis" onclick={showAnalysis}><span class="vic" aria-hidden="true"><Scale size={18} /></span><span class="vm"><span class="vn">{t('Weight by category')}</span><span class="vsub">{t('and the heaviest items')}</span></span><ChevronRight size={18} aria-hidden="true" /></button>
    {/if}
  </div>
{/snippet}

{#snippet emptyView()}
  {#if filter.q.trim() || filter.category || filter.bag || filter.domain || filter.role || unusedOnly}
    {@render nothing()}
  {:else if view === 'never'}
    <!-- v0.63.0 (Noah 3a): an empty «Never used» says its rule in one sentence and shows what is on the way there.
         v0.72.0 (Noah 3a): a green check, three numbers, and «On the way there» with 3 dots per item and «Leave at home». -->
    <div class="card none never0">
      {#if debriefN === 0}
        <p>{t('This view fills after your first trip reviews. After every trip the app asks briefly what you used.')} <a class="tolink" href="#/debrief">{t('To the debrief ›')}</a></p>
      {:else}
        <div class="okhead">
          <span class="okic" aria-hidden="true"><Check size={22} /></span>
          <div class="okt">
            <h3 class="okh">{t('Nothing right now that only rides along')}</h3>
            <p>{t('Here go the things you took along {n} times or more and never used.', { n: NEVER_AFTER })}{' '}{debriefN >= NEVER_AFTER ? t('So far you used everything that was along that often at least once.') : tn(debriefN, 'You have reviewed {n} trip so far.', 'You have reviewed {n} trips so far.')}</p>
          </div>
        </div>
        <dl class="ntiles">
          <div><dt>{t('trips reviewed')}</dt><dd class="num">{debriefN}</dd></div>
          <div><dt>{t('on the way there')}</dt><dd class="num">{onWay.length}</dd></div>
          <div><dt>{t('dead weight')}</dt><dd class="num">{formatWeight(0)}</dd></div>
        </dl>
      {/if}
      {#if onWay.length}
        <section class="onway" aria-labelledby="onway-h">
          <h3 id="onway-h" class="owh">{t('On the way there')} <small class="num">{onWay.length}</small></h3>
          <p class="owsub">{t('Along 1 or 2 times and never used. The 3rd time without use puts them up here.')}</p>
          <ul>
            {#each onWay as w (w.item.id)}
              <li class="owrow">
                <button type="button" class="owb" onclick={() => open(w.item)}><span class="nm">{nameOf(w.item)}</span><small class="owcat">{t(CATEGORY[w.item.category]?.name ?? '')}</small></button>
                <span class="owdots" role="img" aria-label={t('{a} of {b} · never used', { a: w.taken, b: NEVER_AFTER })}>
                  {#each Array.from({ length: NEVER_AFTER }, (_, n) => n < w.taken) as on, n (n)}<i class:on></i>{/each}
                  <span class="owc num" aria-hidden="true">{t('{a} of {b} · never used', { a: w.taken, b: NEVER_AFTER })}</span>
                </span>
                {#if leaveHome(w.item)}
                  <span class="owhome">{t('Stays at home')}</span>
                {:else}
                  <button type="button" class="btn sm owgo" aria-label={t('Leave {name} at home', { name: nameOf(w.item) })} onclick={() => homeWithUndo(w.item)}>{t('Leave at home')}</button>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
      <div class="acts"><button type="button" class="btn" onclick={() => setView('all')}>{t('Show all items')}</button></div>
    </div>
  {:else}
    <div class="card none">
      <p>
        {#if view === 'fav'}{t('No favourites in your inventory yet. Tap the ☆ in front of an item to mark it.')}
        {:else if view === 'unweighed'}{t('Everything is weighed.')}
        {:else if view === 'wish'}{t('No wishlist items match.')}
        {:else if view === 'most' || view === 'proven'}{t('Shows up once your debriefs say what you used.')}
        {:else}{t('Nothing found.')}{/if}
      </p>
      {#if view !== 'all'}<div class="acts"><button type="button" class="btn" onclick={() => setView('all')}>{t('Show all items')}</button></div>{/if}
    </div>
  {/if}
{/snippet}

{#if sheet}
  <FilterSheet value={{ sort, category: filter.category, bag: filter.bag, domain: filter.domain, role: filter.role }} count={viewList.length} total={base.length} cats={catOpts} bags={bagOpts} areas={areaOpts} onchange={(p) => { if (p.sort) setSort(p.sort); for (const k of ['category', 'bag', 'domain', 'role']) if (k in p) filter[k] = p[k]; }} onclose={() => (sheet = false)} />
{/if}

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

  /* The big numbers keep the condensed face: a small accent of the outdoor identity. */

  /* v0.22.0 (AP03): 14 px labels need two rows of numbers on the narrowest phones. */

  /* v0.22.0 (AP03): words are never cut inside a tab; very narrow phones get 3 + 2 tabs. */
  
  /* v0.27.0 (AP21): 3 + 2 tabs up to 459 px; at 390 px "Wunschliste" was cut in five columns. */
  
  /* v0.45.0 (acceptance follow-up 3): 44 px on touch ("Select", favourites, the toggles). */
  @media (pointer: coarse) {
    .seg button {
      min-height: 44px;
    }
  }
  /* v0.38.0: search and category on one line (one header row less); the toggles below. */

  /* v0.22.0 (AP03): on the narrowest phones the category list gets the full width. */
  
  /* The search stays at the top while you scroll (desktop). */
  
  .favlink {
    margin-left: 12px;
    font-weight: 700;
    color: var(--ink);
  }
  .cat {
    margin: 0;
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
  .allrows {
    display: block;
    min-height: 44px;
    padding: 0 8px;
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
    overflow-wrap: break-word;
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
    overflow-wrap: break-word;
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
  /* v0.63.0 (Noah 3a): «On the way there» under an empty «Never used» */
  .onway {
    margin: 16px 0 0;
    text-align: left;
  }
  /* v0.72.0 (Noah 3a): the green check, three numbers, dots and «Leave at home». */
  .never0 {
    text-align: left;
  }
  .okhead {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .okic {
    flex: none;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: var(--ok-soft);
    color: var(--ok);
  }
  .okt {
    min-width: 0;
  }
  .okh {
    margin: 2px 0 4px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .okt p {
    margin: 0;
    color: var(--ink-2);
  }
  .ntiles {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 14px 0 0;
  }
  .ntiles div {
    display: flex;
    flex-direction: column-reverse;
    padding: 8px 14px;
    border-radius: 10px;
    background: var(--paper-2);
    min-width: 0;
  }
  .ntiles dd {
    margin: 0;
    font: 800 var(--fs-section) / 1.1 var(--font-brand);
  }
  .ntiles dt {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .owsub {
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .owrow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 14px;
    padding: 4px 0;
  }
  .owrow .owb {
    flex: 1 1 12em;
    width: auto;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
  }
  .owcat {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .owdots {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .owdots i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--warn);
    box-sizing: border-box;
  }
  .owdots i.on {
    background: var(--warn);
  }
  .owgo {
    min-height: 44px;
  }
  .owhome {
    font-size: var(--fs-small);
    font-weight: 600;
    border-radius: 99px;
    padding: 2px 10px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .tolink {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-weight: 600;
    color: var(--accent);
  }
  .owh {
    margin: 0 0 4px;
    font: 600 var(--fs-sub) / 1.3 var(--font-body);
  }
  .owh small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    font-weight: 500;
  }
  .onway ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .onway li + li {
    border-top: 1px solid var(--line);
  }
  .owb {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 2px 12px;
    width: 100%;
    min-height: 44px;
    padding: 6px 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .owb .nm {
    font-weight: 600;
    min-width: 0;
    overflow-wrap: break-word;
  }
  .owc {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .none p {
    margin: 0 0 10px;
    overflow-wrap: break-word;
  }
  .none .btn {
    max-width: 100%;
    white-space: normal;
    overflow-wrap: break-word;
    text-align: left;
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
    overflow-wrap: break-word;
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
  /* v0.45.1 (G007): on the phone a wishlist row in the wishlist needs no "Wishlist" tag; the name gets the room. */
  @media (max-width: 719px) {
    .wish .rows button.wl {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .wish .rows button.wl .st {
      display: none;
    }
    .wish .rows button.wl .nm,
    .wish .rows button.wl .bg {
      grid-column: 1;
    }
    .wish .rows button.wl .w {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
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
    overflow-wrap: break-word;
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

  /* ---------- v0.47.0 «Aufpimpen» (design release D1, Noah 7b, 11a; style sheet «Gletscher») ----------
     A slim tab bar with small counts, the filter labels only for screen readers, the categories as
     calm white cards with a small colour dot, the numbers quiet and right-aligned. */

  /* v0.102.0 Design-Refresh P3 (M1): all groups in one white card, a thin line between them */
  .cats {
    padding: 4px 16px;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
  }
  .cat + .cat {
    border-top: 1px solid var(--line);
  }
  .ch {
    border-bottom: 0;
  }
  .ch button {
    min-height: 52px;
    align-content: center;
    align-items: center;
    padding: 6px 0;
  }
  .ch .title {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  @media (max-width: 420px) {
    /* a long category name on a small phone stays at two calm lines */
    .cats {
      padding: 2px 12px;
    }
    .ch .title {
      line-height: 1.2;
    }
    .ch button {
      padding: 2px 0;
    }
  }
  .ch .k {
    font-weight: 500;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .ch .gic {
    display: grid;
    place-items: center;
    align-self: center;
    color: var(--ink-2);
  }
  .rows {
    border-top: 1px solid var(--line);
  }
  .cat :global(.gr:last-child) {
    border-bottom: 0;
  }
  @media (max-width: 719px) {
    .ht .title {
      flex-basis: 100%;
    }
  }
  .viewbar .seg {
    border: 0;
    padding: 3px;
    border-radius: 12px;
    background: var(--paper-2);
  }
  .viewbar .seg button,
  .viewbar .seg button + button {
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--ink-2);
  }
  .viewbar .seg button[aria-pressed='true'] {
    background: var(--paper);
    color: var(--ink);
    box-shadow: 0 1px 3px var(--shadow);
  }

  /* ---------- v0.47.2 «Material-Ansichten» (Noah 6a-9a): views, cards, detail column ---------- */
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
  .favlink {
    margin-left: 12px;
    font-weight: 700;
    color: var(--ink);
  }
  /* ---------- v0.102.0 Design-Refresh P3 (M1, Noah «M1-M6 freigegeben» 12.10.): list first, one toolbar,
     the chosen item and the views in a right column (computer), under the list on a phone ---------- */
  .head {
    margin-bottom: 16px;
  }
  .ht {
    display: block;
    min-width: 0;
  }
  .ht .page-sub {
    margin: 4px 0 0;
  }
  .modeback {
    margin: 0 0 8px;
  }
  .modeback .btn {
    padding-inline: 4px;
    color: var(--ink-2);
    text-decoration: none;
  }
  .mat {
    display: grid;
    gap: 24px;
    align-items: start;
  }
  @media (min-width: 1200px) {
    .mat {
      grid-template-columns: minmax(0, 1fr) minmax(300px, 400px);
      gap: 24px 28px;
    }
  }
  .center,
  .rcol {
    min-width: 0;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .toolbar .q {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1 1 260px;
    min-width: 0;
  }
  .toolbar .q :global(.qi) {
    position: absolute;
    left: 12px;
    color: var(--ink-3);
    pointer-events: none;
  }
  .toolbar .inp {
    min-height: 44px;
    padding-left: 38px;
    border-radius: var(--r-ctl);
    background: var(--paper);
  }
  .fbtn,
  .addb {
    white-space: nowrap;
  }
  @media (max-width: 719px) {
    .toolbar .q {
      flex-basis: 100%;
    }
  }
  .gmore > summary {
    padding-inline: 10px;
  }
  .metaline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    margin: 0 0 12px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .selbtn {
    color: var(--ink-2);
  }
  .selbtn[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
    text-decoration: none;
  }
  .badge {
    font-style: normal;
    font-size: var(--fs-tiny);
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 99px;
    background: var(--badge);
    color: var(--badge-ink);
  }
  .zl {
    display: block;
    margin: 14px 0 6px;
    color: var(--ink-2);
    font: 600 var(--fs-tiny) / 1.3 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  /* every view says in one sentence what it shows: quiet, above the list */
  .vhead {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px 12px;
    align-items: start;
    margin: 0 0 12px;
  }
  .vt .title {
    font-size: var(--fs-sub);
    font-weight: 600;
  }
  .vs {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .vs.small {
    margin: -4px 0 10px;
  }
  .vstats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 4px 0 0;
  }
  .vstats div {
    display: flex;
    flex-direction: column-reverse;
    padding: 6px 12px;
    border-radius: var(--r-ctl);
    background: var(--paper-2);
  }
  .vstats dt {
    color: var(--ink-2);
    font-size: var(--fs-tiny);
  }
  .vstats dd {
    margin: 0;
    font: 700 var(--fs-sub) / 1.1 var(--font-brand);
  }
  @media (min-width: 1452px) {
    .vhead {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .vstats {
      grid-column: 2;
      margin: 0;
    }
  }
  @media (max-width: 719px) {
    .vstats {
      display: none;
    }
  }
  .note {
    margin: 0 0 12px;
  }
  .cards {
    display: grid;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    overflow: hidden;
    background: var(--paper);
    box-shadow: var(--card-shadow);
  }
  .cards :global(.mcard:last-child) {
    border-bottom: 0;
  }
  @media (min-width: 720px) {
    .cards {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 14px;
      border: 0;
      border-radius: 0;
      overflow: visible;
      background: none;
      box-shadow: none;
    }
  }
  .cfoot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    margin: 10px 0 0;
  }
  .lgd {
    margin: 4px 0 0;
  }
  @media (max-width: 719px) {
    .lgd {
      display: none;
    }
  }
  /* the right column */
  .rcol {
    display: grid;
    gap: 24px;
    align-content: start;
  }
  .dtitle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .dtitle .title,
  .vcard > .title {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .dsub {
    margin: 2px 0 10px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .dcard {
    padding: 16px;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
  }
  .dacts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .vcard > .title {
    margin-bottom: 10px;
  }
  .views.vrows {
    display: grid;
    padding: 4px 16px;
    background: var(--paper);
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    box-shadow: var(--card-shadow);
  }
  .vbtn {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 60px;
    padding: 8px 0;
    border: 0;
    border-top: 1px solid var(--line);
    background: none;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .vbtn:first-child {
    border-top: 0;
  }
  .vic {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .vm {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .vn {
    font-weight: 500;
    overflow-wrap: break-word;
  }
  .vsub {
    color: var(--ink-3);
    font-size: var(--fs-small);
    line-height: 1.35;
  }
  .vbtn small {
    color: var(--ink-2);
    font-size: var(--fs-body);
  }
  .vbtn > :global(svg) {
    flex: none;
    color: var(--ink-3);
  }
  @media (hover: hover) {
    .vbtn:hover .vn {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
  .vbtn[aria-pressed='true'] .vn {
    font-weight: 700;
  }
  .vbtn[aria-pressed='true'] .vic {
    background: var(--accent-soft);
    color: var(--accent);
  }
</style>
