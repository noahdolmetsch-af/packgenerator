<script>
  /**
   * One product as a card (mockups SHOP1 + SHOP2a/b): a quiet picture band with the kind's icon,
   * the name, how it arrives, the price (+ postage) and a pill: Download, Code or Versand with
   * «noch 4 da». The same card in the seller's shop and in the shop link; `children` holds the
   * buttons below (edit, or «In den Warenkorb»).
   */
  import { t } from '../i18n.svelte.js';
  import { formatAmount } from './qrbill.js';
  import { List, KeyRound, Package } from '@lucide/svelte';

  let { p, children } = $props();
  const ICON = { download: List, code: KeyRound, post: Package };
  const Icon = $derived(ICON[p.kind] ?? List);
  const how = $derived(p.kind === 'download' ? t('Digital · download by mail') : p.kind === 'code' ? t('Digital · unlock code by mail') : t('Real · sent by post'));
  const pill = $derived(p.kind === 'download' ? t('Download') : p.kind === 'code' ? t('Code') : t('Post|shipping'));
  const out = $derived(p.kind === 'post' && p.stock === 0);
</script>

<article class="card pc" class:out data-testid="product-card">
  <div class="pc-pic" aria-hidden="true"><Icon size={30} /></div>
  <div class="pc-body">
    <h3>{p.name}</h3>
    <small>{how}</small>
    {#if p.note}<p class="pc-note">{p.note}</p>{/if}
    <p class="pc-price num"><b>{formatAmount(p.price)} CHF</b>{#if p.kind === 'post' && p.ship}<span> + {t('{amount} postage', { amount: formatAmount(p.ship) })}</span>{/if}</p>
    <p class="pc-tags">
      <span class="pill" class:act={p.kind === 'post'}>{pill}</span>
      {#if p.kind === 'post' && p.stock != null}<small>{out ? t('sold out') : t('{n} left', { n: p.stock })}</small>{/if}
    </p>
    {@render children?.()}
  </div>
</article>

<style>
  .pc {
    padding: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .pc.out {
    opacity: 0.7;
  }
  .pc-pic {
    height: 96px;
    display: grid;
    place-items: center;
    background: var(--paper-2);
    color: var(--ink-2);
  }
  .pc-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  .pc h3 {
    margin: 0;
    font-size: var(--fs-sub);
    font-weight: 700;
    overflow-wrap: break-word;
  }
  .pc small {
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pc-note {
    margin: 2px 0 0;
    color: var(--ink-2);
    font-size: var(--fs-small);
    overflow-wrap: break-word;
  }
  .pc-price {
    margin: 6px 0 0;
  }
  .pc-price span {
    margin-left: 4px;
    color: var(--ink-3);
    font-size: var(--fs-small);
  }
  .pc-tags {
    margin: 4px 0 0;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
</style>
