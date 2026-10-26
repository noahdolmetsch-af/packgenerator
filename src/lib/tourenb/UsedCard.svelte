<script>
  /**
   * Idee 58 «Verbrauch buchen» (Touren b, mockup B58, Noah 26.10.2026 «freigabe»): what was used up or bought
   * on the way. On the way (Ride) only the counting; in the debrief (book) also «Buchen»: the stock at home, the
   * shopping list, the tour costs and the hint for the next packing list, each one can be switched off. Undo.
   */
  import { Utensils, Minus, Plus, ShoppingCart, Undo2, Check } from '@lucide/svelte';
  import { db } from '../db.js';
  import { touched } from '../trips.js';
  import { saveFailed } from '../ui/ask.js';
  import { localDay } from '../localday.js';
  import { costsKey, cleanCosts, emptyCosts, ME } from '../tools/costs.js';
  import { usedRows, setUsed, boughtOf, bookPlan, costItems } from './verbrauch.js';
  import { shortDay } from '../trip/checkhints.js';
  import { t, tn, nameOf, num } from '../i18n.svelte.js';

  let { trip, items = [], book = false } = $props();
  const itemsById = $derived(Object.fromEntries(items.map((i) => [i.id, i])));
  const rows = $derived(usedRows(trip, itemsById));
  const bought = $derived(boughtOf(trip));
  const plan = $derived(bookPlan(trip, itemsById));
  const booked = $derived(trip.usedBooked ?? null);
  const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  const save = async (fields) => {
    try {
      await db.trips.update(trip.id, touched(fields));
    } catch (err) {
      saveFailed(err);
    }
  };
  const count = (r, d) => save({ used: setUsed(trip.used, r.item.id, r.used + d) });

  // «Nachgekauft …»
  let buying = $state(false);
  let bName = $state('');
  let bQty = $state('1');
  let bChf = $state('');
  async function addBought(e) {
    e.preventDefault();
    const name = bName.trim();
    if (!name) return;
    const hit = items.find((i) => [i.name, i.nameDe].filter(Boolean).some((n) => n.toLowerCase() === name.toLowerCase()));
    const chf = Number(String(bChf).replace(',', '.'));
    await save({ bought: [...bought, { id: uid('by'), name, qty: Math.max(1, Math.round(Number(bQty) || 1)), chf: bChf.trim() && Number.isFinite(chf) ? chf : null, ...(hit ? { itemId: hit.id } : {}) }] });
    bName = bChf = '';
    bQty = '1';
    buying = false;
  }
  const dropBought = (b) => save({ bought: bought.filter((x) => x.id !== b.id) });

  // «Buchen»
  let optStock = $state(true);
  let optShop = $state(true);
  let optCosts = $state(true);
  let optHint = $state(true);
  let msg = $state('');
  async function bookNow() {
    const now = new Date().toISOString();
    const before = {};
    const costIds = [];
    try {
      await db.transaction('rw', db.items, db.trips, db.settings, async () => {
        const touchedIds = new Set([...(optStock ? plan.stock.map((s) => s.item.id) : []), ...(optShop ? plan.shop.map((i) => i.id) : [])]);
        for (const id of touchedIds) {
          const cur = await db.items.get(id);
          if (!cur) continue;
          before[id] = { stock: cur.stock ?? null, rebuy: cur.rebuy ?? null };
          const next = { ...cur, updatedAt: now };
          const s = optStock ? plan.stock.find((x) => x.item.id === id) : null;
          if (s) next.stock = s.to;
          if (optShop && plan.shop.some((i) => i.id === id)) next.rebuy = true;
          await db.items.put(next);
        }
        if (optCosts && plan.costs.length) {
          const key = costsKey(trip.id);
          const c = cleanCosts((await db.settings.get(key))?.value ?? emptyCosts());
          const ids = plan.costs.map(() => uid('c'));
          costIds.push(...ids);
          await db.settings.put({ key, value: { ...c, items: [...c.items, ...costItems(plan.costs, { day: localDay(), now, me: ME, ids })] } });
        }
        await db.trips.update(trip.id, touched({ usedBooked: { at: now, stock: before, costIds, opts: { stock: optStock, shop: optShop, costs: optCosts, hint: optHint } } }, now));
      });
      msg = t('Booked.');
    } catch (err) {
      saveFailed(err);
    }
  }
  async function unbook() {
    const b = booked;
    if (!b) return;
    try {
      await db.transaction('rw', db.items, db.trips, db.settings, async () => {
        for (const [id, v] of Object.entries(b.stock ?? {})) {
          const cur = await db.items.get(id);
          if (!cur) continue;
          const next = { ...cur };
          if (v.stock == null) delete next.stock;
          else next.stock = v.stock;
          if (v.rebuy == null) delete next.rebuy;
          else next.rebuy = v.rebuy;
          await db.items.put(next);
        }
        if (b.costIds?.length) {
          const key = costsKey(trip.id);
          const c = cleanCosts((await db.settings.get(key))?.value ?? emptyCosts());
          await db.settings.put({ key, value: { ...c, items: c.items.filter((x) => !b.costIds.includes(x.id)) } });
        }
        await db.trips.update(trip.id, touched({ usedBooked: null }));
      });
      msg = t('Booking undone.');
    } catch (err) {
      saveFailed(err);
    }
  }
  const stockLine = $derived(plan.stock.map((s) => `${nameOf(s.item)} ${num(s.from)} → ${num(s.to)}`).join(' · '));
</script>

{#if rows.length || bought.length || book}
  <section class="tp-card uc" aria-labelledby="uc-h" data-used>
    <h2 id="uc-h"><Utensils size={18} aria-hidden="true" /> {book ? t('Book what was used') : t('Used up')}</h2>
    <p class="uc-sub">{t('What was used up or bought on the way. Food and supplies of this list.')}</p>
    {#if rows.length}
      <ul class="uc-list">
        {#each rows as r (r.item.id)}
          <li data-used-row={nameOf(r.item)}>
            <span class="uc-t"><b>{nameOf(r.item)}</b><small>{t('taken {n}', { n: num(r.taken) })} · {r.used ? (r.left ? t('{n} left', { n: num(r.left) }) : t('all gone')) : t('nothing used yet')}</small></span>
            <span class="uc-step">
              <button type="button" class="sq" disabled={!r.used || !!booked} aria-label={t('One less: {name}', { name: nameOf(r.item) })} onclick={() => count(r, -1)} data-used-minus><Minus size={16} aria-hidden="true" /></button>
              <b class="num" aria-live="polite">{num(r.used)}</b>
              <button type="button" class="sq" disabled={!!booked} aria-label={t('One more used: {name}', { name: nameOf(r.item) })} onclick={() => count(r, 1)} data-used-plus><Plus size={16} aria-hidden="true" /></button>
            </span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="uc-sub">{t('No food or supplies on this list. What you buy on the way can still be noted.')}</p>
    {/if}
    {#if bought.length}
      <ul class="uc-list">
        {#each bought as b (b.id)}
          <li><span class="uc-t"><b>{b.name}{b.qty > 1 ? ` × ${b.qty}` : ''}</b><small>{t('bought on the way')}{b.chf != null ? ` · ${num(b.chf)} Fr.` : ''}</small></span>{#if !booked}<button type="button" class="tp-link" onclick={() => dropBought(b)}>{t('Remove')}</button>{/if}</li>
        {/each}
      </ul>
    {/if}
    {#if buying}
      <form class="uc-form" onsubmit={addBought}>
        <input class="inp" list="uc-items" bind:value={bName} placeholder={t('What, e.g. Gel')} aria-label={t('What did you buy?')} data-bought-name />
        <datalist id="uc-items">{#each items.filter((i) => !i.archived) as i (i.id)}<option value={nameOf(i)}></option>{/each}</datalist>
        <label class="uc-small">{t('How many')}<input class="inp num" type="number" min="1" inputmode="numeric" bind:value={bQty} /></label>
        <label class="uc-small">{t('Price in Fr. (optional)')}<input class="inp num" type="text" inputmode="decimal" bind:value={bChf} data-bought-chf /></label>
        <span class="uc-acts"><button type="submit" class="btn ink" disabled={!bName.trim()} data-bought-save>{t('Save')}</button><button type="button" class="btn" onclick={() => (buying = false)}>{t('Cancel')}</button></span>
      </form>
    {:else if !booked}
      <button type="button" class="btn" onclick={() => (buying = true)} data-bought-add><ShoppingCart size={16} aria-hidden="true" />{t('Bought on the way …')}</button>
    {/if}

    {#if book}
      {#if booked}
        <p class="uc-done" role="status"><Check size={16} aria-hidden="true" /><span>{t('Booked on {day}.', { day: shortDay(booked.at) })}</span><button type="button" class="tp-link" onclick={unbook} data-used-unbook><Undo2 size={15} aria-hidden="true" />{t('Undo')}</button></p>
      {:else if rows.some((r) => r.used) || bought.length}
        <h3 class="uc-h3">{t('What booking does')}</h3>
        <p class="uc-sub">{t('A suggestion; switch off what you do not want.')}</p>
        <label class="uc-opt"><input type="checkbox" bind:checked={optStock} /><span><b>{t('Stock at home')}</b><small>{stockLine || t('No counted stock among these things.')}</small></span></label>
        <label class="uc-opt"><input type="checkbox" bind:checked={optShop} /><span><b>{t('Shopping list')}</b><small>{plan.shop.length ? plan.shop.map(nameOf).join(' · ') : t('Nothing runs low.')}</small></span></label>
        <label class="uc-opt"><input type="checkbox" bind:checked={optCosts} /><span><b>{t('Costs of the tour')}</b><small>{plan.costs.length ? plan.costs.map((b) => `${b.name} ${num(b.chf)} Fr.`).join(' · ') : t('No prices noted.')}</small></span></label>
        <label class="uc-opt"><input type="checkbox" bind:checked={optHint} /><span><b>{t('Next packing list')}</b><small>{t('Shows what you used last time as a hint.')}</small></span></label>
        <button type="button" class="btn hi" onclick={bookNow} data-used-book>{t('Book|used')}</button>
      {/if}
      {#if msg}<p class="tp-small tp-muted" role="status">{msg}</p>{/if}
    {/if}
  </section>
{/if}

<style>
  .uc {
    margin: 0 0 var(--sp-4);
  }
  .uc h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: var(--fs-sub);
  }
  .uc-sub {
    margin: 0 0 6px;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .uc-h3 {
    margin: 12px 0 2px;
    font-size: var(--fs-body);
  }
  .uc-list {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .uc-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
    border-top: 1px solid var(--line);
  }
  .uc-t {
    min-width: 0;
  }
  .uc-t small,
  .uc-opt small {
    display: block;
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .uc-step {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .uc-step b {
    min-width: 1.5em;
    text-align: center;
  }
  .sq {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid var(--line-strong, var(--line));
    background: var(--paper, transparent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: inherit;
  }
  .sq:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .uc-form {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: flex-end;
  }
  .uc-form > .inp {
    flex: 1 1 200px;
  }
  .uc-small {
    display: flex;
    flex-direction: column;
    font-size: var(--fs-small);
    gap: 2px;
  }
  .uc-small .inp {
    width: 7em;
  }
  .uc-acts {
    display: flex;
    gap: 8px;
  }
  .uc-opt {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 6px 0;
  }
  .uc-opt input {
    margin-top: 4px;
    width: 20px;
    height: 20px;
  }
  .uc-done {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin: 10px 0 0;
  }
  .uc .btn.hi {
    margin-top: 8px;
  }
</style>
