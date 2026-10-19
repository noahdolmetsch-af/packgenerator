<script>
  /**
   * Ich › Bezahlen › Shop (#/me/shop; mockup SHOP1, Noah 14.10.2026 04:00 «a»; 03:53 «digital und
   * echt»): digital and real things in one place. Noah adds products (download, unlock code, or a
   * real thing by post with postage and stock), copies the shop link for anyone without the app
   * (SHOP2b) and looks at it as a buyer (SHOP2a). Payment by TWINT or QR bill from the account on
   * this device, no fees. Orders: the tab «Bestellungen» (SHOP3a).
   */
  import VeloHead from '../lib/bikes/VeloHead.svelte';
  import ProductCard from '../lib/pay/ProductCard.svelte';
  import ShopTabs from '../lib/pay/ShopTabs.svelte';
  import Seg from '../lib/ui/Seg.svelte';
  import { t } from '../lib/i18n.svelte.js';
  import { Plus, Link, Eye, Pencil, Trash2, Store } from '@lucide/svelte';
  import { listProducts, saveProduct, deleteProduct, readInfo, writeInfo, shopLink, payWays } from '../lib/pay/myshop.js';
  import { readAccount } from '../lib/pay/invoices.js';
  import { readKey, boxOf } from '../lib/pay/report.js';
  import { formatAmount, parseAmount } from '../lib/pay/qrbill.js';
  import '../lib/ich/ich.css';

  const account = readAccount();
  const ways = payWays(account);
  const ready = ways.twint || ways.qr;
  let products = $state([]);
  let shopName = $state('');
  let loaded = $state(false);
  let form = $state(null); // { id?, name, kind, price, ship, stock, note, link }
  let formError = $state('');
  let done = $state('');

  async function load() {
    [products, shopName] = await Promise.all([listProducts(), readInfo().then((i) => i.name || account?.name || '')]);
    loaded = true;
  }
  load();

  const blank = () => ({ name: '', kind: 'download', price: '', ship: '9.00', stock: '', note: '', link: '' });
  const edit = (p) => (form = { ...p, price: formatAmount(p.price), ship: formatAmount(p.ship ?? 0), stock: p.stock == null ? '' : String(p.stock), link: p.link ?? '' });

  async function save() {
    const price = form.price === '0' || form.price === '0.00' ? 0 : parseAmount(form.price);
    if (!form.name.trim()) return (formError = t('Please give the product a name.'));
    if (price == null) return (formError = t('Please enter a price, for example 5.00.'));
    const ship = form.kind === 'post' ? (String(form.ship).trim() ? parseAmount(form.ship) : 0) : 0;
    if (ship == null) return (formError = t('Please enter the postage, for example 9.00.'));
    const stock = String(form.stock).trim() === '' ? null : Number(form.stock);
    if (stock != null && !(Number.isInteger(stock) && stock >= 0)) return (formError = t('Stock is a whole number, or empty for no limit.'));
    const p = await saveProduct({ ...$state.snapshot(form), price, ship, stock });
    done = t('{name} is in the shop.', { name: p.name });
    form = null;
    formError = '';
    await load();
  }
  async function remove() {
    if (!confirm(t('Remove {name} from the shop?', { name: form.name }))) return;
    await deleteProduct(form.id);
    form = null;
    await load();
  }

  async function link() {
    const key = readKey();
    return key ? shopLink(products, { name: shopName }, account, await boxOf(key)) : '';
  }
  async function copyLink() {
    await writeInfo({ name: shopName });
    const l = await link();
    try {
      await navigator.clipboard.writeText(l);
      done = t('Shop link copied. Send it to whoever should buy.');
    } catch {
      done = l;
    }
  }
  async function preview() {
    await writeInfo({ name: shopName });
    const l = await link();
    location.hash = l.slice(l.indexOf('#'));
  }
</script>

<div class="ich-page shop">
  <VeloHead crumbs={[{ label: t('Me|place'), href: '#/me' }, { label: t('Payments'), href: '#/me/pay' }]} title={t('Shop')} sub={t('Digital and real things in one place. No fees: TWINT or QR bill.')} />
  <ShopTabs value="products" />

  {#if !ready}
    <p class="card shop-need" role="note">
      <Store size={18} aria-hidden="true" />
      <span>{t('The shop takes money by TWINT or QR bill to your account. Enter your account once under «New QR invoice».')} <a href="#/me/pay/invoices/new">{t('Enter account')}</a></span>
    </p>
  {/if}

  <div class="shop-bar">
    <button class="btn hi" type="button" onclick={() => ((form = blank()), (formError = ''), (done = ''))}><Plus size={18} aria-hidden="true" />{t('New product')}</button>
    {#if products.length && ready}
      <button class="btn" type="button" onclick={copyLink}><Link size={18} aria-hidden="true" />{t('Copy shop link')}</button>
      <button class="btn" type="button" onclick={preview}><Eye size={18} aria-hidden="true" />{t('View as buyer')}</button>
    {/if}
  </div>
  {#if done}<p class="shop-done" role="status">{done}</p>{/if}

  {#if form}
    <section class="card shop-form" aria-labelledby="sf-h">
      <h2 id="sf-h">{form.id ? t('Edit product') : t('New product')}</h2>
      <label class="field"><span class="lbl">{t('Name')}</span><input class="inp" bind:value={form.name} /></label>
      <div class="field">
        <span class="lbl" id="sf-kind">{t('How it arrives')}</span>
        <Seg full={false} labelledby="sf-kind" value={form.kind} onchange={(v) => (form.kind = v)} options={[{ key: 'download', name: t('Download') }, { key: 'code', name: t('Code') }, { key: 'post', name: t('Post|shipping') }]} />
      </div>
      <div class="shop-pair">
        <label class="field"><span class="lbl">{t('Price (CHF)')}</span><input class="inp num" bind:value={form.price} inputmode="decimal" placeholder="5.00" /></label>
        {#if form.kind === 'post'}<label class="field"><span class="lbl">{t('Postage (CHF)')}</span><input class="inp num" bind:value={form.ship} inputmode="decimal" placeholder="9.00" /></label>{/if}
      </div>
      {#if form.kind === 'post'}<label class="field"><span class="lbl">{t('In stock (empty = no limit)')}</span><input class="inp num" bind:value={form.stock} inputmode="numeric" /></label>{/if}
      {#if form.kind === 'download'}<label class="field"><span class="lbl">{t('Download link (stays on this device, goes into the mail)')}</span><input class="inp" bind:value={form.link} type="url" placeholder="https://" /></label>{/if}
      <label class="field"><span class="lbl">{t('Short description (optional)')}</span><input class="inp" bind:value={form.note} /></label>
      {#if formError}<p class="shop-err" role="alert">{formError}</p>{/if}
      <div class="shop-btns">
        <button class="btn hi" type="button" onclick={save}>{t('Save')}</button>
        <button class="btn" type="button" onclick={() => ((form = null), (formError = ''))}>{t('Cancel')}</button>
        {#if form.id}<button class="btn btn-link sm" type="button" onclick={remove}><Trash2 size={15} aria-hidden="true" />{t('Remove')}</button>{/if}
      </div>
    </section>
  {/if}

  {#if products.length}
    <div class="shop-grid">
      {#each products as p (p.id)}
        <ProductCard {p}>
          <button class="btn sm shop-edit" type="button" onclick={() => edit(p)} aria-label={t('Edit {name}', { name: p.name })}><Pencil size={15} aria-hidden="true" />{t('Edit')}</button>
        </ProductCard>
      {/each}
    </div>
    <label class="field shop-name"><span class="lbl">{t('Shop name (on the shop link)')}</span><input class="inp" bind:value={shopName} onchange={() => writeInfo({ name: shopName })} /></label>
    <p class="ich-fine">{t('Digital: the buyer gets the download or code by mail once you mark the order paid. Real: you get a parcel to send, with the address.')}</p>
  {:else if loaded && !form}
    <p class="ich-fine">{t('No products yet. Add the first one with «New product».')}</p>
  {/if}
</div>

<style>
  .field {
    display: block;
    margin: 0 0 12px;
  }
  .shop-need {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 16px;
    margin: 0 0 12px;
  }
  .shop-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 0 0 16px;
  }
  .shop-done {
    margin: 0 0 12px;
    color: var(--ok);
    font-weight: 600;
    overflow-wrap: break-word;
  }
  .shop-err {
    margin: 0 0 10px;
    color: var(--bad);
    font-weight: 600;
  }
  .shop-form {
    padding: 18px 20px;
    margin: 0 0 16px;
    max-width: 640px;
  }
  .shop-form h2 {
    margin: 0 0 10px;
    font-size: var(--fs-sub);
  }
  .shop-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .shop-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }
  .shop-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin: 0 0 16px;
  }
  .shop-edit {
    align-self: flex-start;
    margin-top: 8px;
  }
  .shop-name {
    max-width: 420px;
  }
</style>
