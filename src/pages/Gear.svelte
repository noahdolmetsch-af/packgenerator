<script>
  import { take } from '../lib/nav.js';
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import { phone } from '../lib/media.svelte.js';
  import { gearStats, matches, groupByCategory, formatWeight, itemWeight, CATEGORIES, BAG, OWNERSHIP } from '../lib/gear.js';
  import WeightOverview from '../lib/gear/WeightOverview.svelte';
  import WeighMode from '../lib/gear/WeighMode.svelte';
  import ReviewMode from '../lib/gear/ReviewMode.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { itemUsage, deadWeight, wishReason } from '../lib/insights.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { DOMAINS, countByDomain, domainName } from '../lib/domains.js';

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
  async function leaveHome(item) {
    await db.items.update(item.id, { role: 'optional', updatedAt: new Date().toISOString() });
  }

  // v0.19.6: the search in the top bar opens Gear with ?q=<name>.
  // ?cat=<key> (start page "Where the weight is") opens one category.
  const hashQ = new URLSearchParams(location.hash.split('?')[1] ?? '');
  let filter = $state({ q: hashQ.get('q') ?? '', category: hashQ.get('cat') ?? '', role: '', fav: false, domain: hashQ.get('area') ?? '' });
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
  let dialog = $state(null); // { item } or { item: null } for "Add item"
  // Categories folded shut (10a). On the phone everything starts folded, on the desktop open.
  let folded = $state(phone.matches ? Object.fromEntries(CATEGORIES.map((c) => [c.key, true])) : {});

  const inventory = $derived(stats.inventory.filter((i) => matches(i, filter)));
  // Wishlist sorted by how much it helps (Noah 7a): missing on trips, needed on the bike, lighter.
  const wishlist = $derived(
    stats.wishlist
      .filter((i) => matches(i, filter))
      .map((item) => ({ item, ...wishReason(item, items, $tripsQ ?? [], $debriefsQ ?? []) }))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)),
  );
  const groups = $derived(groupByCategory(inventory));
  const catStats = $derived(Object.fromEntries(stats.cats.map((c) => [c.key, c])));
  // While searching or filtering, every matching category is shown open.
  const searching = $derived(!!(filter.q.trim() || filter.category || filter.role || filter.fav || filter.domain));
  const isOpen = (key) => searching || !folded[key];
  const allOpen = $derived(groups.every((g) => !folded[g.key]));
  const toggle = (key) => (folded[key] = !folded[key]);
  const setAll = (shut) => (folded = Object.fromEntries(CATEGORIES.map((c) => [c.key, shut])));

  const pickCategory = (key) => (filter.category = filter.category === key ? '' : key);
  // Side column: jump to a category (and open it).
  function jump(key) {
    folded[key] = false;
    queueMicrotask(() => document.getElementById(`gh-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  const open = (item) => (dialog = { item });
  // v0.19.6: "New → Gear item" from any page opens "Add item" here.
  $effect(() => {
    const add = () => take('gear.add') && (dialog = { item: null });
    add();
    window.addEventListener('pg:additem', add);
    return () => window.removeEventListener('pg:additem', add);
  });
  // A new search from the top bar while Gear is open.
  $effect(() => {
    const read = () => {
      const q = new URLSearchParams(location.hash.split('?')[1] ?? '').get('q');
      if (q != null) (filter.q = q), (tab = 'inventory');
    };
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  });
</script>

<div class="gear">
  <header class="head">
    <h1 class="title">{t('Gear')}</h1>
    <div class="kpis">
      <div><span class="lbl">{t('Items')}</span><b class="num">{stats.inventory.length}</b></div>
      <div class="un"><span class="lbl">{t('Not weighed')}</span><b class="num">{stats.unweighed}</b></div>
      <div class="tot"><span class="lbl">{t('Gear weight')}</span><b class="num">{formatWeight(stats.total)}</b></div>
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
    <button type="button" role="tab" aria-selected={tab === 'weigh'} onclick={() => (tab = 'weigh')}>{t('Weigh')} <small>{stats.unweighed}</small></button>
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
          {#if r.item.role === 'optional'}<span class="ok small">{t('Stays at home')}</span>{:else}<button type="button" class="btn sm" onclick={() => leaveHome(r.item)}>{t('Leave at home')}</button>{/if}
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
    <WeighMode {items} />
  {:else if tab === 'check'}
    <ReviewMode {items} />
  {:else}
    <div class="toolbar" class:areas={showAreas}>
      <label class="q"><span class="lbl">{t('Search gear')}</span><input class="inp" type="search" placeholder={t('Name, brand, bag or ID')} bind:value={filter.q} /></label>
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
      <button type="button" class="toggle fav" aria-pressed={filter.fav} onclick={() => (filter.fav = !filter.fav)} title={t('Only my favourites')}>★ {t('Favourites')} <small>{items.filter((i) => i.favorite).length}</small></button>
      {#if !phone.matches}
        <label>
          <span class="lbl">{t('Role')}</span>
          <select class="sel" bind:value={filter.role}>
            <option value="">{t('All roles')}</option>
            <option value="worn">{t('Worn')}</option>
            <option value="standard">{t('Standard pack')}</option>
            <option value="optional">{t('Optional')}</option>
            <option value="night">{t('Overnight sets')}</option>
            <option value="none">{t('No role')}</option>
          </select>
        </label>
        <div class="acts"><button type="button" class="btn hi" onclick={() => (dialog = { item: null })}>{t('Add item')}</button></div>
      {/if}
    </div>

    {#if tab === 'inventory'}
      <WeightOverview {stats} category={filter.category} onpick={pickCategory} onopen={open} />
      <div class="inv">
        {#if !phone.matches}
          <nav class="side" aria-label={t('Jump to a category')}>
            <span class="lbl">{t('Categories')}</span>
            <ul>
              {#each groups as g (g.key)}
                <li><button type="button" onclick={() => jump(g.key)}><span class="sw" style:background={g.color}></span><span class="n">{t(g.name)}</span><span class="num">{formatWeight(catStats[g.key].g)}</span></button></li>
              {/each}
            </ul>
          </nav>
        {/if}
        <div class="list">
          <p class="count num" aria-live="polite">
            {t('{a} of {b} items', { a: inventory.length, b: stats.inventory.length })}
            {#if !searching && groups.length}<button type="button" class="link" onclick={() => setAll(allOpen)}>{allOpen ? t('Collapse all') : t('Expand all')}</button>{/if}
            <!-- v0.21.0: every favourite by area, read-only and printable -->
            {#if filter.fav}<a class="favlink" href="#/favorites">{t('All my favourite things')} →</a>{/if}
          </p>
          <div class="cats">
            {#each groups as g (g.key)}
              <section class="cat" aria-labelledby="gh-{g.key}">
                <h2 id="gh-{g.key}" class="ch">
                  <button type="button" aria-expanded={isOpen(g.key)} disabled={searching} onclick={() => toggle(g.key)}>
                    <span class="sw" style:background={g.color}></span>
                    <span class="title">{t(g.name)}</span>
                    <b class="num k">{formatWeight(catStats[g.key].g)}</b>
                    <span class="m">{tn(catStats[g.key].n, '{n} item', '{n} items')}{catStats[g.key].unweighed ? ` · ${t('{n} not weighed', { n: catStats[g.key].unweighed })}` : ''}{catStats[g.key].consumable ? ` · ${t('not in gear weight')}` : ''}</span>
                    {#if !searching}<span class="chev" aria-hidden="true">▾</span>{/if}
                  </button>
                </h2>
                {#if isOpen(g.key)}
                  <ul class="rows">
                    {#each g.items as item (item.id)}
                      <li>
                        <button type="button" onclick={() => open(item)}>
                          <span class="nm">{#if item.favorite}<span class="star" title={t('Favourite')}>★</span>{/if}{nameOf(item)}{#if item.qty > 1}<small> × {item.qty}</small>{/if}</span>
                          <span class="bg">{BAG[item.defaultBag] ? t(BAG[item.defaultBag]) : '–'}</span>
                          <span class="w num" class:nw={item.weightG == null}>{formatWeight(itemWeight(item))}</span>
                        </button>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </section>
            {:else}
              {#if items.length}<p class="card">{t('Nothing matches.')} <button type="button" class="btn" onclick={() => (filter = { q: '', category: '', role: '', fav: false, domain: '' })}>{t('Clear search and filters')}</button></p>{/if}
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <section class="wish" aria-labelledby="wish-h">
        <h2 id="wish-h" class="title">{t('Wishlist & to buy')}</h2>
        <p class="sub">{t('Not owned yet. Not counted in the inventory or any total. Sorted by what helps most: missing on trips, needed on the bike, lighter.')}</p>
        <ul class="rows">
          {#each wishlist as { item, reasons } (item.id)}
            <li>
              <button type="button" onclick={() => open(item)}>
                <span class="st st-{item.ownership}">{t(OWNERSHIP[item.ownership] ?? '')}</span>
                <span class="nm">{#if item.favorite}<span class="star" title={t('Favourite')}>★</span>{/if}{nameOf(item)}{#if reasons.length}<small class="why">{reasons.join(' · ')}</small>{/if}</span>
                <span class="bg">{t(CATEGORIES.find((c) => c.key === item.category)?.name ?? '')}</span>
                <span class="w num" class:muted={item.weightG == null}>{item.weightG == null ? '–' : formatWeight(itemWeight(item))}</span>
              </button>
            </li>
          {:else}
            <li class="empty">{t('No wishlist items match.')}</li>
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

{#if dialog}
  <ItemDialog item={dialog.item} {items} preset={filter.domain ? { domains: [filter.domain] } : {}} readOnly={phone.matches && !!dialog.item} onclose={() => (dialog = null)} />
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
    /* v0.21.0: without the web font (offline) the German title was wider than a 390 px phone. */
    max-width: 100%;
    overflow-wrap: anywhere;
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
  /* Status stays grey; orange is only for actions (design audit G3). */
  .kpis .un b {
    color: var(--ink-2);
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr)); /* v0.21.0: tabs may shrink below their label width */
    border: 2px solid var(--ink);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 14px;
  }
  @media (min-width: 720px) {
    .tabs {
      max-width: 780px;
    }
  }
  @media (max-width: 520px) {
    .tabs button {
      font-size: 13px;
      line-height: 1.15;
      text-align: center;
    }
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
    min-width: 0;
    overflow-wrap: anywhere;
    hyphens: auto;
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
  .fav {
    border: 1.5px solid var(--ink-3);
    background: var(--paper);
    border-radius: 999px;
    padding: 7px 12px;
    font: 600 14px var(--font-body);
    color: var(--ink);
    cursor: pointer;
    justify-self: start;
    white-space: nowrap;
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
  .toolbar .q {
    grid-column: 1 / -1;
  }
  /* The search stays at the top while you scroll (desktop). */
  @media (min-width: 720px) {
    .toolbar {
      position: sticky;
      top: 46px;
      z-index: 2;
      background: var(--ground);
      padding: 6px 0;
      grid-template-columns: minmax(200px, 2fr) 1fr auto 1fr auto;
    }
    .toolbar.areas {
      grid-template-columns: minmax(200px, 2fr) 1fr 1fr auto 1fr auto;
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
  .ch {
    margin: 0;
    border-bottom: 3px solid var(--ink);
  }
  .ch button {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
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
  .ch button:disabled {
    cursor: default;
  }
  .ch .title {
    font-size: 26px;
    min-width: 0;
  }
  .ch .k {
    font-size: 16px;
  }
  .ch .m {
    grid-column: 2 / 4;
    grid-row: 2;
    color: var(--ink-3);
    font-size: 13px;
    font-weight: 400;
  }
  .ch .chev {
    grid-column: 4;
    grid-row: 1;
    font-size: 16px;
    transition: transform 0.15s;
  }
  .ch button[aria-expanded='false'] .chev {
    transform: rotate(-90deg);
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
  @media (hover: hover) {
    .rows button:hover {
      background: var(--paper-2);
    }
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
  .rows .muted {
    color: var(--ink-3);
    font-weight: 400;
  }
  .rows .nw {
    color: var(--ink-3);
    font-weight: 600;
    font-size: 13px;
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
    font-size: 13px;
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
    font-size: 13px;
    color: var(--ink-3);
  }
  .dead {
    max-width: 1000px;
  }
  .dead .title {
    font-size: 28px;
  }
  .dead h3.title {
    font-size: 22px;
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
    border: 2px dashed var(--ink-3);
    border-radius: 6px;
    max-width: 1000px;
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
    border-color: var(--ink);
    color: var(--ink);
  }
  .empty {
    padding: 10px 8px;
    color: var(--ink-3);
  }
</style>
