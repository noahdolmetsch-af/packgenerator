<script>
  /**
   * The shop link (#/laden/<data>; mockups SHOP2a + SHOP2b, Noah 14.10.2026 04:00 «a», 03:55 «2a und
   * b»): the same page is the shop in the app and the public shop for anyone without the app or an
   * account. The shop sits in the link itself; only the order goes to the server (into the seller's
   * box). Payment by TWINT or QR bill to the seller, no fees: after «Bestellen» the page shows the
   * order number and how to pay. Address only when something comes by post.
   */
  import { untrack } from 'svelte';
  import ProductCard from '../lib/pay/ProductCard.svelte';
  import BillPreview from '../lib/pay/BillPreview.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { Plus, Minus, ShoppingCart, Check } from '@lucide/svelte';
  import { readShopLink, available, cartTotal, needsAddress, placeOrder, orderRef, orderMessage } from '../lib/pay/myshop.js';
  import { formatAmount } from '../lib/pay/qrbill.js';
  import '../lib/ich/ich.css';

  let { part = '' } = $props();
  const shop = untrack(() => readShopLink(part)); // the page is keyed on the link
  let qty = $state({}); // { [id]: n }
  let buyer = $state({ name: '', email: '', address: '' });
  let way = $state(shop?.twint ? 'twint' : 'qr');
  let busy = $state(false);
  let error = $state('');
  let placed = $state(null); // { no, total, way }

  const cart = $derived(shop ? shop.products.filter((p) => qty[p.id] > 0).map((p) => ({ ...p, qty: qty[p.id] })) : []);
  const sum = $derived(cartTotal(cart));
  const post = $derived(needsAddress(cart));
  const max = (p) => (p.kind === 'post' && p.stock != null ? Math.min(p.stock, 20) : 20);
  const add = (p, d) => (qty = { ...qty, [p.id]: Math.max(0, Math.min(max(p), (qty[p.id] ?? 0) + d)) });

  async function order() {
    error = '';
    if (!buyer.name.trim()) return (error = t('Please enter your name.'));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyer.email.trim())) return (error = t('Please enter your e-mail, for the confirmation.'));
    if (post && !buyer.address.trim()) return (error = t('Please enter the address for the parcel.'));
    busy = true;
    try {
      const r = await placeOrder(shop, cart, { name: buyer.name.trim(), email: buyer.email.trim(), ...(post ? { address: buyer.address.trim() } : {}) }, way);
      placed = { no: r.no, total: r.total, way };
    } catch {
      error = t('That did not work. Please try again later, or write to {name}.', { name: shop.name });
    } finally {
      busy = false;
    }
  }
  const ref = $derived(placed && shop.account ? orderRef(shop.account, placed.no) : null);
</script>

<div class="ich-page sbuy">
  {#if !shop}
    <h1>{t('Shop')}</h1>
    <p class="ich-fine" role="alert">{t('This link is not complete. Please ask for the shop link again.')}</p>
  {:else if placed}
    <h1>{t('Thank you!')}</h1>
    <p class="sbuy-sub">{t('Your order #{no} is in. Please pay {amount} CHF:', { no: placed.no, amount: formatAmount(placed.total) })}</p>
    <div class="sbuy-paid" data-testid="order-placed">
      {#if placed.way === 'twint'}
        <div class="card sbuy-way">
          <span class="sbuy-tw" aria-hidden="true">TWINT</span>
          <span>{t('To|twint')} <b class="num">{shop.twint}</b> · <b class="num">{formatAmount(placed.total)} CHF</b><br />{t('Message|twint')}: <b>{orderMessage(placed.no)}</b></span>
        </div>
      {:else if shop.account}
        <BillPreview account={shop.account} bill={{ no: orderMessage(placed.no), amount: placed.total, purpose: t('Order {no}', { no: orderMessage(placed.no) }), ref: ref.ref, refType: ref.type, ways: { qr: true } }} heading={t('Pay with your banking app')} />
      {/if}
      <p class="sbuy-done" role="status"><Check size={18} aria-hidden="true" /> {t('You get a confirmation by mail from {name} once the money has arrived.', { name: shop.name })}</p>
    </div>
  {:else}
    <h1>{shop.name ? t('{name} · Shop', { name: shop.name }) : t('Shop')}</h1>
    <p class="sbuy-sub">{t('No app, no account. Just order.')}</p>
    <div class="sbuy-two" class:one={!cart.length}>
      <div class="sbuy-grid">
        {#each shop.products as p (p.id)}
          <ProductCard {p}>
            {#if !available(p)}
              <!-- sold out: the card says so -->
            {:else if qty[p.id] > 0}
              <span class="sbuy-qty" role="group" aria-label={t('How many {name}', { name: p.name })}>
                <button class="btn sm" type="button" onclick={() => add(p, -1)} aria-label={t('One less')}><Minus size={15} aria-hidden="true" /></button>
                <b class="num">{qty[p.id]}</b>
                <button class="btn sm" type="button" disabled={qty[p.id] >= max(p)} onclick={() => add(p, 1)} aria-label={t('One more')}><Plus size={15} aria-hidden="true" /></button>
              </span>
            {:else}
              <button class="btn sm sbuy-add" type="button" onclick={() => add(p, 1)}><ShoppingCart size={15} aria-hidden="true" />{t('Add to cart')}</button>
            {/if}
          </ProductCard>
        {/each}
      </div>

      {#if cart.length}
        <section class="card sbuy-cart" aria-labelledby="cart-h">
          <h2 id="cart-h">{t('Cart')}</h2>
          <ul class="sbuy-lines">
            {#each cart as l (l.id)}
              <li><b>{l.qty > 1 ? `${l.qty}× ` : ''}{l.name}</b><small>{l.kind === 'post' ? t('Post|shipping') : l.kind === 'code' ? t('Code') : t('Download')} · {formatAmount(l.price * l.qty)} CHF</small></li>
            {/each}
            {#if sum.ship}<li><b>{t('Postage')}</b><small>{formatAmount(sum.ship)} CHF</small></li>{/if}
          </ul>
          <label class="field"><span class="lbl">{t('Your name')}</span><input class="inp" bind:value={buyer.name} autocomplete="name" /></label>
          {#if post}<label class="field"><span class="lbl">{t('Delivery address (only for post)')}</span><input class="inp" bind:value={buyer.address} autocomplete="street-address" placeholder={t('Street and no., postcode and town')} /></label>{/if}
          <label class="field"><span class="lbl">{t('E-mail')}</span><input class="inp" type="email" bind:value={buyer.email} autocomplete="email" /></label>
          <div class="field">
            <span class="lbl" id="cart-way">{t('Pay with')}</span>
            <Seg full={false} chips labelledby="cart-way" value={way} onchange={(v) => (way = v)} options={[...(shop.twint ? [{ key: 'twint', name: 'TWINT' }] : []), ...(shop.account ? [{ key: 'qr', name: t('QR bill') }] : [])]} />
          </div>
          {#if error}<p class="sbuy-err" role="alert">{error}</p>{/if}
          <button class="btn hi" type="button" disabled={busy} onclick={order}>{t('Order · {amount} CHF', { amount: formatAmount(sum.total) })}</button>
          <p class="ich-fine">{t('No fees. You pay {name} directly, by TWINT or with your banking app.', { name: shop.name || t('the shop') })}</p>
        </section>
      {/if}
    </div>
  {/if}
</div>

<style>
  .field {
    display: block;
    margin: 0 0 12px;
  }
  .sbuy h1 {
    margin: 8px 0 4px;
    text-wrap: balance;
    overflow-wrap: break-word;
  }
  .sbuy-sub {
    margin: 0 0 18px;
    color: var(--ink-3);
  }
  .sbuy-two {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }
  .sbuy-two.one {
    grid-template-columns: minmax(0, 1fr);
  }
  @media (max-width: 1099px) {
    .sbuy-two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sbuy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    min-width: 0;
  }
  .sbuy-add,
  .sbuy-qty {
    margin-top: 8px;
    align-self: flex-start;
  }
  .sbuy-qty {
    display: inline-flex;
    gap: 10px;
    align-items: center;
  }
  .sbuy-cart {
    padding: 18px 20px;
    min-width: 0;
  }
  .sbuy-cart h2 {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
  }
  .sbuy-lines {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .sbuy-lines li {
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    overflow-wrap: break-word;
  }
  .sbuy-lines li + li {
    border-top: 1px solid var(--line);
  }
  .sbuy-lines small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .sbuy-err {
    margin: 0 0 10px;
    color: var(--bad);
    font-weight: 600;
  }
  .sbuy-paid {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 560px;
  }
  .sbuy-way {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 14px 16px;
    overflow-wrap: break-word;
  }
  .sbuy-tw {
    flex: none;
    min-width: 56px;
    padding: 8px 6px;
    border-radius: 10px;
    background: var(--ink);
    color: var(--paper);
    font-weight: 700;
    font-size: var(--fs-small);
    text-align: center;
  }
  .sbuy-done :global(svg) {
    flex: none;
  }
  .sbuy-done {
    display: flex;
    gap: 8px;
    align-items: center;
    color: var(--ok);
    font-weight: 600;
    margin: 0;
  }
</style>
