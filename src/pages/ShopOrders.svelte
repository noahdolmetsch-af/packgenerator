<script>
  /**
   * Ich › Bezahlen › Shop › Bestellungen (#/me/shop/orders; mockup SHOP3a, Noah 14.10.2026 04:00 «a»,
   * 03:55 «3a»: orders in the app). New orders come from the server when the page opens; then the
   * server forgets them and they live in the app's list (and the backup). Alle / Zu tun / Offen /
   * Fertig. «Bezahlt» or «Bezahlt + Mail» (the own confirmation mail, SHOP4b); things by post then
   * wait: «Etikette erstellen» copies the address for the label on post.ch, «Versendet» takes the
   * tracking number.
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import { askDelete } from '../lib/ui/ask.js';
  import ShopTabs from '../lib/pay/ShopTabs.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t, tn, dateOf } from '../lib/i18n.svelte.js';
  import { Check, Mail, Package, Send, Trash2 } from '@lucide/svelte';
  import { listOrders, syncOrders, markOrderPaid, markOrderSent, markOrderMailed, deleteOrder, ordersSummary, linesLine, labelText, orderMail, listProducts, readInfo } from '../lib/pay/myshop.js';
  import { mailtoHref } from '../lib/pay/invoices.js';
  import { formatAmount } from '../lib/pay/qrbill.js';
  import '../lib/ich/ich.css';

  const POST_URL = 'https://www.post.ch/de/pakete-versenden/paket-online-frankieren';

  let list = $state([]);
  let loaded = $state(false);
  let tab = $state('all');
  let done = $state('');
  let sending = $state(null); // id whose tracking field shows
  let track = $state('');
  let refresh = $state(0);

  async function load() {
    list = await listOrders();
    loaded = true;
    refresh++;
  }
  load().then(async () => {
    const n = await syncOrders();
    if (n) {
      done = tn(n, '{n} new order', '{n} new orders');
      await load();
    }
  });

  const sum = $derived(ordersSummary(list));
  const shown = $derived(tab === 'todo' ? list.filter((o) => o.status === 'todo') : tab === 'open' ? list.filter((o) => o.status === 'open') : tab === 'finished' ? list.filter((o) => o.status === 'sent' || o.status === 'done') : list);
  const wayName = (o) => (o.way === 'twint' ? 'TWINT' : t('QR bill'));

  function stateLine(o) {
    if (o.status === 'open') return t('waits for payment');
    if (o.status === 'todo') return t('paid {date}', { date: dateOf(o.paidAt) });
    if (o.status === 'sent') return t('sent {date}', { date: dateOf(o.sentAt) }) + (o.track ? ' · ' + t('Tracking no. {no}', { no: o.track }) : '');
    return t('done {date}', { date: dateOf(o.paidAt) });
  }

  async function paid(o, mail = false) {
    const next = await markOrderPaid(o.id);
    done = t('#{no} is marked as paid.', { no: o.no });
    if (mail) await sendMail(next);
    await load();
  }
  async function sendMail(o) {
    const [info, products] = await Promise.all([readInfo(), listProducts()]);
    await markOrderMailed(o.id);
    location.href = mailtoHref(o.buyer.email, orderMail(o, info, products, t));
  }
  async function label(o) {
    try {
      await navigator.clipboard.writeText(labelText(o));
      done = t('Address copied. Paste it on post.ch for the label.');
    } catch {
      done = labelText(o);
    }
    window.open(POST_URL, '_blank', 'noopener');
  }
  async function sent(o) {
    await markOrderSent(o.id, track);
    sending = null;
    track = '';
    done = t('#{no} is sent.', { no: o.no });
    await load();
  }
  async function remove(o) {
    if ((await askDelete({ title: t('Delete order #{no}?', { no: o.no }) })) !== 'delete') return;
    await deleteOrder(o.id);
    await load();
  }
</script>

<div class="ich-page sorders">
  <VeloHead
    crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Payments'), href: '#/me/pay' }, { label: t('Shop'), href: '#/me/shop' }]}
    title={t('Orders')}
    sub={loaded ? (list.length ? `${tn(sum.todo, '{n} to send', '{n} to send')} · ${tn(sum.open, '{n} waits for payment', '{n} wait for payment')}` : t('No orders yet.')) : ''}
  />
  <ShopTabs value="orders" {refresh} />
  {#if done}<p class="so-done" role="status">{done}</p>{/if}

  {#if list.length}
    <div class="so-tabs">
      <Seg full={false} label={t('Show')} value={tab} onchange={(v) => (tab = v)} options={[{ key: 'all', name: t('All') }, { key: 'todo', name: t('To do'), n: sum.todo }, { key: 'open', name: t('Open|invoices'), n: sum.open }, { key: 'finished', name: t('Finished'), n: sum.finished }]} />
    </div>
    {#if shown.length}
      <ul class="card ich-list so-list">
        {#each shown as o (o.id)}
          <li class="so-row" data-testid="order-row">
            <span class="so-who">
              <b>#{o.no} · {o.buyer.name} · <span class="num">{formatAmount(o.total)} CHF</span></b>
              <small>{linesLine(o)} · {wayName(o)} · {stateLine(o)}</small>
              {#if o.status === 'todo' && o.buyer.address}<small>{t('To')}: {o.buyer.address}</small>{/if}
            </span>
            {#if o.status === 'open'}<span class="pill act">{t('open|order')}</span>
            {:else if o.status === 'todo'}<span class="pill act">{t('to send')}</span>
            {:else if o.status === 'sent'}<span class="pill">{t('sent|order')}</span>
            {:else}<span class="pill">{t('done|order')}</span>{/if}
            <span class="so-acts">
              {#if o.status === 'open'}
                <button class="btn sm" type="button" onclick={() => paid(o)}><Check size={16} aria-hidden="true" />{t('Paid')}</button>
                <button class="btn sm" type="button" onclick={() => paid(o, true)}><Mail size={16} aria-hidden="true" />{t('Paid + mail')}</button>
              {:else if o.status === 'todo'}
                <button class="btn sm" type="button" onclick={() => label(o)}><Package size={16} aria-hidden="true" />{t('Make the label')}</button>
                <button class="btn sm" type="button" aria-expanded={sending === o.id} onclick={() => ((sending = sending === o.id ? null : o.id), (track = ''))}><Send size={16} aria-hidden="true" />{t('Sent')}</button>
              {/if}
              {#if o.status !== 'open'}<button class="btn btn-link sm" type="button" onclick={() => sendMail(o)}><Mail size={15} aria-hidden="true" />{o.mailed ? t('Mail again') : t('Confirmation mail')}</button>{/if}
              <button class="btn btn-link sm" type="button" onclick={() => remove(o)} aria-label={t('Delete order #{no}?', { no: o.no })}><Trash2 size={15} aria-hidden="true" /></button>
            </span>
            {#if sending === o.id}
              <div class="so-send">
                <label class="field"><span class="lbl">{t('Tracking number (optional)')}</span><input class="inp num" bind:value={track} /></label>
                <button class="btn hi sm" type="button" onclick={() => sent(o)}>{t('Mark as sent')}</button>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
    <p class="ich-fine">{t('All orders in one place, by TWINT and QR bill. Buyer data is on the server only until this page fetched it, then only here.')}</p>
  {:else if loaded}
    <p class="ich-fine">{t('Orders from your shop link show up here.')}</p>
  {/if}
</div>

<style>
  .so-done {
    margin: 0 0 12px;
    color: var(--ok);
    font-weight: 600;
    overflow-wrap: break-word;
    white-space: pre-line;
  }
  .so-tabs {
    margin: 0 0 12px;
  }
  .so-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 14px;
    align-items: center;
    padding: 12px 16px;
  }
  .so-who {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .so-who b {
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .so-who small {
    color: var(--ink-3);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .so-acts {
    grid-column: 1 / -1;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .so-send {
    grid-column: 1 / -1;
    display: flex;
    gap: 10px;
    align-items: flex-end;
    flex-wrap: wrap;
    background: var(--paper-2);
    border-radius: 12px;
    padding: 10px 14px;
  }
  .so-send .field {
    display: block;
    margin: 0;
    flex: 1 1 220px;
  }
</style>
