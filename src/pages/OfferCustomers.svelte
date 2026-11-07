<script>
  /**
   * Ich › Angebote › Kunden (#/me/offers/customers; Noah 03.11.2026 «1a 2a 3a und b»): the people who book,
   * kept only on this device. Added when a request is confirmed (2a) or by hand; each has a note, an own price
   * per lesson (3b), the lessons from the offers on this device and the open invoices. Rename, change and delete
   * (with Undo) like everything else. The lessons are fetched from the server while the page is open.
   */
  import { liveQuery } from 'dexie';
  import { db } from '../lib/db.js';
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import Empty from '../lib/ui/Empty.svelte';
  import { backClose } from '../lib/ui/backclose.js';
  import { askDelete, deleteWithUndo } from '../lib/ui/ask.js';
  import { t, tn, locale } from '../lib/i18n.svelte.js';
  import { OFFERS_KEY, allBookings } from '../lib/booking/client.js';
  import { chf, dayOf, timeOf, holdsPlace } from '../lib/booking/model.js';
  import { listCustomers, saveCustomers, keyOf, parseRate, lessonsOf, invoicesOf, packOf, packState, parsePack, aboOf, parseAbo, fixedOf, parseFixed } from '../lib/booking/customers.js';
  import { listInvoices, setPrefill } from '../lib/pay/invoices.js';
  import { localDay } from '../lib/localday.js';
  import { vouchersOf, openVouchers, parseVoucher, voucherText } from '../lib/booking/vouchers.js';
  import { Users, X, Plus } from '@lucide/svelte';
  import '../lib/ich/ich.css';

  const customersQ = liveQuery(() => listCustomers());
  const customers = $derived($customersQ ?? null);
  const invoicesQ = liveQuery(() => listInvoices());
  const invoices = $derived($invoicesQ ?? []);

  let bookings = $state(null); // from the server, only while the page is open
  $effect(() => {
    db.settings.get(OFFERS_KEY).then(async (row) => {
      const all = await allBookings(row?.value ?? []);
      bookings = all.flatMap((o) => o.bookings.filter(holdsPlace).map((b) => ({ ...b, title: o.title })));
    });
  });

  const fmtAt = (at) => `${new Date(`${dayOf(at)}T12:00:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'numeric' })} · ${timeOf(at)}`;
  const sorted = $derived([...(customers ?? [])].sort((a, b) => a.name.localeCompare(b.name, locale())));

  let dlg = $state();
  let draft = $state(null); // { id|null, name, contact, note, rate }
  let error = $state('');
  $effect(() => {
    if (draft && dlg && !dlg.open) dlg.showModal();
  });
  const openNew = () => ((error = ''), (draft = { id: null, name: '', contact: '', note: '', rate: '', packSize: '', packPrice: '', packFrom: localDay(), abo: '', fixedDay: '', fixedTime: '', vouchers: [], vKind: 'amount', vValue: '' }));
  const openOne = (c) => ((error = ''), (draft = { id: c.id, name: c.name, contact: c.contact ?? '', note: c.note ?? '', rate: c.rate == null ? '' : chf(c.rate), packSize: packOf(c) ? String(packOf(c).size) : '', packPrice: packOf(c)?.price == null ? '' : chf(packOf(c).price), packFrom: packOf(c)?.from || localDay(), abo: aboOf(c) ? chf(aboOf(c).price) : '', fixedDay: fixedOf(c) ? String(fixedOf(c).weekday) : '', fixedTime: fixedOf(c)?.time ?? '', vouchers: vouchersOf(c).map((v) => ({ ...v })), vKind: 'amount', vValue: '' }));
  const current = $derived(draft?.id ? (customers ?? []).find((c) => c.id === draft.id) : null);
  const lessons = $derived(current && bookings ? lessonsOf(current, bookings).sort((a, b) => String(b.at).localeCompare(String(a.at))) : []);
  const openInvoices = $derived(current ? invoicesOf(current, invoices).filter((x) => x.status === 'open') : []);

  async function save(e) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return (error = t('Please enter a name.'));
    const rate = parseRate(draft.rate);
    if (rate === undefined) return (error = t('Please enter the price like 80 or 62.50, or leave it empty.'));
    const pack = parsePack(draft.packSize, draft.packPrice, draft.packFrom);
    if (pack === undefined) return (error = t('Please enter the card like 10 lessons and a price like 450, or leave it empty.'));
    const abo = parseAbo(draft.abo);
    if (abo === undefined) return (error = t('Please enter the subscription price like 200, or leave it empty.'));
    const fixed = parseFixed(draft.fixedDay, draft.fixedTime);
    if (fixed === undefined) return (error = t('Please choose a weekday and a time like 17:00, or leave both empty.'));
    const list = customers ?? [];
    if (list.some((c) => c.id !== draft.id && keyOf(c.name) === keyOf(name))) return (error = t('This customer is already in the list.'));
    const next = draft.id
      ? list.map((c) => (c.id === draft.id ? { ...c, name, contact: draft.contact.trim(), note: draft.note.trim(), rate, pack, abo, fixed, vouchers: draft.vouchers } : c))
      : [...list, { id: crypto.randomUUID(), name, contact: draft.contact.trim(), note: draft.note.trim(), rate, pack, abo, fixed, vouchers: draft.vouchers, createdAt: new Date().toISOString().slice(0, 10) }];
    await saveCustomers(next);
    dlg.close();
  }
  async function remove() {
    const c = current;
    if (!c) return;
    const answer = await askDelete({ title: t('Delete «{name}»?', { name: c.name }), text: t('The customer leaves this list. Lessons and invoices stay as they are.'), label: t('Delete') });
    if (answer !== 'delete') return;
    dlg.close();
    const before = customers ?? [];
    await deleteWithUndo({ run: async () => (await saveCustomers(before.filter((x) => x.id !== c.id)), before), undo: (saved) => saveCustomers(saved), text: t('«{name}» deleted.', { name: c.name }), name: c.name });
  }
  const nowAt = () => {
    const d = new Date();
    return `${localDay()}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const packText = (c) => {
    const st = bookings ? packState(c, bookings, nowAt()) : null;
    return st ? t('Card: {used} of {size} used', { used: st.used, size: st.size }) : packOf(c) ? t('{n}-lesson card', { n: packOf(c).size }) : '';
  };
  /* the card is sold by invoice: the form opens with name, price and text (nothing is sent here) */
  function invoiceForCard() {
    const p = parsePack(draft.packSize, draft.packPrice, draft.packFrom);
    if (!p) return (error = t('Please enter the card like 10 lessons and a price like 450, or leave it empty.'));
    setPrefill({ name: draft.name.trim(), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.trim()) ? draft.contact.trim() : '', amount: p.price == null ? '' : chf(p.price), purpose: t('{n}-lesson card', { n: p.size }) });
    location.hash = '#/me/pay/invoices/new';
  }
  const aboText = (c) => (aboOf(c) ? t('Subscription {price} CHF per month', { price: chf(aboOf(c).price) }) : '');
  /* the month's invoice: name, price and «Subscription, November 2026» (nothing is sent here) */
  function invoiceForAbo() {
    const a = parseAbo(draft.abo);
    if (!a) return (error = t('Please enter the subscription price like 200, or leave it empty.'));
    const month = new Date().toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
    setPrefill({ name: draft.name.trim(), email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact.trim()) ? draft.contact.trim() : '', amount: chf(a.price), purpose: t('Subscription, {month}', { month }) });
    location.hash = '#/me/pay/invoices/new';
  }
  function addVoucher() {
    const v = parseVoucher(draft.vKind, draft.vValue, crypto.randomUUID(), localDay());
    if (!v) return (error = draft.vKind === 'lessons' ? t('Please enter the number of lessons, like 5.') : t('Please enter the amount like 100 or 62.50.'));
    error = '';
    draft.vouchers = [...draft.vouchers, v];
    draft.vValue = '';
  }
  const dropVoucher = (id) => (draft.vouchers = draft.vouchers.filter((v) => v.id !== id));
  const voucherLine = (c) => (openVouchers(c).length ? t('Voucher: {text}', { text: openVouchers(c).map((v) => voucherText(v)).join(' + ') }) : '');
  const dayNames = Array.from({ length: 7 }, (_, i) => new Date(`2026-11-0${2 + i}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long' }));
  const fixedText = (c) => (fixedOf(c) ? t('Usual time {day} {time}', { day: dayNames[fixedOf(c).weekday], time: fixedOf(c).time }) : '');
  const rateText = (c) => (c.rate == null ? '' : t('{price} CHF per lesson', { price: chf(c.rate) }));
</script>

<div class="ich-page cust">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Offers'), href: '#/me/offers' }]} title={t('Customers')} sub={t('The people who book you, only on this device. Added when you confirm a request.')} />
  {#if customers && !customers.length}
    <Empty icon={Users} text={t('No customers yet. A person appears here when you confirm their request, or you add them yourself.')} action={{ label: t('Add a customer'), onclick: openNew }} action2={{ label: t('To your offers'), href: '#/me/offers' }} />
  {:else if customers}
    <section class="card" aria-labelledby="cu-h">
      <div class="cu-wh"><h2 id="cu-h">{tn(sorted.length, '{n} customer', '{n} customers')}</h2><button type="button" class="btn sm" onclick={openNew}><Plus size={16} aria-hidden="true" />{t('Add a customer')}</button></div>
      <ul class="cu-list">
        {#each sorted as c (c.id)}
          {@const n = bookings ? lessonsOf(c, bookings).length : null}
          {@const open = invoicesOf(c, invoices).filter((x) => x.status === 'open').length}
          <li><button type="button" class="cu-row" onclick={() => openOne(c)}>
            <span><b>{c.name}</b><small>{[c.contact, rateText(c), fixedText(c), voucherLine(c), packText(c), aboText(c), n != null ? tn(n, '{n} lesson', '{n} lessons') : '', open ? tn(open, '{n} open invoice', '{n} open invoices') : ''].filter(Boolean).join(' · ')}</small></span>
          </button></li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

{#if draft}
  <dialog class="sheet from-below cu-sheet" bind:this={dlg} use:backClose={() => dlg.close()} onclose={() => (draft = null)} aria-labelledby="cu-sh">
    <form onsubmit={save}>
      <div class="cu-sh"><h2 id="cu-sh">{draft.id ? draft.name || t('Customer') : t('New customer')}</h2><button type="button" class="ibtn" aria-label={t('Close')} onclick={() => dlg.close()}><X size={20} aria-hidden="true" /></button></div>
      <label class="lbl" for="cu-name">{t('Name')}</label><input id="cu-name" class="inp" bind:value={draft.name} maxlength="60" autocomplete="off" />
      <label class="lbl" for="cu-contact">{t('Phone or e-mail')}</label><input id="cu-contact" class="inp" bind:value={draft.contact} maxlength="80" autocomplete="off" />
      <label class="lbl" for="cu-rate">{t('Own price per lesson in CHF (empty: the price of the kind)')}</label><input id="cu-rate" class="inp" inputmode="decimal" bind:value={draft.rate} placeholder={t('e.g. 50')} />
      <h3 class="cu-h3">{t('Usual time')}</h3>
      <p class="muted">{t('For regular customers: when their usual time is free again, Heute suggests it with a ready message. Nothing is booked by itself.')}</p>
      <label class="lbl" for="cu-fday">{t('Weekday')}</label>
      <select id="cu-fday" class="inp" bind:value={draft.fixedDay}><option value="">{t('No usual time')}</option>{#each dayNames as d, i (i)}<option value={String(i)}>{d}</option>{/each}</select>
      <label class="lbl" for="cu-ftime">{t('Time (e.g. 17:00)')}</label><input id="cu-ftime" class="inp" type="time" bind:value={draft.fixedTime} />
      <h3 class="cu-h3">{t('Vouchers')}</h3>
      <p class="muted">{t('A voucher for an amount or a number of lessons. When you prepare an invoice for this person, it is taken off in the draft.')}</p>
      {#if draft.vouchers.length}<ul class="cu-mini">{#each draft.vouchers as v (v.id)}<li data-voucher>{v.code} · {voucherText(v)} <button type="button" class="lkb" aria-label={t('Remove voucher {code}', { code: v.code })} onclick={() => dropVoucher(v.id)}>{t('Remove')}</button></li>{/each}</ul>{/if}
      <label class="lbl" for="cu-vkind">{t('New voucher')}</label>
      <select id="cu-vkind" class="inp" bind:value={draft.vKind}><option value="amount">{t('Amount in CHF')}</option><option value="lessons">{t('Number of lessons')}</option></select>
      <input id="cu-vvalue" class="inp" inputmode="decimal" bind:value={draft.vValue} placeholder={draft.vKind === 'lessons' ? t('e.g. 5') : t('e.g. 100')} aria-label={t('Value of the voucher')} />
      <button type="button" class="btn sm" data-voucher-add onclick={addVoucher}>{t('Add voucher')}</button>
      <h3 class="cu-h3">{t('Lesson card')}</h3>
      <p class="muted">{t('For example 10 lessons for one price. The lessons from the start day on count against the card and need no invoice of their own.')}</p>
      <label class="lbl" for="cu-psize">{t('Lessons on the card (empty: no card)')}</label><input id="cu-psize" class="inp" inputmode="numeric" bind:value={draft.packSize} placeholder={t('e.g. 10')} />
      <label class="lbl" for="cu-pprice">{t('Price of the whole card in CHF')}</label><input id="cu-pprice" class="inp" inputmode="decimal" bind:value={draft.packPrice} placeholder={t('e.g. 450')} />
      <label class="lbl" for="cu-pfrom">{t('Counts from')}</label><input id="cu-pfrom" type="date" class="inp" bind:value={draft.packFrom} />
      {#if draft.packSize.trim()}<button type="button" class="btn sm" data-card-invoice onclick={invoiceForCard}>{t('Prepare invoice for the card')}</button>{/if}
      <h3 class="cu-h3">{t('Subscription')}</h3>
      <p class="muted">{t('A fixed price every month. Each month you prepare the invoice with one tap; nothing is sent by itself.')}</p>
      <label class="lbl" for="cu-abo">{t('Price per month in CHF (empty: no subscription)')}</label><input id="cu-abo" class="inp" inputmode="decimal" bind:value={draft.abo} placeholder={t('e.g. 200')} />
      {#if draft.abo.trim()}<button type="button" class="btn sm" data-abo-invoice onclick={invoiceForAbo}>{t("Prepare this month's invoice")}</button>{/if}
      <label class="lbl" for="cu-note">{t('Your note')}</label><textarea id="cu-note" class="inp" rows="3" maxlength="500" bind:value={draft.note}></textarea>
      {#if current}
        <h3 class="cu-h3">{t('Lessons with this customer')}</h3>
        {#if !bookings}<p class="muted">{t('Loading…')}</p>
        {:else if !lessons.length}<p class="muted">{t('No lessons yet.')}</p>
        {:else}<ul class="cu-mini">{#each lessons as b (b.id)}<li>{fmtAt(b.at)} · {b.title}</li>{/each}</ul>{/if}
        <h3 class="cu-h3">{t('Open invoices of this customer')}</h3>
        {#if !openInvoices.length}<p class="muted">{t('No open invoices.')}</p>
        {:else}<ul class="cu-mini">{#each openInvoices as x (x.id)}<li><a href={`#/me/pay/invoices/${x.id}`}>{x.no}</a> · {chf(x.amount)} CHF</li>{/each}</ul>{/if}
      {/if}
      {#if error}<p class="err" role="alert">{error}</p>{/if}
      <div class="cu-foot">
        <button type="submit" class="btn hi">{t('Save')}</button>
        <button type="button" class="btn" onclick={() => dlg.close()}>{t('Cancel')}</button>
        {#if current}<button type="button" class="lkb cu-red" onclick={remove}>{t('Delete')}</button>{/if}
      </div>
    </form>
  </dialog>
{/if}

<style>
  .cu-wh { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
  .cu-wh h2 { margin: 0; font-size: var(--fs-section); }
  .cu-list { list-style: none; margin: 8px 0 0; padding: 0; }
  .cu-list > li + li { border-top: 1px solid var(--line); }
  .cu-row { display: flex; width: 100%; text-align: left; background: none; border: 0; padding: 12px 0; color: inherit; font: inherit; cursor: pointer; min-height: 44px; }
  .cu-row small { display: block; color: var(--ink-2); }
  .cu-sheet form, .cu-sheet { display: grid; gap: 8px; }
  .cu-sh { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
  .cu-sh h2 { margin: 0; font-size: var(--fs-section); }
  .cu-h3 { margin: 10px 0 0; font-size: var(--fs-body); }
  .cu-mini { margin: 0; padding-left: 18px; }
  .cu-foot { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; align-items: center; }
  .cu-red { color: var(--bad); margin-left: auto; }
</style>
