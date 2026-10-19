<script>
  /**
   * Paket L «Werkzeugkasten» (#318 Tour-Kosten teilen, #366 Ausgaben pro Tour in Franken, #320 Beleg lesen;
   * Noah 19.10.2026 «2a», «3a»): per trip the people, the expenses (any currency, also in Franken with the
   * rate of the day) and at the end who owes whom. What others owe you: «Request by TWINT» makes an
   * invoice (Ich › Bezahlen › Rechnungen) and shares its message with the pay link.
   * People and expenses can be added, changed and deleted (with Undo).
   */
  import { liveQuery } from 'dexie';
  import { Plus, Pencil, Trash2, Camera, Send, UserPlus } from '@lucide/svelte';
  import RenameSheet from '../ui/RenameSheet.svelte';
  import { askDelete, deleteWithUndo } from '../ui/ask.js';
  import { db } from '../db.js';
  import { localDay } from '../localday.js';
  import { ME, costsKey, cleanCosts, emptyCosts, totalChf, balances, settle, defaultTrip, readReceipt } from './costs.js';
  import { loadRates, convertMoney, parseAmount, currenciesOf, fmtMoney, round2, MAIN_CURRENCIES } from './money.js';
  import { fitSize, loadImage, render } from './phototools.js';
  import { readAccount, createInvoice, invoiceMail } from '../pay/invoices.js';
  import { readKey, boxOf, payLink } from '../pay/report.js';
  import { readText } from '../docs/ocr.js';
  import { t, locale } from '../i18n.svelte.js';
  import './tools.css';

  const today = localDay();
  const tripsQ = liveQuery(() => db.trips.toArray());
  const trips = $derived(($tripsQ ?? []).filter((x) => x.startDate && !x.idea).sort((a, b) => b.startDate.localeCompare(a.startDate)));
  let tripId = $state('');
  $effect(() => {
    if (!tripId && trips.length) tripId = defaultTrip(trips, today)?.id ?? trips[0].id;
  });
  const trip = $derived(trips.find((x) => x.id === tripId) ?? null);
  let raw = $state(null);
  $effect(() => {
    const id = tripId;
    raw = null;
    if (!id) return;
    const sub = liveQuery(async () => (await db.settings.get(costsKey(id)))?.value ?? null).subscribe((v) => (raw = v));
    return () => sub.unsubscribe();
  });
  const costs = $derived(cleanCosts(raw ?? emptyCosts()));
  const save = (c) => db.settings.put({ key: costsKey(tripId), value: JSON.parse(JSON.stringify(c)) });

  let rates = $state(null);
  loadRates(db).then((r) => (rates = r));
  const curs = $derived(rates ? currenciesOf(rates.rates) : MAIN_CURRENCIES);
  const money = (v) => fmtMoney(v, locale());
  const nameOf = (id) => (id === ME ? t('You|costs') : (costs.people.find((p) => p.id === id)?.name ?? '?'));
  const dayText = (d) => new Date(`${d}T12:00:00Z`).toLocaleDateString(locale(), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  // people
  let newPerson = $state('');
  let renaming = $state(null);
  async function addPerson(e) {
    e.preventDefault();
    const n = newPerson.trim();
    if (!n) return;
    await save({ ...costs, people: [...costs.people, { id: newId(), name: n.slice(0, 40) }] });
    newPerson = '';
  }
  async function delPerson(p) {
    const used = costs.items.filter((x) => x.paidBy === p.id).length;
    const ok = await askDelete({
      title: t('Delete «{name}»?', { name: p.name }),
      text: used ? t('What {name} paid ({n}×) then counts as paid by you. You can bring it back for 4 seconds afterwards.', { name: p.name, n: used }) : t('You can bring it back for 4 seconds afterwards.'),
    });
    if (ok !== 'delete') return;
    const before = JSON.parse(JSON.stringify(costs));
    await deleteWithUndo({
      name: p.name,
      text: t('«{name}» deleted.', { name: p.name }),
      run: async () => {
        await save({ ...costs, people: costs.people.filter((x) => x.id !== p.id), items: costs.items.map((x) => ({ ...x, paidBy: x.paidBy === p.id ? ME : x.paidBy, for: x.for.filter((id) => id !== p.id) })) });
        return before;
      },
      undo: (b) => save(b),
    });
  }

  // an expense: new or changed
  let form = $state(null); // { id?, what, amount, cur, chf, chfTyped, paidBy, for, day }
  let reading = $state('');
  let formError = $state('');
  function openForm(x = null) {
    formError = '';
    form = x
      ? { id: x.id, what: x.what, amount: String(x.amount), cur: x.cur, chf: String(x.chf), chfTyped: x.cur !== 'CHF', paidBy: x.paidBy, for: [...(x.for?.length ? x.for : costs.people.map((p) => p.id))], day: x.day }
      : { what: '', amount: '', cur: costs.items.at(-1)?.cur ?? 'CHF', chf: '', chfTyped: false, paidBy: ME, for: costs.people.map((p) => p.id), day: today };
  }
  // the Franken follow the amount until they are typed by hand
  const autoChf = $derived(form && form.cur !== 'CHF' ? round2(convertMoney(parseAmount(form.amount), form.cur, 'CHF', rates?.rates)) : null);
  $effect(() => {
    if (form && !form.chfTyped && form.cur !== 'CHF') form.chf = autoChf == null ? '' : String(autoChf);
  });
  async function saveForm(e) {
    e.preventDefault();
    const amount = parseAmount(form.amount);
    if (amount == null || amount <= 0) return (formError = t('Please type an amount.'));
    const chf = form.cur === 'CHF' ? amount : parseAmount(form.chf);
    if (chf == null) return (formError = t('No rate for {cur} yet: please type the amount in Franken.', { cur: form.cur }));
    if (!form.for.length) return (formError = t('Choose at least one person it was for.'));
    const x = { id: form.id ?? newId(), what: form.what.trim().slice(0, 80) || t('Expense'), amount, cur: form.cur, chf: round2(chf), paidBy: form.paidBy, for: form.for.length === costs.people.length ? [] : [...form.for], day: form.day || today, addedAt: new Date().toISOString() };
    const items = form.id ? costs.items.map((y) => (y.id === form.id ? x : y)) : [...costs.items, x];
    await save({ ...costs, items });
    form = null;
  }
  async function delItem(x) {
    if ((await askDelete({ title: t('Delete «{name}»?', { name: x.what }), text: t('You can bring it back for 4 seconds afterwards.') })) !== 'delete') return;
    const before = JSON.parse(JSON.stringify(costs));
    await deleteWithUndo({ name: x.what, text: t('«{name}» deleted.', { name: x.what }), run: async () => (await save({ ...costs, items: costs.items.filter((y) => y.id !== x.id) }), before), undo: (b) => save(b) });
  }

  // #320: amount, date and currency from a photo of the receipt
  let receiptIn = $state();
  async function readPhoto(e) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    reading = t('Reading the receipt …');
    try {
      const img = await loadImage(f);
      const s = fitSize(img.width, img.height, 1600);
      const blob = await render(img, { x: 0, y: 0, w: img.width, h: img.height }, s.w, s.h, { quality: 0.85 });
      const url = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.readAsDataURL(blob);
      });
      const got = readReceipt(await readText([url]));
      if (got.amount != null) form.amount = String(got.amount);
      if (got.date) form.day = got.date;
      if (got.cur) form.cur = got.cur;
      reading = got.amount != null ? t('Read from the receipt. Please check it.') : t('No amount found. Please type it.');
    } catch {
      reading = t('The receipt could not be read. Please type it.');
    }
  }

  // who owes whom
  const bal = $derived(balances(costs.people, costs.items));
  const pays = $derived(settle(bal));
  let note = $state('');
  async function requestTwint(p) {
    note = '';
    const account = readAccount();
    if (!account?.twint) return (note = 'twint');
    const inv = await createInvoice({ name: nameOf(p.from), amount: p.cents, purpose: t('Costs of «{trip}»', { trip: trip?.title || t('Trip') }), ways: { qr: false, twint: true } }, account);
    const key = readKey();
    const link = key ? payLink(inv, account, await boxOf(key)) : '';
    const { subject, body } = invoiceMail(inv, account, t, link);
    await save({ ...costs, asked: { ...costs.asked, [p.from]: inv.no } });
    if (navigator.share) {
      try {
        await navigator.share({ title: subject, text: body });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(body);
      note = t('Text copied. Send it with WhatsApp or SMS.');
    } catch {
      note = body;
    }
  }
</script>

{#if !trips.length}
  <section class="tool-card"><p class="tool-help">{t('Plan a trip first; then its costs are noted here.')}</p></section>
{:else}
  <section class="tool-card costs">
    <label class="tool-field"><span>{t('Trip')}</span>
      <select class="tool-input" bind:value={tripId} onchange={() => (form = null)}>
        {#each trips as x (x.id)}<option value={x.id}>{x.title || t('Trip')} · {dayText(x.startDate)}</option>{/each}
      </select>
    </label>
    <p class="tool-big" data-total>{money(totalChf(costs.items))} CHF</p>
    <p class="tool-muted">{t('All expenses of this trip in Franken, with the rate of the day.')}</p>
  </section>

  <section class="tool-card">
    <h2 class="c-h">{t('Who was there')}</h2>
    <ul class="c-people">
      {#each costs.people as p (p.id)}
        <li class="pill c-person">
          <span>{nameOf(p.id)}</span>
          {#if p.id !== ME}
            <button type="button" class="btn sm" aria-label={t('Rename {name}', { name: p.name })} onclick={() => (renaming = p)}><Pencil size={14} aria-hidden="true" /></button>
            <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: p.name })} onclick={() => delPerson(p)}><Trash2 size={14} aria-hidden="true" /></button>
          {/if}
        </li>
      {/each}
    </ul>
    <form class="tool-row" onsubmit={addPerson}>
      <label class="tool-field c-grow"><span>{t('Add a person')}</span><input class="tool-input" maxlength="40" autocomplete="off" bind:value={newPerson} /></label>
      <button type="submit" class="btn" disabled={!newPerson.trim()}><UserPlus size={16} aria-hidden="true" />{t('Add')}</button>
    </form>
  </section>

  <section class="tool-card">
    <h2 class="c-h">{t('Expenses')}</h2>
    {#if costs.items.length}
      <ul class="tool-list">
        {#each [...costs.items].sort((a, b) => a.day.localeCompare(b.day)) as x (x.id)}
          <li data-item={x.id}>
            <span class="c-m"><b>{x.what}</b><small class="tool-muted">{dayText(x.day)} · {x.paidBy === ME ? t('paid by you') : t('paid by {name}', { name: nameOf(x.paidBy) })}{x.for?.length ? ` · ${t('for {names}', { names: x.for.map(nameOf).join(', ') })}` : ''}</small></span>
            <span class="c-amt"><b>{money(x.chf)} CHF</b>{#if x.cur !== 'CHF'}<small class="tool-muted">{money(x.amount)} {x.cur}</small>{/if}</span>
            <button type="button" class="btn sm" aria-label={t('Change {name}', { name: x.what })} onclick={() => openForm(x)}><Pencil size={15} aria-hidden="true" /></button>
            <button type="button" class="btn sm" aria-label={t('Delete {name}', { name: x.what })} onclick={() => delItem(x)}><Trash2 size={15} aria-hidden="true" /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="tool-muted">{t('No expenses yet.')}</p>
    {/if}
    {#if form}
      <form class="c-form" onsubmit={saveForm}>
        <input bind:this={receiptIn} type="file" accept="image/*" capture="environment" hidden onchange={readPhoto} />
        <div><button type="button" class="btn sm" onclick={() => receiptIn.click()}><Camera size={15} aria-hidden="true" />{t('Read receipt photo')}</button></div>
        {#if reading}<p class="tool-status" role="status">{reading}</p>{/if}
        <label class="tool-field"><span>{t('What')}</span><input class="tool-input" maxlength="80" autocomplete="off" placeholder={t('e.g. Hotel, dinner, train')} bind:value={form.what} /></label>
        <div class="tool-row">
          <label class="tool-field c-num"><span>{t('Amount|money')}</span><input class="tool-input" inputmode="decimal" autocomplete="off" bind:value={form.amount} /></label>
          <label class="tool-field"><span>{t('Currency')}</span><select class="tool-input" bind:value={form.cur}>{#each curs as c (c)}<option value={c}>{c}</option>{/each}</select></label>
          {#if form.cur !== 'CHF'}
            <label class="tool-field c-num"><span>{t('In Franken')}</span><input class="tool-input" inputmode="decimal" autocomplete="off" bind:value={form.chf} oninput={() => (form.chfTyped = true)} /></label>
          {/if}
        </div>
        <div class="tool-row">
          <label class="tool-field"><span>{t('Paid by')}</span><select class="tool-input" bind:value={form.paidBy}>{#each costs.people as p (p.id)}<option value={p.id}>{nameOf(p.id)}</option>{/each}</select></label>
          <label class="tool-field"><span>{t('Day')}</span><input class="tool-input" type="date" bind:value={form.day} /></label>
        </div>
        <fieldset class="c-for"><legend>{t('For whom')}</legend>
          {#each costs.people as p (p.id)}
            <label class="c-check"><input type="checkbox" checked={form.for.includes(p.id)} onchange={(e) => (form.for = e.currentTarget.checked ? [...form.for, p.id] : form.for.filter((id) => id !== p.id))} /> {nameOf(p.id)}</label>
          {/each}
        </fieldset>
        {#if formError}<p class="tool-status err" role="alert">{formError}</p>{/if}
        <div class="tool-row"><button type="submit" class="btn hi">{t('Save')}</button><button type="button" class="btn btn-link" onclick={() => ((form = null), (reading = ''))}>{t('Cancel')}</button></div>
      </form>
    {:else}
      <div><button type="button" class="btn hi" onclick={() => openForm()}><Plus size={16} aria-hidden="true" />{t('Add expense')}</button></div>
    {/if}
  </section>

  {#if costs.items.length && costs.people.length > 1}
    <section class="tool-card" data-settle>
      <h2 class="c-h">{t('Who owes whom')}</h2>
      {#if pays.length}
        <ul class="tool-list">
          {#each pays as p (`${p.from}-${p.to}`)}
            <li>
              <span class="c-m"><b>{p.to === ME ? t('{from} pays you', { from: nameOf(p.from) }) : p.from === ME ? t('You pay {to}', { to: nameOf(p.to) }) : t('{from} pays {to}', { from: nameOf(p.from), to: nameOf(p.to) })}</b>{#if p.to === ME && costs.asked[p.from]}<small class="tool-muted">{t('requested ({no})', { no: costs.asked[p.from] })}</small>{/if}</span>
              <b class="c-amt">{money(p.cents / 100)} CHF</b>
              {#if p.to === ME}<button type="button" class="btn sm" onclick={() => requestTwint(p)}><Send size={15} aria-hidden="true" />{t('Request by TWINT')}</button>{/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="tool-muted">{t('All even: nobody owes anything.')}</p>
      {/if}
      {#if note === 'twint'}
        <p class="tool-status err">{t('First add your TWINT number once under Me › Pay › Invoices.')} <a href="#/me/pay/invoices/new">{t('Open invoices')}</a></p>
      {:else if note}
        <p class="tool-status" role="status">{note}</p>
      {/if}
      <p class="tool-help">{t('The request becomes an invoice under Me › Pay › Invoices; there you see when it is paid.')}</p>
    </section>
  {/if}
{/if}

{#if renaming}
  <RenameSheet kicker={t('Who was there')} title={t('Rename person')} value={renaming.name} max={40} onsave={(n) => {
    const v = n.trim();
    if (!v) return t('Please type a name.');
    save({ ...costs, people: costs.people.map((p) => (p.id === renaming.id ? { ...p, name: v } : p)) });
  }} onclose={() => (renaming = null)} />
{/if}

<style>
  .c-h {
    margin: 0;
    font: 600 var(--fs-sub) / 1.25 var(--font-body);
  }
  .c-people {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .c-person {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .c-grow {
    flex: 1 1 200px;
  }
  .c-m {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
  }
  .c-m b,
  .c-m small {
    overflow-wrap: break-word;
  }
  .c-amt {
    display: grid;
    justify-items: end;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .c-form {
    display: grid;
    gap: var(--sp-3);
    padding-top: var(--sp-3);
    border-top: 1px solid var(--line);
  }
  .c-num {
    flex: 1 1 120px;
    max-width: 180px;
  }
  .c-for {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2) var(--sp-4);
    margin: 0;
    padding: 0;
    border: 0;
  }
  .c-for legend {
    margin-bottom: 4px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .c-check {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
  }
</style>
