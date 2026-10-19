<script>
  /**
   * Paket H «Packen leichter», answer 2 «2b» (Noah 19.10.2026 12:09): Material › Vorrat (#/gear/supplies).
   * What expires soon (a reminder comes 2 weeks before, Ich › Erinnerungen › «Supplies»), the shopping
   * list «Buy again» (stock counted, below the minimum, expired, or put on by hand) with «Bought», and
   * every supply in the shared table (answer 3), where expiry, stock and minimum change right in the cells.
   * Food & drink always counts as a supply; any other item once one of these fields is set.
   */
  import { liveQuery } from 'dexie';
  import AreaIntro from '../lib/intro/AreaIntro.svelte'; // «Anleitungen überall»: the guide of this page (lib/guides.js)
  import { db } from '../lib/db.js';
  import { t, tn, nameOf } from '../lib/i18n.svelte.js';
  import { CATEGORY, choosable } from '../lib/gear.js';
  import { isSupply, rebuyList, expiringSoon, bought, usedOne, hasStock } from '../lib/supplies.js';
  import { localDay } from '../lib/localday.js';
  import PathHead from '../lib/ui/PathHead.svelte';
  import ListTable from '../lib/ui/ListTable.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import ItemDialog from '../lib/gear/ItemDialog.svelte';
  import { nameCol, saveItemRows } from '../lib/gear/tablecols.js';
  import { offerDone } from '../lib/ui/rename.svelte.js';
  import { saveFailed } from '../lib/ui/ask.js';
  import { ShoppingCart, CalendarClock, Copy, Check, Minus, Plus } from '@lucide/svelte';

  const itemsQ = liveQuery(() => db.items.toArray());
  const items = $derived($itemsQ ?? []);
  const today = localDay();
  const supplies = $derived(items.filter(isSupply));
  const buy = $derived(rebuyList(supplies, today));
  const soon = $derived(expiringSoon(supplies, today));
  const others = $derived(items.filter((i) => i.ownership !== 'gone' && !isSupply(i)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'de')));
  let open = $state(null);
  let addId = $state('');
  let problem = $state('');

  const REASON = { empty: 'none left', low: 'running low', expired: 'expired', hand: 'put on by you' };
  const stamp = (i) => ({ ...i, updatedAt: new Date().toISOString() });

  async function put(next, before, text) {
    problem = '';
    try {
      await db.items.put(stamp(next));
      offerDone(text, async () => {
        await db.items.put(before);
        offerDone(t('Changed back.'));
      });
    } catch (err) {
      problem = saveFailed(err);
    }
  }
  const gotIt = (r) => put(bought(r.item, r.qty, today), r.item, t('"{name}": {n} more at home.', { name: nameOf(r.item), n: r.qty }));
  const minus = (i) => put(usedOne(i), i, t('"{name}": {n} left.', { name: nameOf(i), n: usedOne(i).stock }));
  const plus = (i) => put({ ...i, stock: (hasStock(i) ? i.stock : 0) + 1 }, i, t('"{name}": {n} at home.', { name: nameOf(i), n: (hasStock(i) ? i.stock : 0) + 1 }));

  async function addSupply() {
    const it = items.find((i) => i.id === addId);
    if (!it) return;
    await put({ ...it, stock: 1 }, it, t('"{name}" is now a supply.', { name: nameOf(it) }));
    addId = '';
  }

  let copied = $state(false);
  async function copyList() {
    const text = [t('Buy again'), ...buy.map((r) => `• ${r.qty > 1 ? `${r.qty} × ` : ''}${nameOf(r.item)}`)].join('\n');
    try {
      if (navigator.share) await navigator.share({ title: t('Buy again'), text });
      else await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      /* closed the share window */
    }
  }

  // answer 3: the shared table; every field changes in its cell, «Change for all» sets one for many
  const cols = $derived([
    nameCol(),
    { key: 'category', label: t('Category'), type: 'select', empty: false, options: choosable().map((c) => ({ key: c.key, name: t(c.name) })) },
    { key: 'homeSpot', label: t('Where at home'), type: 'text' },
    { key: 'expires', label: t('Best before'), type: 'date' },
    { key: 'stock', label: t('At home'), type: 'number', width: '7em' },
    { key: 'minStock', label: t('Buy below'), type: 'number', width: '7em' },
    { key: 'rebuy', label: t('On the list'), type: 'check', width: '6em' },
  ]);
  const saveRows = (pairs) => saveItemRows(db, pairs);
  const when = (d) => (d < 0 ? tn(-d, 'expired {n} day ago', 'expired {n} days ago') : d === 0 ? t('expires today') : tn(d, 'expires in {n} day', 'expires in {n} days'));
</script>

<div class="page sup">
  <PathHead crumbs={[{ label: t('Gear|place'), href: '#/gear' }]} title={t('Supplies')} sub={$itemsQ ? tn(supplies.length, '{n} supply', '{n} supplies') : ''} />
  <p class="intro">{t('Food, gels, medicines, gas: what runs out or expires. Set a best-before date and the app reminds you 2 weeks before. Count what you have at home and it puts the item on the shopping list when it runs low.')}</p>
  <AreaIntro place="supplies" />
  {#if problem}<p class="err" role="alert">{problem}</p>{/if}

  <div class="cols">
    <section class="box" aria-labelledby="buy-h">
      <h2 id="buy-h" class="title"><ShoppingCart size={20} aria-hidden="true" /> {t('Buy again')} <small class="num">{buy.length}</small></h2>
      {#if buy.length}
        <ul class="rows">
          {#each buy as r (r.item.id)}
            <li>
              <span class="nm">{r.qty > 1 ? `${r.qty} × ` : ''}{nameOf(r.item)}<small>{t(REASON[r.reason])}{r.item.homeSpot ? ` · ${r.item.homeSpot}` : ''}</small></span>
              <button type="button" class="btn sm" onclick={() => gotIt(r)}><Check size={16} aria-hidden="true" /> {t('Bought')}</button>
            </li>
          {/each}
        </ul>
        <button type="button" class="btn" onclick={copyList}><Copy size={16} aria-hidden="true" /> {copied ? t('Copied') : t('Share the list')}</button>
      {:else}
        <p class="none">{t('Nothing to buy. An item comes here when its stock runs low, when it has expired, or when you tick «On the list».')}</p>
      {/if}
    </section>

    <section class="box" aria-labelledby="soon-h">
      <h2 id="soon-h" class="title"><CalendarClock size={20} aria-hidden="true" /> {t('Expires soon')} <small class="num">{soon.length}</small></h2>
      {#if soon.length}
        <ul class="rows">
          {#each soon as r (r.item.id)}
            <li class:bad={r.state === 'expired'}>
              <span class="nm">{nameOf(r.item)}<small>{when(r.days)} · {r.item.expires}</small></span>
              <button type="button" class="btn sm" onclick={() => (open = r.item)}>{t('Open|item')}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">{t('Nothing expires in the next 2 weeks.')}</p>
      {/if}
    </section>
  </div>

  <section aria-labelledby="all-h" class="all">
    <h2 id="all-h" class="title">{t('All supplies')}</h2>
    {#if supplies.length}
      <ul class="rows quick" aria-label={t('Count at home')}>
        {#each supplies.filter(hasStock) as i (i.id)}
          <li>
            <span class="nm">{nameOf(i)}<small>{t(CATEGORY[i.category]?.name ?? '')}</small></span>
            <span class="cnt">
              <button type="button" class="btn sm" aria-label={t('One less: {name}', { name: nameOf(i) })} onclick={() => minus(i)}><Minus size={16} aria-hidden="true" /></button>
              <b class="num">{i.stock}</b>
              <button type="button" class="btn sm" aria-label={t('One more: {name}', { name: nameOf(i) })} onclick={() => plus(i)}><Plus size={16} aria-hidden="true" /></button>
            </span>
          </li>
        {/each}
      </ul>
      <ListTable rows={supplies} {cols} nameOf={(i) => nameOf(i)} onsave={saveRows} onopen={(i) => (open = i)} label={t('All supplies')} />
    {:else}
      <Empty text={t('No supplies yet. Food & drink counts by itself; any other item becomes one as soon as you set a best-before date or a stock.')} />
    {/if}
    <div class="add">
      <label>
        <span>{t('Also keep as a supply')}</span>
        <select bind:value={addId}>
          <option value="">{t('Choose an item …')}</option>
          {#each others as i (i.id)}<option value={i.id}>{nameOf(i)}</option>{/each}
        </select>
      </label>
      <button type="button" class="btn" disabled={!addId} onclick={addSupply}>{t('Add|supply')}</button>
    </div>
  </section>
</div>

{#if open}<ItemDialog item={open} {items} onclose={() => (open = null)} />{/if}

<style>
  .sup {
    display: grid;
    /* a long item name in the table or the select must not widen the page at 320 px */
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .intro {
    margin: 0;
    color: var(--ink-2);
    max-width: 70ch;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  @media (min-width: 900px) {
    .cols {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
  }
  .box {
    display: grid;
    gap: 10px;
    align-content: start;
    padding: 16px;
    border: 1px solid var(--card-line);
    border-radius: var(--radius-card);
    background: var(--paper);
  }
  h2.title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  h2 small {
    color: var(--ink-2);
    font-weight: 500;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
  }
  .rows li.bad .nm small {
    color: var(--bad);
  }
  .nm {
    display: grid;
  }
  .nm small,
  .none {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .none {
    margin: 0;
  }
  .cnt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .cnt b {
    min-width: 2ch;
    text-align: center;
  }
  .all {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .quick {
    max-width: 640px;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 10px;
  }
  .add label {
    flex: 1 1 200px;
    min-width: 0;
    max-width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    font-size: var(--fs-small);
  }
  .add select {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: var(--r-ctl);
    background: var(--input);
    color: var(--ink);
    font: inherit;
    padding: 0 8px;
    max-width: 100%;
  }
  .err {
    color: var(--bad);
  }
</style>
