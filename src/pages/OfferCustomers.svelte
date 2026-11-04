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
  import { listCustomers, saveCustomers, keyOf, parseRate, lessonsOf, invoicesOf } from '../lib/booking/customers.js';
  import { listInvoices } from '../lib/pay/invoices.js';
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
  const openNew = () => ((error = ''), (draft = { id: null, name: '', contact: '', note: '', rate: '' }));
  const openOne = (c) => ((error = ''), (draft = { id: c.id, name: c.name, contact: c.contact ?? '', note: c.note ?? '', rate: c.rate == null ? '' : chf(c.rate) }));
  const current = $derived(draft?.id ? (customers ?? []).find((c) => c.id === draft.id) : null);
  const lessons = $derived(current && bookings ? lessonsOf(current, bookings).sort((a, b) => String(b.at).localeCompare(String(a.at))) : []);
  const openInvoices = $derived(current ? invoicesOf(current, invoices).filter((x) => x.status === 'open') : []);

  async function save(e) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return (error = t('Please enter a name.'));
    const rate = parseRate(draft.rate);
    if (rate === undefined) return (error = t('Please enter the price like 80 or 62.50, or leave it empty.'));
    const list = customers ?? [];
    if (list.some((c) => c.id !== draft.id && keyOf(c.name) === keyOf(name))) return (error = t('This customer is already in the list.'));
    const next = draft.id
      ? list.map((c) => (c.id === draft.id ? { ...c, name, contact: draft.contact.trim(), note: draft.note.trim(), rate } : c))
      : [...list, { id: crypto.randomUUID(), name, contact: draft.contact.trim(), note: draft.note.trim(), rate, createdAt: new Date().toISOString().slice(0, 10) }];
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
            <span><b>{c.name}</b><small>{[c.contact, rateText(c), n != null ? tn(n, '{n} lesson', '{n} lessons') : '', open ? tn(open, '{n} open invoice', '{n} open invoices') : ''].filter(Boolean).join(' · ')}</small></span>
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
