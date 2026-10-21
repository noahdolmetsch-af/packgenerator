<script>
  /**
   * Paket VG 1132 «Ersatzteil-Vorrat» (Noah 20.10.2026 «5»): Bikes › Care › «Spare parts at home»
   * (#/bikes?tab=care&view=stock). What is at home (inner tubes, brake pads, chains …): name, the part it
   * follows and the count. Every own change of that part on any bike takes one away (derived, griff.js);
   * empty → one tap puts it on the shopping list (Ich › Alltag › Einkauf). Rows: add, rename, delete with Undo.
   */
  import { liveQuery } from 'dexie';
  import { Plus, Trash2, ShoppingCart, Package } from '@lucide/svelte';
  import { db } from '../db.js';
  import { t, tn } from '../i18n.svelte.js';
  import { sortBikes } from '../bikes.js';
  import { localDay } from '../localday.js';
  import { partName } from '../care.js';
  import { withVisits } from '../workshop.js';
  import { STOCK_KEY, STOCK_PARTS, STOCK_IDEAS, stockOf, stockRow, addStock, changeStock, removeStock } from '../griff.js';
  import { changeSetting, putSetting } from '../griffdb.js';
  import { changeList, restoreLists, loadLists } from '../frei/shoplist.js';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { offerDone } from '../ui/rename.svelte.js';
  import GriffHead from './GriffHead.svelte';
  import './griff.css';

  let { bikeId = null } = $props();
  const today = localDay();
  const bikesQ = liveQuery(() => db.bikes.toArray());
  const visitsQ = liveQuery(() => db.visits.toArray());
  const stockQ = liveQuery(() => db.settings.get(STOCK_KEY));
  const bikes = $derived(sortBikes($bikesQ ?? []));
  const bike = $derived(bikes.find((b) => b.id === bikeId) ?? bikes[0] ?? null);
  // the bikes with their workshop jobs: a job by the bike shop does not take from the stock at home (by: 'shop')
  const views = $derived(bikes.map((b) => withVisits(b, $visitsQ ?? [])));
  const rows = $derived(stockOf($stockQ?.value).map((r) => stockRow(r, views)));
  const change = (fn) => changeSetting(STOCK_KEY, [], (old) => fn(stockOf(old)));

  let name = $state('');
  let part = $state('');
  let qty = $state('1');
  let msg = $state('');

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return (msg = t('Type what it is, e.g. inner tube.'));
    await change((l) => addStock(l, { name, part: part || null, qty: Number(qty) }, `st-${Date.now().toString(36)}`, today));
    offerDone(t('"{name}" added.', { name: name.trim() }));
    name = '';
    part = '';
    qty = '1';
    msg = '';
  }
  const idea = (x) => ((name = t(x.name)), (part = x.part ?? ''));
  const setQty = (r, v) => change((l) => changeStock(l, r.id, { qty: Number(v) }, today));
  const setName = (r, v) => v.trim() && change((l) => changeStock(l, r.id, { name: v }, today));
  const setPart = (r, v) => change((l) => changeStock(l, r.id, { part: v || null }, today));
  async function remove(r) {
    if ((await askDelete({ title: t('Delete "{name}"?', { name: r.name }), text: t('Only this row goes. The parts on your bikes stay.') })) !== 'delete') return;
    await deleteWithUndo({ name: r.name, text: t('"{name}" deleted.', { name: r.name }), run: () => change((l) => removeStock(l, r.id)), undo: (before) => putSetting(STOCK_KEY, before) });
  }
  async function toShop(r) {
    const before = await loadLists();
    await changeList([r.name], t('Shopping list'));
    offerDone(t('"{name}" is on the shopping list.', { name: r.name }), () => restoreLists(before));
  }
</script>

<div class="gp">
  <GriffHead {bikes} {bike} view="stock" title={t('Spare parts at home')} sub={t('What is in stock; every change you make yourself takes one away')} />
  <section class="gcard" aria-labelledby="st-h">
    <h2 id="st-h"><Package size={18} aria-hidden="true" />{t('In stock')}</h2>
    <p class="quiet">{t('Choose the part a row follows: when you replace that part yourself, one goes away. A change by the bike shop does not count.')}</p>
    {#if rows.length}
      <ul class="list">
        {#each rows as r (r.id)}
          <li data-stock={r.id} data-stock-left={r.left}>
            <input class="inp grow" type="text" maxlength="60" value={r.name} aria-label={t('Name')} onchange={(e) => setName(r, e.currentTarget.value)} />
            <select class="sel" value={r.part ?? ''} aria-label={t('Follows the part')} onchange={(e) => setPart(r, e.currentTarget.value)}>
              <option value="">{t('no part')}</option>
              {#each STOCK_PARTS as k (k)}<option value={k}>{partName({ key: k })}</option>{/each}
            </select>
            <span class="num" class:bad={r.empty}>{r.empty ? t('empty') : tn(r.left, '{n} in stock', '{n} in stock')}</span>
            <label class="quiet">{t('Count')} <input class="inp cnt" type="number" min="0" max="99" value={r.left} onchange={(e) => setQty(r, e.currentTarget.value)} data-stock-qty /></label>
            {#if r.empty}<button type="button" class="btn sm" onclick={() => toShop(r)} data-stock-shop><ShoppingCart size={16} aria-hidden="true" />{t('On the shopping list')}</button>{/if}
            <button type="button" class="ib" aria-label={t('Delete {name}', { name: r.name })} onclick={() => remove(r)}><Trash2 size={16} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="quiet">{t('Nothing in stock yet.')}</p>
    {/if}
    <form class="row" onsubmit={add}>
      <input class="inp grow" type="text" maxlength="60" placeholder={t('e.g. Inner tube 29"')} aria-label={t('What is it?')} bind:value={name} data-stock-name />
      <select class="sel" bind:value={part} aria-label={t('Follows the part')} data-stock-part>
        <option value="">{t('no part')}</option>
        {#each STOCK_PARTS as k (k)}<option value={k}>{partName({ key: k })}</option>{/each}
      </select>
      <input class="inp cnt" type="number" min="0" max="99" bind:value={qty} aria-label={t('Count')} data-stock-new-qty />
      <button type="submit" class="btn sm" data-stock-add><Plus size={16} aria-hidden="true" />{t('Add|part')}</button>
    </form>
    <div class="chips ideas">{#each STOCK_IDEAS as x (x.name)}<button type="button" class="chip" onclick={() => idea(x)}>{t(x.name)}</button>{/each}</div>
    {#if msg}<p class="err" role="alert">{msg}</p>{/if}
  </section>
</div>

<style>
  .cnt {
    width: 5rem;
  }
  .ideas {
    margin: 10px 0 0;
  }
</style>
